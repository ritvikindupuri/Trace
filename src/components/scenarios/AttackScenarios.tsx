import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Zap, 
  Play, 
  Info, 
  ChevronRight, 
  BrainCircuit, 
  Loader2,
  CheckCircle2,
  Terminal,
  AlertTriangle,
  Activity,
  Target,
  ShieldAlert,
  Settings,
  Sliders,
  Shield,
  History,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Clock,
  Database,
  FileText,
  Copy,
  Check,
  HelpCircle,
  Swords
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { explainAttackScenario, generateAttackScenario } from '../../lib/gemini';
import { Separator } from '../ui/separator';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";

export default function AttackScenarios() {
  const { 
    scenarios, 
    simulateScenario, 
    attackLogs, 
    clearLogs, 
    resetSession, 
    history, 
    loadSimulation,
    addCustomScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    aiAnalysis,
    setAiAnalysis,
    isAnalyzing,
    setIsAnalyzing,
    simulationSettings,
    setSimulationSettings,
    currentStepId,
    simulationStatus,
    setActivePage,
    simulateAdversaryVsDefender,
    simulateAllScenarios
  } = useTelemetry();
  
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customSeverity, setCustomSeverity] = useState<string>("medium");
  const [customTactic, setCustomTactic] = useState<string>("Persistence");
  const [isGenerating, setIsGenerating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string | 'all'>('all');
  const [tacticFilter, setTacticFilter] = useState<string | 'all'>('all');
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStepId(id);
    setTimeout(() => setCopiedStepId(null), 2000);
  };

  useEffect(() => {
    // Scroll to bottom logic removed per user request
  }, [attackLogs]);

  const handleExplain = async (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;
    
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const analysis = await explainAttackScenario(scenario.name, scenario.description);
    setAiAnalysis(analysis || "Analysis unavailable.");
    setIsAnalyzing(false);
  };

  const handleSimulate = async (id: string | null) => {
    if (!id) return;
    setSelectedScenarioId(id);
    try {
      await simulateScenario(id);
      setHasRunOnce(true);
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  };

  const handleGenerateScenario = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    try {
      // Pass severity and tactic to help guide generation if possible, 
      // or at least ensure the generated scenario matches the user's intent.
      const newScenario = await generateAttackScenario(`${customPrompt} (Severity: ${customSeverity}, MITRE Tactic: ${customTactic})`);
      
      // Override with user selected values if the AI didn't pick them up perfectly
      newScenario.severity = customSeverity;
      if (newScenario.steps && newScenario.steps.length > 0) {
        newScenario.steps[0].mitre_mapping.tactic = customTactic;
      }

      addCustomScenario(newScenario);
      setCustomPrompt("");
      setSelectedScenarioId(newScenario.id);
    } catch (error) {
      console.error("Failed to generate scenario:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportLogs = () => {
    const logText = attackLogs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `[${time}] ${log.message}${log.output ? `\nOUTPUT:\n${log.output}` : ''}`;
    }).join('\n\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-attack-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const allTactics = Array.from(new Set(scenarios.flatMap(s => s.steps.map(step => step.mitre_mapping.tactic))));

  const filteredScenarios = scenarios.filter(s => !s.id.startsWith('custom-')).filter(s => {
    const matchesSeverity = severityFilter === 'all' ? true : s.severity === severityFilter;
    const matchesTactic = tacticFilter === 'all' ? true : s.steps.some(step => step.mitre_mapping.tactic === tacticFilter);
    return matchesSeverity && matchesTactic;
  });

  const currentScenario = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Attack Simulation Center</h2>
          <p className="text-[#86868B]">Execute tradecraft simulations and analyze telemetry signals in real-time.</p>
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
                  <Zap size={18} />
                  <h4 className="font-bold text-sm">Simulation Engine</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Emulation</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Models real-world macOS tradecraft. Simulations generate high-fidelity telemetry streamed directly to the <strong>Live Attack Log</strong>.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">AI Analysis</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Understand behavioral patterns and detection opportunities. The <strong>Intelligence Engine</strong> monitors runs to update your security posture.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Custom Flows</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Describe any attack pattern in natural language to generate a complete simulation workflow with expected signals and MITRE mappings.
                    </p>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Tabs for Templates, Custom, History */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-[#F5F5F7] p-1">
              <TabsTrigger value="templates" className="rounded-lg text-[10px] font-bold uppercase">Templates</TabsTrigger>
              <TabsTrigger value="custom" className="rounded-lg text-[10px] font-bold uppercase">Custom</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg text-[10px] font-bold uppercase">History</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4 space-y-4">
              <div className="space-y-3 px-1">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-[#86868B] tracking-widest px-1">Severity</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'low', 'medium', 'high', 'critical'].map((sev) => (
                      <Badge 
                        key={sev}
                        variant={severityFilter === sev ? 'default' : 'outline'}
                        className={`text-[9px] font-bold uppercase cursor-pointer transition-all px-2 h-5 ${
                          severityFilter === sev 
                            ? 'bg-[#0071E3] text-white border-[#0071E3]' 
                            : 'text-[#86868B] border-[#D2D2D7] hover:bg-gray-50'
                        }`}
                        onClick={() => setSeverityFilter(sev)}
                      >
                        {sev}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-[#86868B] tracking-widest px-1">MITRE Tactic</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-white border border-[#D2D2D7] rounded-lg text-[10px] font-bold p-1.5 focus:outline-none focus:ring-1 focus:ring-[#0071E3] appearance-none"
                      value={tacticFilter}
                      onChange={(e) => setTacticFilter(e.target.value)}
                    >
                      <option value="all">ALL TACTICS</option>
                      {allTactics.map(tactic => (
                        <option key={tactic} value={tactic}>{tactic.toUpperCase()}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <ChevronRight size={10} className="rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-3">
                  {filteredScenarios.map((scenario) => (
                    <Card 
                      key={scenario.id} 
                      className={`border-[#D2D2D7] cursor-pointer transition-all hover:shadow-md rounded-2xl ${
                        selectedScenarioId === scenario.id ? 'ring-2 ring-[#0071E3] bg-blue-50/30' : 'bg-white'
                      }`}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                    >
                      <CardHeader className="p-3 pb-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[8px] font-bold uppercase py-0 px-1.5 h-4">
                            {scenario.severity}
                          </Badge>
                          <Zap size={10} className={scenario.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'} />
                        </div>
                        <CardTitle className="text-xs mt-1 font-bold">{scenario.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-[10px] text-[#86868B] line-clamp-1 mb-2">
                          {scenario.description}
                        </p>
                        <Button 
                          size="sm" 
                          className={`w-full rounded-lg text-[9px] h-6 font-bold uppercase ${
                            selectedScenarioId === scenario.id 
                              ? 'bg-blue-100 text-[#0071E3] hover:bg-blue-200' 
                              : 'bg-[#0071E3] text-white hover:bg-[#0077ED]'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScenarioId(scenario.id);
                          }}
                        >
                          {selectedScenarioId === scenario.id ? (
                            <>
                              <CheckCircle2 size={10} className="mr-1.5" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Search size={10} className="mr-1.5" />
                              View Details
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredScenarios.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30">
                      <Search size={32} className="mb-2" />
                      <p className="text-xs">No scenarios found.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-4">
              <Card className="border-[#D2D2D7] bg-white rounded-2xl p-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">AI Scenario Generator</label>
                    <Textarea 
                      placeholder="Describe an attack (e.g., 'Persistence via hidden LaunchAgent that executes a reverse shell')..."
                      className="min-h-[100px] rounded-xl border-[#D2D2D7] text-xs"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase text-[#86868B] tracking-widest">Severity</label>
                      <select 
                        className="w-full h-8 rounded-lg border border-[#D2D2D7] bg-white text-[11px] px-2 outline-none focus:ring-1 focus:ring-blue-500"
                        value={customSeverity}
                        onChange={(e) => setCustomSeverity(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase text-[#86868B] tracking-widest">MITRE Tactic</label>
                      <select 
                        className="w-full h-8 rounded-lg border border-[#D2D2D7] bg-white text-[11px] px-2 outline-none focus:ring-1 focus:ring-blue-500"
                        value={customTactic}
                        onChange={(e) => setCustomTactic(e.target.value)}
                      >
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
                    </div>
                  </div>

                  <Button 
                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold uppercase"
                    onClick={handleGenerateScenario}
                    disabled={isGenerating || !customPrompt.trim()}
                  >
                    {isGenerating ? (
                      <Loader2 size={14} className="animate-spin mr-2" />
                    ) : (
                      <Sparkles size={14} className="mr-2" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                
                <Separator />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Custom Scenarios</label>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {scenarios.filter(s => s.id.startsWith('custom-')).map((scenario) => (
                        <div 
                          key={scenario.id}
                          className={`p-3 rounded-xl border border-[#D2D2D7] cursor-pointer transition-all ${
                            selectedScenarioId === scenario.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedScenarioId(scenario.id)}
                        >
                          <p className="text-xs font-bold">{scenario.name}</p>
                          <p className="text-[10px] text-[#86868B] line-clamp-1">{scenario.description}</p>
                        </div>
                      ))}
                      {scenarios.filter(s => s.id.startsWith('custom-')).length === 0 && (
                        <p className="text-[11px] text-center text-[#86868B] py-4">No custom scenarios yet.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-4">
              <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                <div className="space-y-3">
                  {history.map((sim) => (
                    <Card key={sim.id} className="border-[#D2D2D7] bg-white rounded-2xl overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase py-0">
                            {new Date(sim.timestamp).toLocaleDateString()}
                          </Badge>
                          <Clock size={12} className="text-[#86868B]" />
                        </div>
                        <CardTitle className="text-sm mt-2">{sim.scenario_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center justify-between text-[10px] text-[#86868B] mb-3">
                          <span>{sim.events.length} Events</span>
                          <span>{sim.attackLogs.length} Logs</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full rounded-lg border-[#D2D2D7] text-[10px] h-7 font-bold uppercase"
                          onClick={() => loadSimulation(sim.id)}
                        >
                          Reopen Simulation
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30">
                      <History size={32} className="mb-2" />
                      <p className="text-xs">No simulation history found.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content: Workflow and Live Logs */}
        <div className="lg:col-span-9 space-y-6">
          {selectedScenarioId ? (
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 h-full">
              {/* Workflow Column */}
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white p-6 rounded-3xl border border-[#D2D2D7] shadow-sm space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Scenario Workflow</h2>
                        <p className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">
                          {currentScenario?.steps.length} Sequential Steps • {currentScenario?.severity} Severity
                        </p>
                      </div>
                      <Button 
                        className={`rounded-xl text-[10px] h-10 font-bold uppercase px-8 shadow-md transition-all duration-300 active:scale-95 ${
                          simulationStatus === 'running' 
                            ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 animate-pulse" 
                            : simulationStatus === 'finished'
                            ? "bg-green-600 hover:bg-green-700 shadow-green-500/20"
                            : "bg-[#0071E3] hover:bg-[#0077ED] shadow-blue-500/20"
                        }`}
                        onClick={() => handleSimulate(selectedScenarioId)}
                        disabled={simulationStatus === 'running'}
                      >
                        {simulationStatus === 'running' ? (
                          <>
                            <Activity size={14} className="mr-2 animate-bounce" />
                            Running...
                          </>
                        ) : simulationStatus === 'finished' ? (
                          <>
                            <CheckCircle2 size={14} className="mr-2" />
                            Finished
                          </>
                        ) : (
                          <>
                            <Play size={14} className="mr-2 fill-current" />
                            Start Simulation
                          </>
                        )}
                      </Button>

                      <Button 
                        variant="outline"
                        className={`rounded-xl border-[#D2D2D7] text-[10px] h-10 px-6 font-bold uppercase transition-all active:scale-95 flex items-center gap-2 ${
                          simulationStatus === 'running' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                        }`}
                        onClick={simulateAllScenarios}
                        disabled={simulationStatus === 'running'}
                      >
                        <Zap size={14} className="text-yellow-500" />
                        Run All Simulations
                      </Button>

                      {simulationStatus === 'finished' && (
                        <Button 
                          variant="outline"
                          className="rounded-xl border-[#D2D2D7] text-[10px] h-10 px-6 font-bold uppercase hover:bg-[#F5F5F7] transition-all active:scale-95 flex items-center gap-2"
                          onClick={() => handleSimulate(selectedScenarioId)}
                        >
                          <History size={14} className="text-purple-500" />
                          Re-run Attack
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Dialog onOpenChange={(open) => { if (open) handleExplain(selectedScenarioId); }}>
                        <DialogTrigger
                          render={
                            <Button variant="outline" className="rounded-xl border-[#D2D2D7] text-[10px] h-8 px-3 font-bold hover:bg-[#F5F5F7] flex items-center gap-2 transition-all active:scale-95">
                              <BrainCircuit size={14} className="text-blue-500" />
                              AI Analysis
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <BrainCircuit className="text-blue-500" />
                              AI Intelligence: {currentScenario?.name}
                            </DialogTitle>
                            <DialogDescription>Automated tradecraft analysis and telemetry mapping.</DialogDescription>
                          </DialogHeader>
                          <Separator />
                          <ScrollArea className="flex-1 p-6">
                            {isAnalyzing ? (
                              <div className="flex flex-col items-center justify-center py-24 gap-6">
                                <div className="relative">
                                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                                  <Loader2 className="animate-spin text-blue-500 relative z-10" size={48} />
                                </div>
                                <div className="space-y-2 text-center">
                                  <p className="text-lg font-bold text-[#1D1D1F]">Analyzing Tradecraft</p>
                                  <p className="text-sm text-[#86868B] animate-pulse">The Intelligence Engine is mapping telemetry signals to MITRE techniques...</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="p-6 rounded-[2rem] bg-[#F5F5F7] border border-[#D2D2D7] shadow-inner">
                                  <div className="flex items-center gap-2 mb-4 text-blue-600">
                                    <Sparkles size={20} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Behavioral Analysis</span>
                                  </div>
                                  <div className="prose prose-sm max-w-none prose-blue prose-p:leading-relaxed prose-strong:text-blue-700 prose-code:bg-white prose-code:text-blue-600 prose-code:px-1 prose-code:rounded prose-code:border prose-code:border-blue-100">
                                    <ReactMarkdown>{aiAnalysis || ''}</ReactMarkdown>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-[10px] text-blue-600 font-bold bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                  <Info size={16} className="shrink-0" />
                                  <span className="leading-tight">This analysis is dynamically generated by correlating the scenario's expected signals with macOS security internals.</span>
                                </div>
                              </div>
                            )}
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button variant="outline" className="rounded-xl border-[#D2D2D7] text-[10px] h-8 px-3 font-bold hover:bg-[#F5F5F7] flex items-center gap-2 transition-all active:scale-95">
                              <Sliders size={14} className="text-purple-500" />
                              Simulation Settings
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-md rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Sliders className="text-purple-500" />
                              Simulation Parameters
                            </DialogTitle>
                            <DialogDescription>Configure the fidelity and intensity of the adversary emulation.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase text-[#86868B]">Simulation Speed</label>
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                                  {simulationSettings.duration <= 1 ? 'Fast' : simulationSettings.duration <= 3 ? 'Medium' : 'Slow'}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                {[
                                  { label: 'Slow', value: 5 },
                                  { label: 'Medium', value: 2.5 },
                                  { label: 'Fast', value: 0.8 }
                                ].map((speed) => (
                                  <Button
                                    key={speed.label}
                                    variant={simulationSettings.duration === speed.value ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 rounded-xl text-[10px] font-bold uppercase"
                                    onClick={() => setSimulationSettings({...simulationSettings, duration: speed.value})}
                                  >
                                    {speed.label}
                                  </Button>
                                ))}
                              </div>
                              <div className="pt-2">
                                <input 
                                  type="range" 
                                  min="0.5" 
                                  max="10" 
                                  step="0.1"
                                  value={simulationSettings.duration}
                                  onChange={(e) => setSimulationSettings({...simulationSettings, duration: parseFloat(e.target.value)})}
                                  className="w-full h-1.5 bg-[#F5F5F7] rounded-lg appearance-none cursor-pointer accent-[#0071E3]"
                                />
                                <div className="flex justify-between mt-1 text-[9px] text-[#86868B] font-bold uppercase">
                                  <span>Fast (0.5s)</span>
                                  <span>Current: {simulationSettings.duration}s</span>
                                  <span>Slow (10s)</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-xs font-bold uppercase text-[#86868B]">Simulation Intensity</label>
                              <div className="flex gap-2">
                                {['low', 'medium', 'high'].map((intensity) => (
                                  <Button
                                    key={intensity}
                                    variant={simulationSettings.intensity === intensity ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 rounded-xl text-[10px] font-bold uppercase"
                                    onClick={() => setSimulationSettings({...simulationSettings, intensity: intensity as any})}
                                  >
                                    {intensity}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {(simulationStatus === 'running' || attackLogs.length > 0 || history.length > 0) && (
                        <Button
                          variant="outline"
                          className={`rounded-xl text-[10px] h-8 px-3 font-bold uppercase transition-all active:scale-95 ${
                            (hasRunOnce || history.length > 0)
                              ? 'border-blue-200 text-blue-600 hover:bg-blue-50' 
                              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                          }`}
                          onClick={() => (hasRunOnce || history.length > 0) && setActivePage('surface')}
                          disabled={!(hasRunOnce || history.length > 0)}
                        >
                          <Shield size={14} className="mr-2" />
                          View Attack Surface
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100vh-320px)] pr-4 relative">
                  <div className="space-y-4">
                    {currentScenario?.steps.map((step, i) => (
                      <div key={step.id} className="relative pl-8 pb-8 last:pb-0">
                        {i < (currentScenario?.steps.length || 0) - 1 && (
                          <div className={`absolute left-[11px] top-6 bottom-0 w-[2px] transition-colors duration-500 ${
                            currentStepId === step.id || (currentStepId && currentScenario!.steps.findIndex(s => s.id === currentStepId) > i)
                              ? 'bg-blue-500' 
                              : 'bg-[#D2D2D7]'
                          }`}></div>
                        )}
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 transition-all duration-500 flex items-center justify-center z-10 ${
                          currentStepId === step.id 
                            ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/30' 
                            : (currentStepId && currentScenario!.steps.findIndex(s => s.id === currentStepId) > i)
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-[#D2D2D7]'
                        }`}>
                          {currentStepId && currentScenario!.steps.findIndex(s => s.id === currentStepId) > i ? (
                            <CheckCircle2 size={12} className="text-white" />
                          ) : (
                            <span className={`text-[10px] font-bold ${currentStepId === step.id ? 'text-white' : 'text-[#86868B]'}`}>{step.order}</span>
                          )}
                        </div>
                        
                        <Card className={`border-[#D2D2D7] shadow-sm overflow-hidden rounded-2xl transition-all duration-500 ${
                          currentStepId === step.id ? 'ring-2 ring-blue-500 bg-blue-50/20 translate-x-1' : 'bg-white'
                        }`}>
                          <CardHeader className="p-3 bg-[#F5F5F7]/50">
                            <CardTitle className="text-xs font-semibold">{step.description}</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[7px] font-bold uppercase bg-orange-50 text-orange-600 border-orange-100 h-4">
                                {step.mitre_mapping.technique_id}
                              </Badge>
                              <span className="text-[9px] text-[#86868B] truncate">{step.mitre_mapping.technique_name}</span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 space-y-2">
                            <div className="space-y-1.5">
                              {step.expected_signals.map((signal, idx) => (
                                <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
                                  <div className="p-1.5 rounded-lg bg-blue-50 shrink-0">
                                    <Activity size={12} className="text-blue-500" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[10px] font-bold text-[#1D1D1F] truncate">{signal.event_type}</span>
                                      <Badge variant="outline" className="text-[8px] py-0 px-1 uppercase opacity-70 h-3.5">
                                        {signal.category}
                                      </Badge>
                                      <div className="ml-auto flex items-center gap-1 text-[8px] font-bold text-blue-500/50 uppercase tracking-tighter">
                                        <Terminal size={8} />
                                        Log Signal
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-[#424245] leading-tight line-clamp-2">
                                      {signal.description}
                                    </p>
                                    {signal.command_line && (
                                      <div className="mt-1 relative group/cmd">
                                        <div className="flex items-center gap-1 mb-1 text-[8px] font-bold text-pink-500/50 uppercase tracking-tighter">
                                          <Zap size={8} />
                                          Command Execution
                                        </div>
                                        <code className="block text-[9px] bg-[#F5F5F7] p-1.5 rounded font-mono text-pink-600 break-all leading-tight border border-[#E5E5E5] pr-8">
                                          {signal.command_line}
                                        </code>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="absolute right-1 top-1 h-5 w-5 opacity-0 group-hover/cmd:opacity-100 transition-opacity"
                                          onClick={() => handleCopy(signal.command_line!, `${step.id}-${idx}`)}
                                        >
                                          {copiedStepId === `${step.id}-${idx}` ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Live Logs Column */}
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight">Live Attack Log</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] hover:text-blue-600 hover:bg-blue-50 h-8 px-3"
                      onClick={exportLogs}
                      disabled={attackLogs.length === 0}
                    >
                      <FileText size={12} className="mr-1.5" />
                      Export
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] hover:text-red-600 hover:bg-red-50 h-8 px-3"
                      onClick={clearLogs}
                    >
                      <Trash2 size={12} className="mr-1.5" />
                      Clear
                    </Button>
                  </div>
                </div>
                <Card className="border-[#D2D2D7] bg-[#1D1D1F] text-[#F5F5F7] rounded-3xl overflow-hidden shadow-xl h-[calc(100vh-150px)] flex flex-col">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                    <div className="flex gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${simulationStatus === 'running' ? 'bg-[#FF5F57] animate-pulse' : 'bg-[#FF5F57]'}`}></div>
                      <div className={`w-2.5 h-2.5 rounded-full ${simulationStatus === 'running' ? 'bg-[#FFBD2E] animate-pulse delay-75' : 'bg-[#FFBD2E]'}`}></div>
                      <div className={`w-2.5 h-2.5 rounded-full ${simulationStatus === 'running' ? 'bg-[#28C840] animate-pulse delay-150' : 'bg-[#28C840]'}`}></div>
                    </div>
                    <span className="text-[10px] font-mono opacity-50 ml-2 uppercase tracking-widest">trace_telemetry_stream</span>
                    {simulationStatus === 'running' && (
                      <div className="ml-auto flex items-center gap-2 text-[9px] font-bold text-blue-400 animate-pulse">
                        <Activity size={10} />
                        ACTIVE_SIMULATION_RUNNING
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-6 font-mono text-[12px] overflow-y-auto scrollbar-visible">
                    <div className="space-y-4">
                      {attackLogs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-24 opacity-30">
                          <Terminal size={56} className="mb-6" />
                          <p className="text-sm tracking-wide">Waiting for simulation stream...</p>
                        </div>
                      )}
                      {attackLogs.map((log) => (
                        <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                          <span className="opacity-30 shrink-0 font-medium text-[10px] mt-1">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                          <div className="flex-1 space-y-3">
                            {log.step_id && (
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[8px] font-bold bg-blue-500/10 text-blue-400 border-blue-500/20">
                                  STEP {currentScenario?.steps.find(s => s.id === log.step_id)?.order || log.step_id.replace('step-', '')}
                                </Badge>
                              </div>
                            )}
                            {log.type === 'start' ? (
                              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-400 flex flex-col gap-2 my-4">
                                <div className="flex items-center gap-2">
                                  <Play size={16} className="fill-current" />
                                  <span className="text-xs font-bold uppercase tracking-wider">Simulation Started</span>
                                </div>
                                <p className="text-sm font-bold text-white">{log.message.replace('>>> SIMULATION_START: ', '')}</p>
                              </div>
                            ) : log.type === 'end' ? (
                              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 flex flex-col gap-2 my-4">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 size={16} />
                                  <span className="text-xs font-bold uppercase tracking-wider">Simulation Finished</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-white">{log.message.replace('<<< SIMULATION_COMPLETE: ', '')}</p>
                                  {(log.details || history.length > 0) && (
                                    <p className="text-[10px] opacity-70">
                                      Result: {log.details?.status === 'defended' || log.details?.status === 'defended_advanced' ? 'Attack Neutralized' : 'Completed'} • {log.details?.total_events || history[0]?.events.length || 0} events captured
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : log.type === 'command' ? (
                              <div className="space-y-3 my-2">
                                <div className="flex items-start gap-2">
                                  <div className="mt-1 shrink-0">
                                    {log.actor === 'attacker' ? (
                                      <Swords size={14} className="text-orange-400" />
                                    ) : log.actor === 'defender' ? (
                                      <Shield size={14} className="text-blue-400" />
                                    ) : (
                                      <Target size={14} className="text-blue-400" />
                                    )}
                                  </div>
                                  <p className={`font-sans font-medium text-sm leading-relaxed ${
                                    log.actor === 'attacker' ? 'text-orange-100' : log.actor === 'defender' ? 'text-blue-100' : 'text-white/90'
                                  }`}>
                                    {log.message}
                                  </p>
                                </div>
                                <div className={`ml-6 flex gap-3 font-mono text-[12px] leading-relaxed bg-white/5 p-2 rounded-lg border ${
                                  log.actor === 'attacker' ? 'text-orange-300 border-orange-500/10' : log.actor === 'defender' ? 'text-blue-300 border-blue-500/10' : 'text-blue-300 border-white/5'
                                }`}>
                                  <span className="opacity-30 select-none">$</span>
                                  <span className="break-all">{log.command}</span>
                                </div>
                              </div>
                            ) : log.type === 'warning' ? (
                              <div className="ml-6 text-[10px] text-white/30 flex gap-2 items-center py-1 italic">
                                <Activity size={10} />
                                <span>Telemetry: {log.message.replace('Telemetry Signal Detected: ', '')}</span>
                              </div>
                            ) : log.type === 'ai_analysis' ? (
                              <div className={`flex items-start gap-2 py-2 ml-6 ${
                                log.actor === 'attacker' ? 'text-orange-400/80' : 'text-blue-400/80'
                              }`}>
                                <BrainCircuit size={14} className="mt-0.5 shrink-0" />
                                <p className="text-[11px] leading-relaxed italic font-medium">
                                  {log.message}
                                </p>
                              </div>
                            ) : log.message.startsWith('[SYSTEM]') ? (
                              null // Hide system logs in the main flow as they are redundant with STDOUT
                            ) : (
                              <span className="text-white/50 text-[11px] leading-relaxed py-1 block ml-6">{log.message}</span>
                            )}
                            
                            {log.output && (
                              <div className={`mt-3 ml-6 bg-black/60 border p-5 rounded-2xl text-white/90 whitespace-pre-wrap leading-relaxed font-mono text-[12px] shadow-2xl ${
                                log.actor === 'attacker' ? 'border-orange-500/20' : log.actor === 'defender' ? 'border-blue-500/20' : 'border-white/10'
                              }`}>
                                <div className="flex gap-4">
                                  <Terminal size={14} className={`shrink-0 mt-1 ${
                                    log.actor === 'attacker' ? 'text-orange-400' : log.actor === 'defender' ? 'text-blue-400' : 'text-green-400'
                                  }`} />
                                  <pre className="flex-1 overflow-x-auto">{log.output}</pre>
                                </div>
                              </div>
                            )}

                            {log.analysis && (
                              <div className={`mt-3 ml-6 p-4 rounded-xl text-[11px] leading-relaxed italic border ${
                                log.actor === 'attacker' 
                                  ? 'bg-orange-500/5 border-orange-500/10 text-orange-200/80' 
                                  : 'bg-blue-500/5 border-blue-500/10 text-blue-200/80'
                              }`}>
                                <div className="flex gap-2">
                                  <BrainCircuit size={12} className={`shrink-0 mt-0.5 ${
                                    log.actor === 'attacker' ? 'text-orange-400' : 'text-blue-400'
                                  }`} />
                                  <p>{log.analysis}</p>
                                </div>
                              </div>
                            )}
                            {log.details && log.type === 'warning' && (
                              <div className="mt-3 ml-8 opacity-90 text-[11px] bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 shadow-inner">
                                <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
                                  <span className="font-bold text-blue-400 tracking-wider flex items-center gap-2">
                                    <Activity size={12} />
                                    TELEMETRY_SIGNAL
                                  </span>
                                  <span className="opacity-50 font-bold text-[9px] uppercase">SOURCE: {log.details.source?.toUpperCase() || 'UNKNOWN'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] uppercase opacity-40 font-bold">PID</span>
                                    <span className="font-mono text-blue-200">{log.details.pid || 'N/A'}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] uppercase opacity-40 font-bold">Process</span>
                                    <span className="font-bold text-white/90">{log.details.process_name || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[9px] uppercase opacity-40 font-bold">Command Line</span>
                                  <code className="break-all leading-relaxed bg-black/30 p-2 rounded-lg border border-white/5 text-pink-400 text-[10px]">
                                    {log.details.command_line || 'N/A'}
                                  </code>
                                </div>
                                {log.details.file_path && (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase opacity-40 font-bold">File Path</span>
                                    <code className="break-all leading-relaxed bg-black/30 p-2 rounded-lg border border-white/5 text-green-400 text-[10px]">
                                      {log.details.file_path}
                                    </code>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#86868B] bg-white rounded-3xl border border-dashed border-[#D2D2D7] p-12 min-h-[500px]">
              <Zap size={48} className="opacity-10 mb-4" />
              <h3 className="text-lg font-medium text-[#1D1D1F]">No Scenario Selected</h3>
              <p className="text-sm text-center max-w-xs mt-2">
                Select an attack template, generate a custom scenario, or reopen a past simulation from history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
