import React, { useEffect, useRef, useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Info, Maximize2, RefreshCw, Activity, Shield, FileCode, Network, User, Target, Copy, Check, Clock, Filter, HelpCircle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from '../ui/button';
import { GraphNode, GraphEdge } from '../../types';

export default function BehaviorGraph() {
  const { events, setActivePage } = useTelemetry();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState<Set<string>>(new Set());

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || events.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Build nodes and links from events
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphEdge[] = [];

    const addNode = (id: string, type: GraphNode['type'], label: string, metadata: any = {}) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, type, label, metadata });
      }
      return nodesMap.get(id)!;
    };

    events.forEach(event => {
      // Process node
      const procNode = addNode(event.pid, 'process', event.process_name, { 
        cmd: event.command_line,
        user: event.user,
        category: event.category,
        mitre: event.mitre_mapping,
        timestamp: event.timestamp
      });

      // User node
      const userNode = addNode(event.user, 'user', event.user);
      links.push({ source: userNode.id, target: procNode.id, type: 'executed' });

      // Parent process node
      if (event.parent_pid && event.parent_pid !== '0' && event.parent_pid !== '-1') {
        const parentNode = addNode(event.parent_pid, 'process', 'parent_proc');
        links.push({ source: parentNode.id, target: procNode.id, type: 'spawned' });
      }

      // File node
      if (event.file_path) {
        const fileNode = addNode(event.file_path, 'file', event.file_path.split('/').pop() || event.file_path);
        links.push({ source: procNode.id, target: fileNode.id, type: event.event_type === 'file_write' ? 'wrote_to' : 'modified' });
      }

      // Network / Socket node
      if (event.category === 'network') {
        const socketId = `socket-${event.pid}-${Math.random()}`;
        const socketNode = addNode(socketId, 'socket', 'Network Socket');
        links.push({ source: procNode.id, target: socketNode.id, type: 'connected' });
      }

      // Dylib node
      if (event.event_type === 'image_load') {
        const dylibId = `dylib-${event.pid}-${Math.random()}`;
        const dylibNode = addNode(dylibId, 'dylib', 'lib.dylib');
        links.push({ source: procNode.id, target: dylibNode.id, type: 'loaded' });
      }
    });

    const nodes = Array.from(nodesMap.values()).filter(n => 
      typeFilter === 'all' ? true : n.type === typeFilter
    );

    // Filter links to only include those between existing nodes
    const filteredLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return nodesMap.has(sourceId) && nodesMap.has(targetId) && 
             nodes.some(n => n.id === sourceId) && nodes.some(n => n.id === targetId);
    });

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphEdge>(filteredLinks).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#D2D2D7");

    const link = svg.append("g")
      .selectAll("g")
      .data(filteredLinks)
      .join("g")
      .attr("class", "link-group");

    link.append("line")
      .attr("stroke", d => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const linkId = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkId) ? "#0071E3" : "#D2D2D7";
      })
      .attr("stroke-opacity", d => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const linkId = `${sourceId}-${targetId}`;
        return highlightedLinks.size > 0 ? (highlightedLinks.has(linkId) ? 1 : 0.1) : 0.4;
      })
      .attr("stroke-width", d => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const linkId = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkId) ? 2 : 1;
      })
      .attr("marker-end", "url(#arrowhead)");

    const linkText = link.append("text")
      .attr("font-size", "7px")
      .attr("fill", "#86868B")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .attr("font-weight", "500")
      .text(d => d.type)
      .attr("class", "pointer-events-none select-none opacity-60 group-hover:opacity-100 transition-opacity")
      .attr("opacity", d => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const linkId = `${sourceId}-${targetId}`;
        return highlightedLinks.size > 0 ? (highlightedLinks.has(linkId) ? 1 : 0.05) : 0.6;
      });

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "group")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        if (selectedNode?.id === d.id) {
          setSelectedNode(null);
          setHighlightedNodes(new Set());
          setHighlightedLinks(new Set());
        } else {
          setSelectedNode(d);
          
          // Find neighbors
          const neighbors = new Set<string>([d.id]);
          const hLinks = new Set<string>();
          
          links.forEach(l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            
            if (sourceId === d.id) {
              neighbors.add(targetId);
              hLinks.add(`${sourceId}-${targetId}`);
            } else if (targetId === d.id) {
              neighbors.add(sourceId);
              hLinks.add(`${sourceId}-${targetId}`);
            }
          });
          
          setHighlightedNodes(neighbors);
          setHighlightedLinks(hLinks);
        }
      });

    // Node circles with gradients or distinct colors
    node.append("circle")
      .attr("r", d => d.type === 'process' ? 12 : 8)
      .attr("fill", d => {
        switch(d.type) {
          case 'process': return "#0071E3";
          case 'file': return "#FF9500";
          case 'user': return "#5856D6";
          case 'socket': return "#34C759";
          case 'dylib': return "#FF3B30";
          default: return "#8E8E93";
        }
      })
      .attr("stroke", d => highlightedNodes.has(d.id) ? "#1D1D1F" : "#fff")
      .attr("stroke-width", d => highlightedNodes.has(d.id) ? 3 : 2)
      .attr("opacity", d => highlightedNodes.size > 0 ? (highlightedNodes.has(d.id) ? 1 : 0.2) : 1)
      .attr("class", "shadow-lg transition-all group-hover:scale-110 cursor-pointer");

    // Node labels
    node.append("text")
      .attr("x", 16)
      .attr("y", 4)
      .text(d => d.label)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("font-family", "sans-serif")
      .attr("fill", "#1D1D1F")
      .attr("opacity", d => highlightedNodes.size > 0 ? (highlightedNodes.has(d.id) ? 1 : 0.1) : 0.9)
      .attr("class", "pointer-events-none select-none");

    simulation.on("tick", () => {
      link.selectAll("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkText
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [events, typeFilter, highlightedNodes, highlightedLinks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Behavior Graph</h2>
          <p className="text-[#86868B]">Causal modeling of process, file, and network interactions.</p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger 
                className="rounded-xl border border-[#D2D2D7] text-[#424245] h-9 px-4 flex items-center gap-2 hover:bg-[#F5F5F7] transition-colors bg-white"
              >
                <HelpCircle size={16} className="text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider">How this section works</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[350px] p-5 rounded-2xl border-[#D2D2D7] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Network size={18} />
                    <h4 className="font-bold text-sm">Graph Intelligence</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Causal Modeling</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        The Behavior Graph visualizes the <strong>causal relationships</strong> between different system entities. It maps how processes spawn other processes, write to files, or establish network connections.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Interactive Investigation</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Click on any node to <strong>highlight its direct connections</strong> and view detailed behavioral metadata in the Entity Intelligence panel. This helps in tracing the "blast radius" of an event.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Entity Classification</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Nodes are color-coded by type (Process, File, User, etc.). Use the <strong>Filter</strong> to focus on specific entity types or <strong>Reset</strong> to clear highlights and zoom.
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2 bg-white border border-[#D2D2D7] rounded-xl px-3 h-9">
            <Filter size={14} className="text-[#86868B]" />
            <select 
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-2 uppercase"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Entities</option>
              <option value="process">Processes</option>
              <option value="file">Files</option>
              <option value="user">Users</option>
              <option value="socket">Network</option>
              <option value="dylib">Dylibs</option>
            </select>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-[#D2D2D7]"
            onClick={() => {
              // Reset zoom/pan or just re-render
              d3.select(svgRef.current).transition().duration(750).call(
                d3.zoom<SVGSVGElement, unknown>().transform as any, 
                d3.zoomIdentity
              );
            }}
          >
            <RefreshCw size={14} className="mr-2" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-[#D2D2D7]"
            onClick={() => {
              if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen();
              }
            }}
          >
            <Maximize2 size={14} className="mr-2" />
            Expand
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card ref={containerRef} className="lg:col-span-3 border-[#D2D2D7] bg-white rounded-3xl overflow-hidden shadow-sm relative min-h-[600px]">
          <div className="absolute top-4 left-4 flex flex-wrap gap-3 z-10">
            {[
              { label: 'Process', color: 'bg-[#0071E3]', icon: Activity },
              { label: 'File', color: 'bg-[#FF9500]', icon: FileCode },
              { label: 'User', color: 'bg-[#5856D6]', icon: User },
              { label: 'Network', color: 'bg-[#34C759]', icon: Network },
              { label: 'Dylib', color: 'bg-[#FF3B30]', icon: Shield },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#D2D2D7] text-[9px] font-bold uppercase tracking-wider shadow-sm">
                <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                <item.icon size={10} className="text-[#86868B]" />
                {item.label}
              </div>
            ))}
          </div>
          <CardContent className="p-0">
            {events.length > 0 ? (
              <svg ref={svgRef} className="w-full h-[600px] cursor-grab active:cursor-grabbing"></svg>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-[#86868B]">
                <RefreshCw size={48} className="opacity-10 mb-4" />
                <p>No telemetry data to visualize.</p>
                <p className="text-xs">Run a simulation to build the behavior graph.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-[#D2D2D7] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#F5F5F7]/50 border-b border-[#D2D2D7]">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                Entity Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedNode ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-2">Classification</p>
                    <Badge variant="outline" className="rounded-full capitalize px-3 py-1 bg-white shadow-sm border-[#D2D2D7]">
                      {selectedNode.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-2">Identifier</p>
                    <p className="text-sm font-semibold text-[#1D1D1F] break-all leading-tight">{selectedNode.label}</p>
                  </div>
                  {selectedNode.metadata?.timestamp && (
                    <div>
                      <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-2">Precise Timestamp</p>
                      <div className="flex items-center gap-2 text-xs text-[#424245] bg-[#F5F5F7] p-2 rounded-lg border border-[#E5E5E5]">
                        <Clock size={12} className="text-blue-500" />
                        <span className="font-mono">{new Date(selectedNode.metadata.timestamp).toISOString().replace('T', ' ').replace('Z', '')}</span>
                      </div>
                    </div>
                  )}
                  {selectedNode.metadata && (
                    <div className="space-y-4 pt-2 border-t border-[#F5F5F7]">
                      {selectedNode.metadata.mitre && (
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Target size={10} />
                            MITRE ATT&CK
                          </p>
                          <p className="text-xs font-bold text-orange-900">{selectedNode.metadata.mitre.technique_name}</p>
                          <p className="text-[10px] text-orange-700 mt-1">{selectedNode.metadata.mitre.technique_id} • {selectedNode.metadata.mitre.tactic}</p>
                        </div>
                      )}
                      {selectedNode.metadata.cmd && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Command Line</p>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 text-[#86868B] hover:text-blue-600"
                              onClick={() => handleCopy(selectedNode.metadata.cmd)}
                            >
                              {copied ? <Check size={10} /> : <Copy size={10} />}
                            </Button>
                          </div>
                          <code className="text-[10px] font-mono text-pink-600 bg-[#F5F5F7] p-2 rounded-lg block break-all leading-relaxed border border-[#E5E5E5]">
                            {selectedNode.metadata.cmd}
                          </code>
                        </div>
                      )}
                      {selectedNode.metadata.user && (
                        <div>
                          <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-2">Execution Context</p>
                          <div className="flex items-center gap-2 text-xs text-[#424245]">
                            <User size={12} />
                            <span>User: {selectedNode.metadata.user}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full rounded-xl text-xs border-[#D2D2D7]"
                      onClick={() => setActivePage('telemetry')}
                    >
                      Pivot to Explorer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto">
                    <Activity size={20} className="text-[#D2D2D7]" />
                  </div>
                  <p className="text-xs text-[#86868B] max-w-[150px] mx-auto">
                    Select a node in the graph to extract behavioral metadata.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#D2D2D7] shadow-sm rounded-2xl bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <Shield size={12} />
                Threat Hunting Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-900 uppercase">Causal Chain Analysis</p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Look for <strong>Safari</strong> or <strong>Terminal</strong> spawning unsigned binaries. Causal links to <code>~/Library/LaunchAgents</code> indicate persistence.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-900 uppercase">Anomalous Dylibs</p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Red nodes (Dylibs) loaded by signed system processes suggest <strong>Dylib Hijacking</strong> or <strong>TCC bypass</strong> attempts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
