import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTelemetry } from '../../context/TelemetryContext';
import { analyzeSurfaceItem } from '../../lib/gemini';
import SurfaceItemChat from './SurfaceItemChat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Shield, AlertTriangle, CheckCircle2, Info, Lock, Search, Filter, Target, Database, Activity, ChevronRight, RefreshCw, Loader2, HelpCircle, BrainCircuit, Terminal, Cpu, Layers, Fingerprint, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import ScenarioInventoryChat from './ScenarioInventoryChat';
import { Separator } from '../ui/separator';

export default function AttackSurfaceMap() {
  const { attackSurface, recommendations, refreshAttackSurface, isScanning, researchAlignment, simulateAdversaryVsDefender, setActivePage, selectedScenarioId, history } = useTelemetry();
  const [isReRunning, setIsReRunning] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);
  const [filterTactic, setFilterTactic] = React.useState<string | null>(null);
  const [selectedScenarioContext, setSelectedScenarioContext] = React.useState<string | null>(null);

  const filteredSurface = attackSurface.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus ? item.status === filterStatus : true;
    const matchesTactic = filterTactic ? item.tactic === filterTactic : true;
    const matchesScenario = selectedScenarioContext ? item.scenario_id === selectedScenarioContext : true;
    return matchesSearch && matchesFilter && matchesTactic && matchesScenario;
  });

  const filteredRecommendations = recommendations.filter(rec => {
    return selectedScenarioContext ? rec.scenario_id === selectedScenarioContext : true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-500 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'vulnerable': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure': return <CheckCircle2 size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'vulnerable': return <Shield size={16} className="text-red-500" />;
      default: return <Info size={16} />;
    }
  };

  // Derive metrics from real state
  const secureCount = attackSurface.filter(s => s.status === 'secure').length;
  const totalCount = attackSurface.length;
  const posturePercentage = totalCount > 0 ? Math.round((secureCount / totalCount) * 100) : 0;
  
  const extensionCount = attackSurface.filter(s => s.category === 'system_extension' || s.category === 'launch_item').length;
  const tccCount = attackSurface.filter(s => s.category === 'tcc_permission').length;

  const handleReRun = async () => {
    if (!selectedScenarioId) {
      // If no scenario selected, pick the first one or default
      const defaultScenarioId = 'macos-persistence-launchagent';
      setIsReRunning(true);
      setActivePage('scenarios');
      await simulateAdversaryVsDefender(defaultScenarioId);
      setIsReRunning(false);
    } else {
      setIsReRunning(true);
      setActivePage('scenarios');
      await simulateAdversaryVsDefender(selectedScenarioId);
      setIsReRunning(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">macOS Attack Surface</h2>
            <p className="text-[#86868B]">Mapping system configurations, permissions, and extension states.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger 
                  className="rounded-xl border border-[#D2D2D7] text-[#424245] h-10 px-4 flex items-center gap-2 hover:bg-[#F5F5F7] transition-colors bg-white"
                >
                  <HelpCircle size={16} className="text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">How this section works</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[350px] p-5 rounded-2xl border-[#D2D2D7] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Shield size={18} />
                      <h4 className="font-bold text-sm">Surface Intelligence</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">System Inventory</p>
                        <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                          Maps the <strong>security posture</strong> of your macOS environment, tracking critical configurations like SIP, Gatekeeper, and TCC permissions.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Risk Assessment</p>
                        <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                          Simulations dynamically impact your attack surface. Successful persistence mechanisms add new <strong>vulnerable entries</strong> to the inventory.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Hardening</p>
                        <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                          Provides actionable <strong>guidance</strong> to secure your environment against simulated tradecraft and identified vulnerabilities.
                        </p>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Tooltip>
              <TooltipTrigger 
                className="rounded-xl border border-[#D2D2D7] text-[#424245] h-10 px-4 flex items-center gap-2 hover:bg-[#F5F5F7] transition-colors bg-white"
              >
                <BrainCircuit size={16} className="text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Surface Mapping Intelligence</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[350px] p-5 rounded-2xl border-[#D2D2D7] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-600">
                    <BrainCircuit size={18} />
                    <h4 className="font-bold text-sm">Surface Intelligence</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">System Scan</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Audits the baseline macOS environment, identifying standard LaunchAgents, Daemons, and TCC permissions.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Simulation Injection</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        When an attack simulation succeeds, the engine <strong>dynamically injects</strong> new vulnerable components into this inventory.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">AI Risk Assessment</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        The <strong>Gemini Engine</strong> evaluates component status by correlating it with current macOS research trends and session telemetry.
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Button 
              variant="outline" 
              size="sm" 
              className={`rounded-xl border-[#D2D2D7] text-xs h-10 px-4 font-bold transition-all ${isReRunning ? 'bg-purple-50 text-purple-600 border-purple-200' : 'hover:bg-[#F5F5F7]'}`}
              onClick={handleReRun}
              disabled={isReRunning}
            >
              {isReRunning ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Re-running Simulation...
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="mr-2" />
                  Re-run Attack
                </>
              )}
            </Button>
            <Tooltip>
              <TooltipTrigger 
                className={`rounded-xl border border-[#D2D2D7] text-xs h-10 px-4 font-bold transition-all flex items-center gap-2 ${isScanning ? 'bg-blue-50 text-blue-600 border-blue-200' : 'hover:bg-[#F5F5F7] bg-white'}`}
                onClick={refreshAttackSurface}
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Scanning System...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="mr-2" />
                    Scan System
                  </>
                )}
              </TooltipTrigger>
              <TooltipContent className="p-3 rounded-xl border-[#D2D2D7] bg-white shadow-xl">
                <p className="text-xs font-bold text-[#1D1D1F]">System Audit</p>
                <p className="text-[10px] text-[#424245] mt-1">
                  Triggers a deep scan of the macOS environment to discover LaunchItems, TCC permissions, and system configurations.
                </p>
              </TooltipContent>
            </Tooltip>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" size={14} />
              <Input 
                className="pl-9 w-[180px] lg:w-[250px] rounded-xl border-[#D2D2D7]" 
                placeholder="Search surface..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className={`rounded-xl border border-[#D2D2D7] h-10 px-3 text-xs font-bold transition-all outline-none focus:ring-1 focus:ring-blue-500 ${filterTactic ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white hover:bg-[#F5F5F7]'}`}
              value={filterTactic || ""}
              onChange={(e) => setFilterTactic(e.target.value || null)}
            >
              <option value="">All Tactics</option>
              <option value="Initial Access">Initial Access</option>
              <option value="Execution">Execution</option>
              <option value="Persistence">Persistence</option>
              <option value="Privilege Escalation">Privilege Escalation</option>
              <option value="Defense Evasion">Defense Evasion</option>
              <option value="Credential Access">Credential Access</option>
              <option value="Discovery">Discovery</option>
              <option value="Lateral Movement">Lateral Movement</option>
              <option value="Collection">Collection</option>
              <option value="Command and Control">Command and Control</option>
              <option value="Exfiltration">Exfiltration</option>
              <option value="Impact">Impact</option>
            </select>

            <Tooltip>
              <TooltipTrigger 
                className={`rounded-xl border border-[#D2D2D7] w-10 h-10 flex items-center justify-center transition-all ${filterStatus ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white hover:bg-[#F5F5F7]'}`}
                onClick={() => {
                  if (filterStatus === null) setFilterStatus('vulnerable');
                  else if (filterStatus === 'vulnerable') setFilterStatus('warning');
                  else if (filterStatus === 'warning') setFilterStatus('secure');
                  else setFilterStatus(null);
                }}
              >
                <Filter size={14} />
              </TooltipTrigger>
              <TooltipContent className="p-2 rounded-lg border-[#D2D2D7] bg-white shadow-lg">
                <p className="text-[10px] font-bold">
                  {filterStatus ? `Filtering: ${filterStatus.toUpperCase()}` : 'Filter by Status'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Tooltip>
            <TooltipTrigger render={<div className="w-full" />}>
              <Card className="border-[#D2D2D7] bg-white rounded-3xl shadow-sm cursor-help w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#86868B]">Active Extensions</CardTitle>
                  <div className="text-3xl font-bold mt-2">{extensionCount}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] text-[#86868B]">System Extensions and Launch Items currently loaded.</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="p-4 rounded-2xl border-[#D2D2D7] bg-white shadow-xl max-w-xs">
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#1D1D1F]">Extension Monitoring</p>
                <p className="text-[11px] text-[#424245] leading-relaxed">
                  Total count of System Extensions, LaunchAgents, and LaunchDaemons detected. High numbers may indicate a larger attack surface for persistence.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<div className="w-full" />}>
              <Card className="border-[#D2D2D7] bg-white rounded-3xl shadow-sm cursor-help w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#86868B]">TCC Exceptions</CardTitle>
                  <div className="text-3xl font-bold mt-2">{tccCount}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] text-[#86868B]">Applications with specific privacy overrides.</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="p-4 rounded-2xl border-[#D2D2D7] bg-white shadow-xl max-w-xs">
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#1D1D1F]">TCC Audit</p>
                <p className="text-[11px] text-[#424245] leading-relaxed">
                  Count of entries in the Transparency, Consent, and Control database. These represent permissions granted to apps for sensitive data like Camera, Microphone, or Full Disk Access.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-[#F5F5F7] bg-[#FBFBFD]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BrainCircuit size={16} className="text-purple-500" />
                  Simulation Comparison: Multi-Take Analysis
                </CardTitle>
                <CardDescription className="text-[11px]">Tracking attack surface evolution across sequential simulation runs.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 text-[10px] font-bold">
                Comparative Analysis
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#F5F5F7]/50 border-b border-[#F5F5F7]">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#86868B] sticky left-0 bg-[#FBFBFD] z-10">Attack Scenario</th>
                    {Array.from({ length: Math.max(2, Array.from(new Set(history.map(h => h.scenario_id))).reduce((max, id) => Math.max(max, history.filter(h => h.scenario_id === id).length), 0)) }).map((_, i) => (
                      <th key={i} className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Take {i + 1}</th>
                    ))}
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Evolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F7]">
                  {history.length > 0 ? (
                    Array.from(new Set(history.map(h => h.scenario_id))).map(scenarioId => {
                      const takes = history.filter(h => h.scenario_id === scenarioId).reverse();
                      const scenarioName = takes[0]?.scenario_name || "Unknown Attack";
                      const maxTakes = Array.from(new Set(history.map(h => h.scenario_id))).reduce((max, id) => Math.max(max, history.filter(h => h.scenario_id === id).length), 0);
                      
                      return (
                        <tr 
                          key={scenarioId} 
                          className={`hover:bg-[#FBFBFD] transition-colors cursor-pointer ${selectedScenarioContext === scenarioId ? 'bg-purple-50/50 border-l-4 border-l-purple-500' : ''}`}
                          onClick={() => setSelectedScenarioContext(selectedScenarioContext === scenarioId ? null : scenarioId)}
                        >
                          <td className="p-4 sticky left-0 bg-white group-hover:bg-[#FBFBFD] z-10 border-r border-[#F5F5F7]">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-[#1D1D1F]">{scenarioName}</span>
                              <span className="text-[10px] text-[#86868B] font-mono">{scenarioId}</span>
                            </div>
                          </td>
                          {Array.from({ length: Math.max(2, maxTakes) }).map((_, i) => (
                            <td key={i} className="p-4 min-w-[250px]">
                              {takes[i] ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-[9px] h-4 ${i === 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                      {i === 0 ? 'Initial' : `Take ${i + 1}`}
                                    </Badge>
                                    <span className="text-[11px] font-medium">{takes[i].events.length || 0} Events</span>
                                  </div>
                                  <p className="text-[10px] text-[#424245] leading-relaxed line-clamp-3">
                                    {takes[i].aiAnalysis || "Telemetry observed."}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[#D2D2D7]">
                                  <div className="w-1 h-1 rounded-full bg-[#D2D2D7]" />
                                  <span className="text-[10px] italic">Awaiting simulation...</span>
                                </div>
                              )}
                            </td>
                          ))}
                          <td className="p-4 min-w-[200px]">
                            {takes.length > 1 ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-1.5 text-green-600">
                                  <Activity size={12} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Strategy Evolved</span>
                                </div>
                                <p className="text-[10px] text-[#86868B] leading-tight">
                                  Observed {takes.length} iterations of tradecraft. Adversary shifted from standard execution to {takes.length > 2 ? 'advanced obfuscation and multi-stage payloads' : 'base64 encoded payloads'}.
                                </p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#D2D2D7] uppercase font-bold tracking-widest">Baseline Only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                            <Activity size={20} className="text-[#D2D2D7]" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-[#1D1D1F]">No Simulation Data Available</p>
                            <p className="text-xs text-[#86868B]">Run a simulation to see attack surface evolution metrics.</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 rounded-xl border-[#D2D2D7] text-xs font-bold"
                            onClick={handleReRun}
                          >
                            Run Initial Simulation
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedScenarioContext ? (
          <>
            <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F5F5F7] bg-[#FBFBFD]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Activity size={16} className="text-blue-500" />
                      Live Posture Score Calculation
                    </CardTitle>
                <CardDescription className="text-[11px]">Dynamic breakdown of current security metrics and simulation impact.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold">
                Real-time Update
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Posture Breakdown</p>
                <div className="space-y-3">
                  <Tooltip>
                    <TooltipTrigger render={<div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E5] cursor-help hover:bg-[#EBEBEF] transition-colors w-full" />}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-green-600" />
                        </div>
                        <span className="text-sm font-bold">Verified Secure</span>
                      </div>
                      <span className="text-lg font-bold">{secureCount}</span>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 rounded-xl border-[#D2D2D7] bg-white shadow-xl max-w-[280px]">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider">The "Good Guys"</p>
                        <p className="text-[11px] text-[#424245] leading-relaxed">
                          These are system components (like SIP being ON) and apps that have passed our security audit. They haven't been compromised by any malicious simulations.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger render={<div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-100 cursor-help hover:bg-red-100/50 transition-colors w-full" />}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle size={16} className="text-red-600" />
                        </div>
                        <span className="text-sm font-bold text-red-700">Identified Risks</span>
                      </div>
                      <span className="text-lg font-bold text-red-700">{totalCount - secureCount}</span>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 rounded-xl border-[#D2D2D7] bg-white shadow-xl max-w-[280px]">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">The "Bad Guys"</p>
                        <p className="text-[11px] text-[#424245] leading-relaxed">
                          This count increases whenever a simulation successfully bypasses a defense or when we find a dangerous setting (like Terminal having Full Disk Access).
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger render={<div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100 cursor-help hover:bg-blue-100/50 transition-colors w-full" />}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Target size={16} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-blue-700">Total Monitored</span>
                      </div>
                      <span className="text-lg font-bold text-blue-700">{totalCount}</span>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 rounded-xl border-[#D2D2D7] bg-white shadow-xl max-w-[280px]">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Checkpoints</p>
                        <p className="text-[11px] text-[#424245] leading-relaxed">
                          The total number of security checkpoints we are watching. This grows as we discover more about your system and run more complex attack scenarios.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center py-4">
                <Tooltip>
                  <TooltipTrigger render={<div className="relative w-64 h-64 flex items-center justify-center cursor-help group mx-auto" />}>
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        className="text-[#F5F5F7]"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        strokeDasharray={691}
                        strokeDashoffset={691 - (691 * posturePercentage) / 100}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ${posturePercentage > 80 ? 'text-[#34C759]' : posturePercentage > 50 ? 'text-yellow-400' : 'text-red-500'}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-bold tracking-tighter group-hover:scale-110 transition-transform">{posturePercentage}%</span>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#86868B] mt-2">Overall Posture</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="p-6 rounded-2xl border-[#D2D2D7] bg-white shadow-2xl max-w-sm animate-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Shield size={18} />
                        <h4 className="font-bold text-sm">Security Posture Explained</h4>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[11px] leading-relaxed text-[#424245]">
                          This score is a real-time health check of your macOS security. It measures how many of your system's critical "checkpoints" are currently verified as secure.
                        </p>
                        <div className="p-4 bg-[#F5F5F7] rounded-2xl font-mono border border-[#D2D2D7] shadow-inner group/formula">
                          <p className="text-[10px] font-bold uppercase text-[#86868B] mb-2 tracking-widest">Calculation Logic</p>
                          <div className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                            <span className="text-blue-600">Score</span>
                            <span className="text-[#86868B]">=</span>
                            <div className="flex flex-col items-center">
                              <span className="border-b border-[#1D1D1F] px-2">Verified_Secure</span>
                              <span className="px-2">Total_Monitored</span>
                            </div>
                            <span className="text-[#86868B]">*</span>
                            <span>100</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[11px] font-bold uppercase text-[#86868B] tracking-widest">What affects this score?</p>
                          <ul className="text-[11px] space-y-3 text-[#424245]">
                            <li className="flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                              <p><strong>Simulation Impact:</strong> If an attack simulation (like a persistence attempt) succeeds, it creates a <strong>Vulnerable</strong> item, which <strong>immediately lowers</strong> this score.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 shrink-0" />
                              <p><strong>System Audit:</strong> We monitor <strong>SIP, Gatekeeper, and TCC</strong>. If these are disabled or overly permissive, the score drops.</p>
                            </li>
                            <li className="flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" />
                              <p><strong>Hardening:</strong> Following the recommendations below to "clean up" vulnerable items will <strong>increase</strong> your score back to 100%.</p>
                            </li>
                          </ul>
                        </div>
                        <p className="text-[10px] italic text-[#86868B] leading-relaxed border-t pt-2">
                          Think of this as your "Security Credit Score"—it goes down when risks are found and up when you harden the system.
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">AI Posture Analysis</p>
                <div className="p-6 rounded-[2rem] border border-[#D2D2D7] bg-white shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <BrainCircuit size={20} className="text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Intelligence Insight</p>
                      <p className="text-[10px] text-[#86868B] font-bold uppercase">Dynamic Risk Evaluation</p>
                    </div>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed text-[#1D1D1F] font-medium bg-[#F5F5F7] p-4 rounded-2xl border border-[#E5E5E5]">
                      {posturePercentage < 100 
                        ? (
                          <>
                            Your security posture is currently at <strong className="text-red-600">{posturePercentage}%</strong>. 
                            This score reflects <strong className="text-red-600">{totalCount - secureCount} active vulnerabilities</strong> injected during recent simulations. 
                            The primary risk factor is the successful execution of <strong className="text-[#1D1D1F]">{history[0]?.scenario_name || 'adversary tradecraft'}</strong>, 
                            which has introduced unauthorized persistence mechanisms into the system inventory.
                          </>
                        )
                        : (
                          <>
                            Your security posture is currently at <strong className="text-green-600">100%</strong>. 
                            All monitored system components are <strong className="text-green-600">verified secure</strong> and align with Apple's hardening standards. 
                            No active simulation-driven vulnerabilities detected.
                          </>
                        )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-blue-600 font-bold bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <Info size={14} className="shrink-0" />
                    <span className="leading-tight">The Intelligence Engine correlates real-time ESF telemetry with system state to derive this score.</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Surface Inventory</h3>
                <p className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">
                  Context: {selectedScenarioContext ? (history.find(h => h.scenario_id === selectedScenarioContext)?.scenario_name || 'Selected Scenario') : 'System Baseline'}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-[#86868B] border-[#D2D2D7]">
                {searchTerm || filterStatus ? `${filteredSurface.length} of ${totalCount} Items` : `${totalCount} Items Tracked`}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSurface.length > 0 ? (
                filteredSurface.map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger render={<div className="w-full" />}>
                      <Card className="border-[#D2D2D7] hover:shadow-md transition-shadow rounded-2xl overflow-hidden cursor-help">
                        <div className={`h-1 w-full ${item.status === 'secure' ? 'bg-green-500' : item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <CardHeader className="p-5 pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`text-[9px] font-bold uppercase ${getStatusColor(item.status)}`}>
                              {item.category.replace('_', ' ')}
                            </Badge>
                            <span className="text-[10px] text-[#86868B]">{new Date(item.last_checked).toLocaleDateString()}</span>
                          </div>
                          <CardTitle className="text-base mt-3 flex items-center gap-2">
                            {item.name}
                            {getStatusIcon(item.status)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          <p className="text-xs text-[#424245] leading-relaxed mb-4 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#0071E3] uppercase tracking-widest">
                            <MessageSquare size={12} />
                            Chat to analyze
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 rounded-2xl border-[#D2D2D7] bg-white shadow-xl max-w-xs">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#1D1D1F] flex items-center gap-2">
                          <Database size={14} className="text-blue-500" />
                          Surface Intelligence
                        </p>
                        <p className="text-[11px] text-[#424245] leading-relaxed">
                          {item.description}
                          <br /><br />
                          <strong>Category:</strong> {item.category.replace('_', ' ')}
                          <br />
                          <strong>Status:</strong> {item.status?.toUpperCase() || 'UNKNOWN'}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))
              ) : (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-[#D2D2D7] rounded-3xl">
                  <div className="flex flex-col items-center gap-3">
                    <Search size={32} className="text-[#86868B] opacity-20" />
                    <p className="text-sm font-bold text-[#1D1D1F]">No matching items found</p>
                    <p className="text-xs text-[#86868B]">Try adjusting your search or filter criteria.</p>
                    <Button 
                      variant="link" 
                      className="text-blue-600 text-xs font-bold"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus(null);
                        setFilterTactic(null);
                      }}
                    >
                      Clear all filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <ScenarioInventoryChat 
              scenarioName={selectedScenarioContext ? (history.find(h => h.scenario_id === selectedScenarioContext)?.scenario_name || 'Selected Attack') : 'System Baseline'}
              items={filteredSurface}
            />

            <Card className="border-[#D2D2D7] rounded-3xl shadow-sm overflow-hidden">
              <CardHeader className="bg-[#F5F5F7]/50">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Lock size={16} className="text-blue-500" />
                    Hardening Recommendations
                  </CardTitle>
                  <p className="text-[9px] text-[#86868B] font-bold uppercase tracking-widest">
                    Target: {selectedScenarioContext ? (history.find(h => h.scenario_id === selectedScenarioContext)?.scenario_name || 'Selected Scenario') : 'General Posture'}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {filteredRecommendations.length > 0 ? filteredRecommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-xl border border-[#D2D2D7] bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#1D1D1F]">{rec.title}</p>
                      <Badge variant="outline" className="text-[8px] font-bold uppercase bg-blue-50 text-blue-600 border-blue-100">Recommended</Badge>
                    </div>
                    <p className="text-[11px] text-[#86868B] leading-relaxed">{rec.desc}</p>
                    <div className="pt-2 border-t border-[#F5F5F7]">
                      <p className="text-[9px] font-bold text-[#1D1D1F] uppercase tracking-widest opacity-40">Security Insight</p>
                      <p className="text-[10px] text-blue-600 italic mt-0.5">{rec.insight}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center opacity-40">
                    <p className="text-xs font-medium">No specific recommendations for this context.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-[#1D1D1F] text-white">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                  <Info size={12} />
                  Offensive Research Alignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed opacity-80">
                  {researchAlignment?.headline || 'Current Research Focus'}
                </p>
                <p className="text-[11px] opacity-70 leading-relaxed">
                  {researchAlignment?.description || 'Adversaries frequently target macOS persistence mechanisms. Trace aligns your research with emerging tradecraft.'}
                </p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Analyst Tip</p>
                  <p className="text-[11px] opacity-70 leading-relaxed">
                    {researchAlignment?.analystTip || 'Monitor for unsigned code execution in sensitive directories.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    ) : (
      <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-[#D2D2D7] rounded-[3rem] bg-white/50 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-500">
          <BrainCircuit size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-[#1D1D1F]">Ready for Deep Analysis</h3>
          <p className="text-sm text-[#86868B] max-w-xs mx-auto leading-relaxed">
            Select an attack scenario from the <strong>Multi-Take Analysis</strong> table above to explore how specific tradecraft impacts your system's security posture.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 animate-pulse">
          <Activity size={16} className="text-purple-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Awaiting Analyst Selection</span>
        </div>
      </div>
    )}
      </div>
    </TooltipProvider>
  );
}

