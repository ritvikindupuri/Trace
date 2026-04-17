import React, { useState, useMemo } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Search, 
  Filter, 
  Download, 
  Terminal, 
  Copy, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  ExternalLink,
  Info,
  Database,
  Target,
  HelpCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from '../ui/separator';

type SortKey = 'timestamp' | 'event_type' | 'category' | 'process_name' | 'user';

export default function TelemetryExplorer() {
  const { events } = useTelemetry();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const highlightPaths = (text: string) => {
    if (!text) return text;
    // Regex to match unix-style paths
    const pathRegex = /(\/[a-zA-Z0-9._\-\/]+)/g;
    const parts = text.split(pathRegex);
    
    return parts.map((part, i) => {
      if (pathRegex.test(part)) {
        return <span key={i} className="text-orange-600 font-bold bg-orange-50 px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  const processedEvents = useMemo(() => {
    return events
      .filter(event => {
        const matchesSearch = 
          event.process_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.command_line.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.user.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesSource = sourceFilter === 'all' || event.source === sourceFilter;
        
        return matchesSearch && matchesSource;
      })
      .sort((a, b) => {
        const { key, direction } = sortConfig;
        let aValue: any = a[key];
        let bValue: any = b[key];

        if (key === 'timestamp') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [events, searchTerm, sourceFilter, sortConfig]);

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ml-1 text-[#0071E3]" /> 
      : <ArrowDown size={12} className="ml-1 text-[#0071E3]" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'execution': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'persistence': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'network': return 'bg-green-100 text-green-700 border-green-200';
      case 'file_system': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'privilege': return 'bg-red-100 text-red-700 border-red-200';
      case 'tcc': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'xprotect': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'credential_access': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'discovery': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Telemetry Explorer</h2>
          <p className="text-[#86868B]">Deep visibility into macOS system events and security telemetry.</p>
        </div>
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
                  <Search size={18} />
                  <h4 className="font-bold text-sm">Telemetry Intelligence</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Data Sources</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Trace captures events from the <strong>Endpoint Security Framework (ESF)</strong>, <strong>Unified Log</strong>, and <strong>osquery</strong>. This provides a comprehensive view of process execution, file activity, and network connections.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">MITRE ATT&CK Mapping</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Each event is automatically analyzed and mapped to specific <strong>MITRE ATT&CK techniques</strong>. This helps you understand the tactical significance of every system action.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Advanced Filtering</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Use the search and source filters to isolate specific tradecraft. Exporting telemetry allows for further analysis in external SIEM or forensics tools.
                    </p>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" size={16} />
            <Input 
              placeholder="Search processes, commands, or users..." 
              className="pl-10 bg-white border-[#D2D2D7] focus-visible:ring-[#0071E3] rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#D2D2D7] rounded-xl px-3 h-10">
            <Database size={14} className="text-[#86868B]" />
            <select 
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer pr-2"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="esf">ESF</option>
              <option value="unified_log">Unified Log</option>
              <option value="simulator">Simulator</option>
              <option value="osquery">osquery</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="rounded-xl border-[#D2D2D7] text-sm flex-1 md:flex-none"
            onClick={() => {
              setSearchTerm('');
              setSourceFilter('all');
            }}
          >
            <Filter size={16} className="mr-2" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-[#D2D2D7] text-sm flex-1 md:flex-none"
            onClick={() => {
              const csv = [
                ['Timestamp', 'Event Type', 'Category', 'Process', 'Command Line', 'User', 'Source'],
                ...processedEvents.map(e => [
                  new Date(e.timestamp).toISOString(),
                  e.event_type,
                  e.category,
                  e.process_name,
                  `"${e.command_line.replace(/"/g, '""')}"`,
                  e.user,
                  e.source
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `trace-telemetry-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="bg-white border border-[#D2D2D7] rounded-2xl overflow-hidden shadow-sm">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <Table>
            <TableHeader className="bg-[#F5F5F7] sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-[#D2D2D7]">
                <TableHead 
                  className="w-[180px] text-xs font-semibold text-[#86868B] uppercase tracking-wider cursor-pointer hover:text-[#1D1D1F] transition-colors"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center">
                    Timestamp {getSortIcon('timestamp')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[150px] text-xs font-semibold text-[#86868B] uppercase tracking-wider cursor-pointer hover:text-[#1D1D1F] transition-colors"
                  onClick={() => handleSort('event_type')}
                >
                  <div className="flex items-center">
                    Event Type {getSortIcon('event_type')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[120px] text-xs font-semibold text-[#86868B] uppercase tracking-wider cursor-pointer hover:text-[#1D1D1F] transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[200px] text-xs font-semibold text-[#86868B] uppercase tracking-wider cursor-pointer hover:text-[#1D1D1F] transition-colors"
                  onClick={() => handleSort('process_name')}
                >
                  <div className="flex items-center">
                    Process {getSortIcon('process_name')}
                  </div>
                </TableHead>
                <TableHead className="w-[180px] text-xs font-semibold text-[#86868B] uppercase tracking-wider">MITRE ATT&CK</TableHead>
                <TableHead className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Command Line</TableHead>
                <TableHead 
                  className="w-[100px] text-xs font-semibold text-[#86868B] uppercase tracking-wider cursor-pointer hover:text-[#1D1D1F] transition-colors"
                  onClick={() => handleSort('user')}
                >
                  <div className="flex items-center">
                    User {getSortIcon('user')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedEvents.length > 0 ? (
                processedEvents.map((event) => (
                  <TableRow 
                    key={event.event_id} 
                    className="border-[#D2D2D7] hover:bg-[#F5F5F7] transition-colors group cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell className="font-mono text-[11px] text-[#424245]">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-[#86868B]" />
                        <span className="text-sm font-medium">{event.event_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-full px-2 py-0 text-[10px] font-bold uppercase ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{event.process_name}</TableCell>
                    <TableCell>
                      {event.mitre_mapping ? (
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`https://attack.mitre.org/techniques/${event.mitre_mapping.technique_id.replace('.', '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[9px] font-bold flex items-center gap-1">
                              {event.mitre_mapping.technique_id}
                              <ExternalLink size={8} />
                            </Badge>
                          </a>
                          <span className="text-[10px] text-[#86868B] truncate max-w-[100px]">
                            {event.mitre_mapping.technique_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#D2D2D7]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[#424245] max-w-md">
                      <div className="flex items-center justify-between gap-2 group/cmd">
                        <span className="truncate">{highlightPaths(event.command_line)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover/cmd:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(event.command_line, event.event_id);
                          }}
                        >
                          {copiedId === event.event_id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#86868B]">{event.user}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center text-[#86868B]">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <p>No telemetry events found.</p>
                      <p className="text-xs">Try running a simulation or adjusting your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal size={20} className="text-blue-500" />
              Event Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive telemetry metadata for event ID: {selectedEvent?.event_id}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Timestamp</p>
                  <p className="text-sm font-mono">{selectedEvent && new Date(selectedEvent.timestamp).toISOString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Source</p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">
                    {selectedEvent?.source}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Process Name</p>
                  <p className="text-sm font-bold">{selectedEvent?.process_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">PID / PPID</p>
                  <p className="text-sm font-mono">{selectedEvent?.pid} / {selectedEvent?.parent_pid}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">User</p>
                  <p className="text-sm">{selectedEvent?.user}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Category</p>
                  <Badge variant="outline" className={`rounded-full px-2 py-0 text-[10px] font-bold uppercase ${selectedEvent && getCategoryColor(selectedEvent.category)}`}>
                    {selectedEvent?.category}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Full Command Line</p>
                <div className="bg-[#1D1D1F] p-4 rounded-xl border border-white/10 font-mono text-xs text-green-400 break-all relative group shadow-inner">
                  <div className="flex gap-2">
                    <span className="text-white/30 select-none">$</span>
                    <span>{highlightPaths(selectedEvent?.command_line)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white"
                    onClick={() => handleCopy(selectedEvent.command_line, 'modal')}
                  >
                    {copiedId === 'modal' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </Button>
                </div>
              </div>

              {selectedEvent?.file_path && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">File Path</p>
                  <p className="text-xs font-mono break-all bg-orange-50/30 p-2 rounded-lg border border-orange-100">{selectedEvent.file_path}</p>
                </div>
              )}

              {selectedEvent?.mitre_mapping && (
                <div className="space-y-3 p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase text-orange-800 tracking-widest">MITRE ATT&CK Alignment</p>
                    <Target size={16} className="text-orange-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-orange-700/60 font-bold">Technique</p>
                      <p className="text-sm font-bold text-orange-900">{selectedEvent.mitre_mapping.technique_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-orange-700/60 font-bold">ID</p>
                      <a 
                        href={`https://attack.mitre.org/techniques/${selectedEvent.mitre_mapping.technique_id.replace('.', '/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono font-bold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        {selectedEvent.mitre_mapping.technique_id}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-orange-700/60 font-bold">Tactic</p>
                      <p className="text-sm font-bold text-orange-900">{selectedEvent.mitre_mapping.tactic}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent?.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div className="space-y-2">
                  <button 
                    className="flex items-center justify-between w-full text-[10px] font-bold uppercase text-[#86868B] tracking-widest hover:text-[#1D1D1F] transition-colors"
                    onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                  >
                    Extended Metadata
                    {isMetadataExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {isMetadataExpanded && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {Object.entries(selectedEvent.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-[11px]">
                          <span className="text-[#86868B] font-medium">{key}</span>
                          <span className="font-mono text-[#1D1D1F] break-all text-right ml-4">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4">
            <Button 
              className="rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-bold uppercase px-6"
              onClick={() => setSelectedEvent(null)}
            >
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
