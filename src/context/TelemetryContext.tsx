import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { NormalizedEvent, AttackScenario, TelemetryGap, AttackLogEntry, AttackSurfaceItem, SimulationHistory, Anomaly, ResearchAlignment, SimulationSettings, AppNotification, Recommendation } from '../types';
import { bootstrapSystem, scanAttackSurface, fetchLatestMacOSThreats, getSimulationAdvisorNotification } from '../lib/gemini';
import { PREDEFINED_SCENARIOS } from '../constants';
import { toast } from 'sonner';

interface TelemetryContextType {
  events: NormalizedEvent[];
  setEvents: (events: NormalizedEvent[]) => void;
  scenarios: AttackScenario[];
  addScenario: (scenario: AttackScenario) => void;
  addCustomScenario: (scenario: any) => void;
  gaps: TelemetryGap[];
  setGaps: (gaps: TelemetryGap[]) => void;
  attackLogs: AttackLogEntry[];
  selectedScenarioId: string | null;
  setSelectedScenarioId: (id: string | null) => void;
  aiAnalysis: string | null;
  setAiAnalysis: (analysis: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  simulateScenario: (scenarioId: string) => Promise<void>;
  clearLogs: () => void;
  resetSession: () => Promise<void>;
  history: SimulationHistory[];
  loadSimulation: (historyId: string) => void;
  attackSurface: AttackSurfaceItem[];
  recommendations: any[];
  anomalies: Anomaly[];
  researchAlignment: ResearchAlignment | null;
  activePage: string;
  setActivePage: (page: any) => void;
  refreshAttackSurface: () => Promise<void>;
  isScanning: boolean;
  isBootstrapping: boolean;
  simulationSettings: SimulationSettings;
  setSimulationSettings: (settings: SimulationSettings) => void;
  currentStepId: string | null;
  simulationStatus: 'idle' | 'running' | 'finished';
  user: any | null;
  setUser: (user: any | null) => void;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  selectedThreatId: string | null;
  setSelectedThreatId: (id: string | null) => void;
  simulateAdversaryVsDefender: (scenarioId: string) => Promise<void>;
  simulateAllScenarios: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [gaps, setGaps] = useState<TelemetryGap[]>([]);
  const [attackLogs, setAttackLogs] = useState<AttackLogEntry[]>([]);
  const [selectedScenarioId, _setSelectedScenarioId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'finished'>('idle');

  const setSelectedScenarioId = (id: string | null) => {
    if (id !== selectedScenarioId) {
      if (simulationStatus !== 'running') {
        setSimulationStatus('idle');
        setAttackLogs([]); // Clear logs when switching if not running
      }
      _setSelectedScenarioId(id);
    }
  };
  const [user, setUser] = useState<any | null>({ uid: 'guest', email: 'guest@trace.os', displayName: 'Guest Investigator' });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [aiScenarios, setAiScenarios] = useState<AttackScenario[]>(PREDEFINED_SCENARIOS);
  const [customScenarios, setCustomScenarios] = useState<AttackScenario[]>([]);
  const [history, setHistory] = useState<SimulationHistory[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [researchAlignment, setResearchAlignment] = useState<ResearchAlignment | null>(null);
  const [attackSurface, setAttackSurface] = useState<AttackSurfaceItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [canShowToasts, setCanShowToasts] = useState(false);
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    duration: 2.5,
    intensity: 'medium',
    sources: ['esf', 'unified_log', 'simulator']
  });

  // Local storage persistence for non-Firebase environment
  useEffect(() => {
    const savedHistory = localStorage.getItem('trace_history');
    const savedScenarios = localStorage.getItem('trace_custom_scenarios');
    const savedNotifications = localStorage.getItem('trace_notifications');

    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedScenarios) setCustomScenarios(JSON.parse(savedScenarios));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
  }, []);

  useEffect(() => {
    localStorage.setItem('trace_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('trace_custom_scenarios', JSON.stringify(customScenarios));
  }, [customScenarios]);

  useEffect(() => {
    localStorage.setItem('trace_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = now.toISOString();
    const preciseTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (notification.type === 'threat' && canShowToasts) {
      toast.error(notification.title, {
        description: `[${preciseTime}] ${notification.summary}`,
        action: notification.targetPage ? {
          label: 'View Intelligence',
          onClick: () => {
            if (notification.metadata?.threatId) setSelectedThreatId(notification.metadata.threatId);
            setActivePage(notification.targetPage as any);
          }
        } : undefined,
        duration: 10000
      });
    } else if (notification.type === 'info' && canShowToasts) {
      toast.info(notification.title, {
        description: `[${preciseTime}] ${notification.summary}`,
        duration: 5000
      });
    }

    const newNotification: AppNotification = {
      ...notification,
      id,
      timestamp
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addCustomScenario = (scenario: any) => {
    setCustomScenarios(prev => [scenario, ...prev]);
  };

  const init = async () => {
    setIsBootstrapping(true);
    try {
      const data = await bootstrapSystem();
      if (data) {
        if (data.scenarios) setAiScenarios(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newScenarios = data.scenarios.filter((s: AttackScenario) => !existingIds.has(s.id));
          return [...prev, ...newScenarios];
        });
        if (data.anomalies) setAnomalies(data.anomalies);
        if (data.surface) setAttackSurface(data.surface);
        if (data.recommendations) setRecommendations(data.recommendations);
        if (data.researchAlignment) {
          setResearchAlignment(data.researchAlignment);
          addNotification({
            title: 'New Threat Intelligence Received',
            summary: data.researchAlignment.headline,
            type: 'threat',
            targetPage: 'intelligence'
          });
        }
      }
    } catch (error) {
      console.error("Bootstrap failed:", error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!isBootstrapping) {
      // Delay toasts by 2 minutes after bootstrap completes
      const timer = setTimeout(() => {
        setCanShowToasts(true);
      }, 2 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [isBootstrapping]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Connected to telemetry stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry') {
            setEvents(prev => [...data.events, ...prev]);
            if (canShowToasts) {
              toast.info(`Real-time telemetry received`, {
                description: `Captured ${data.events.length} events from ${data.source}`,
                duration: 3000
              });
            }
          }
        } catch (err) {
          console.error('[WS] Failed to parse message', err);
        }
      };

      ws.onclose = () => {
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const scenarios = [...aiScenarios, ...customScenarios];

  const refreshThreatIntelligence = async () => {
    try {
      const data = await fetchLatestMacOSThreats();
      if (data) {
        if (data.researchAlignment) setResearchAlignment(data.researchAlignment);
        if (data.newThreats && data.newThreats.length > 0) {
          const existingTitles = new Set(notifications.map(n => n.title));
          
          data.newThreats.forEach((threat: any) => {
            const title = `New Threat Detected: ${threat.title}`;
            if (!existingTitles.has(title)) {
              addNotification({
                title,
                summary: threat.summary,
                type: 'threat' as const,
                targetPage: 'intelligence',
                metadata: { threatId: threat.id }
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh threat intelligence:", error);
    }
  };

  useEffect(() => {
    // Only start refreshing threat intel after bootstrap and initial quiet period
    if (!canShowToasts) return;

    refreshThreatIntelligence();
    const interval = setInterval(() => {
      refreshThreatIntelligence();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [canShowToasts]);

  const addScenario = (scenario: AttackScenario) => {
    setCustomScenarios(prev => [...prev, scenario]);
  };

  const addLog = (entry: Omit<AttackLogEntry, 'id' | 'timestamp'>) => {
    const newLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    setAttackLogs(prev => [...prev, newLog]);
    return newLog;
  };

  const injectBackgroundNoise = () => {
    const noiseProcesses = [
      { name: 'mds', cmd: '/System/Library/Frameworks/CoreServices.framework/Frameworks/Metadata.framework/Support/mds', cat: 'file_system' as const },
      { name: 'lsd', cmd: '/usr/libexec/lsd', cat: 'execution' as const },
      { name: 'tccd', cmd: '/System/Library/PrivateFrameworks/TCC.framework/Support/tccd', cat: 'tcc' as const }
    ];

    const count = Math.floor(Math.random() * 2) + 1;
    const noiseEvents: NormalizedEvent[] = [];

    for (let i = 0; i < count; i++) {
      const proc = noiseProcesses[Math.floor(Math.random() * noiseProcesses.length)];
      noiseEvents.push({
        event_id: `noise-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        event_type: 'ES_EVENT_TYPE_NOTIFY_EXEC',
        category: proc.cat,
        process_name: proc.name,
        pid: Math.floor(Math.random() * 10000).toString(),
        parent_pid: '1',
        user: 'root',
        command_line: proc.cmd,
        source: 'esf',
        entities: ['process', 'user']
      });
    }

    setEvents(prev => [...noiseEvents, ...prev]);
  };

  const getJitter = (base: number) => base * (0.8 + Math.random() * 0.7);

  const clearLogs = () => setAttackLogs([]);

  const clearCurrentSimulation = () => {
    setEvents([]);
    setAttackLogs([]);
    setGaps([]);
    setAnomalies([]);
    setAiAnalysis(null);
    setIsAnalyzing(false);
  };

  const resetSession = async () => {
    setEvents([]);
    setAttackLogs([]);
    setGaps([]);
    setAnomalies([]);
    setAiAnalysis(null);
    setIsAnalyzing(false);
    setHistory([]);
    setCustomScenarios([]);
    setSelectedScenarioId(null);
    setSimulationStatus('idle');
    setAttackSurface(prev => prev.map(item => ({ ...item, status: 'secure' as const })));
    setRecommendations([]);
    localStorage.removeItem('trace_history');
    localStorage.removeItem('trace_custom_scenarios');
    localStorage.removeItem('trace_notifications');
    toast.success("Session reset", {
      description: "All telemetry and simulation data has been cleared."
    });
  };

  const refreshAttackSurface = async () => {
    setIsScanning(true);
    try {
      const data = await scanAttackSurface();
      if (data) {
        if (data.surface) setAttackSurface(data.surface);
        if (data.recommendations) setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Failed to refresh attack surface:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const loadSimulation = (historyId: string) => {
    const item = history.find(h => h.id === historyId);
    if (item) {
      setEvents(item.events);
      setAttackLogs(item.attackLogs);
      setGaps(item.gaps);
      setAnomalies(item.anomalies || []);
      setSelectedScenarioId(item.scenario_id);
      setAiAnalysis(item.aiAnalysis || null);
      if (item.attackSurface) setAttackSurface(item.attackSurface);
      if (item.recommendations) setRecommendations(item.recommendations);
    }
  };

  const simulateScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const isReRun = history.some(h => h.scenario_id === scenarioId);
    if (!isReRun) {
      return simulateAdversaryVsDefender(scenarioId);
    }

    clearCurrentSimulation();
    setCurrentStepId(null);
    setSimulationStatus('running');
    
    addLog({ 
      type: 'start', 
      message: `>>> MODIFIED_STRATEGY_SIMULATION: ${scenario.name} (Take 2)`,
      details: { mode: 'modified_strategy', scenario_id: scenarioId, timestamp: new Date().toISOString() }
    });

    const currentEvents: NormalizedEvent[] = [];
    const currentGaps: TelemetryGap[] = [];
    const currentAnomalies: Anomaly[] = [];
    
    for (const step of scenario.steps) {
      setCurrentStepId(step.id);
      const stepDuration = simulationSettings.duration * 1000;

      addLog({
        type: 'ai_analysis',
        message: `[ATTACKER] Implementing obfuscation...`,
        actor: 'attacker'
      });
      injectBackgroundNoise();
      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.5)));

      const command = step.expected_signals[0]?.command_line || 'bash';
      const event: NormalizedEvent = {
        event_id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event_type: 'ES_EVENT_TYPE_NOTIFY_EXEC',
        category: 'execution',
        process_name: 'bash',
        pid: Math.floor(Math.random() * 10000).toString(),
        parent_pid: '1',
        user: 'root',
        command_line: command,
        source: 'esf',
        entities: ['process', 'user'],
        mitre_mapping: step.mitre_mapping
      };
      currentEvents.push(event);
      setEvents(prev => [...prev, event]);

      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration)));
    }

    setSimulationStatus('finished');
    setCurrentStepId(null);

    const newHistoryItem: SimulationHistory = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      events: [...currentEvents],
      attackLogs: [...attackLogs],
      gaps: [...currentGaps],
      anomalies: [...currentAnomalies]
    };
    setHistory(prev => [newHistoryItem, ...prev]);
  };

  const simulateAdversaryVsDefender = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    clearCurrentSimulation();
    setCurrentStepId(null);
    setSimulationStatus('running');
    
    addLog({ 
      type: 'start', 
      message: `>>> ADVERSARY_VS_DEFENDER_SIMULATION: ${scenario.name}`,
      details: { mode: 'adversary_vs_defender', scenario_id: scenarioId, timestamp: new Date().toISOString() }
    });

    const currentEvents: NormalizedEvent[] = [];
    const currentLogs: AttackLogEntry[] = [];
    
    for (const step of scenario.steps) {
      setCurrentStepId(step.id);
      const stepDuration = simulationSettings.duration * 1000;

      // --- ATTACKER PHASE ---
      // Thought Before
      if (step.attacker_thought_before) {
        addLog({ 
          type: 'ai_analysis', 
          message: step.attacker_thought_before, 
          actor: 'attacker',
          step_id: step.id 
        });
        await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.4)));
      }

      // Command Execution
      addLog({ 
        type: 'command', 
        message: `[ATTACKER] Executing: ${step.description}`, 
        command: step.attacker_command || step.expected_signals[0]?.command_line || 'bash',
        output: step.attacker_output || 'Execution successful.',
        actor: 'attacker',
        step_id: step.id
      });
      injectBackgroundNoise();
      
      const event: NormalizedEvent = {
        event_id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event_type: 'ES_EVENT_TYPE_NOTIFY_EXEC',
        category: 'execution',
        process_name: step.expected_signals[0]?.process_name || 'task',
        pid: Math.floor(Math.random() * 10000).toString(),
        parent_pid: '1',
        user: 'root',
        command_line: step.attacker_command || step.expected_signals[0]?.command_line || 'bash',
        source: 'esf',
        entities: ['process', 'user'],
        mitre_mapping: step.mitre_mapping
      };
      currentEvents.push(event);
      setEvents(prev => [...prev, event]);
      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.6)));

      // Thought After
      if (step.attacker_thought_after) {
        addLog({ 
          type: 'ai_analysis', 
          message: step.attacker_thought_after, 
          actor: 'attacker',
          step_id: step.id 
        });
        await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.3)));
      }

      // --- DEFENDER PHASE ---
      // Thought Before
      if (step.defender_thought_before) {
        addLog({ 
          type: 'ai_analysis', 
          message: step.defender_thought_before, 
          actor: 'defender',
          step_id: step.id 
        });
        await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.4)));
      }

      // Command Execution
      addLog({ 
        type: 'command', 
        message: `[DEFENDER] Neutralizing threat...`, 
        command: step.defender_command || 'eslogger exec | grep suspicious',
        output: step.defender_output || 'Process monitored. Defensive rules applied.',
        actor: 'defender',
        step_id: step.id
      });
      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.6)));

      // Thought After
      if (step.defender_thought_after) {
        addLog({ 
          type: 'ai_analysis', 
          message: step.defender_thought_after, 
          actor: 'defender',
          step_id: step.id 
        });
        await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.3)));
      }
    }

    setSimulationStatus('finished');
    setCurrentStepId(null);
    
    const newHistoryItem: SimulationHistory = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      events: [...currentEvents],
      attackLogs: [...currentLogs],
      gaps: [],
      anomalies: []
    };
    setHistory(prev => [newHistoryItem, ...prev]);
  };

  const simulateAllScenarios = async () => {
    if (simulationStatus === 'running') return;
    const templateScenarios = scenarios.filter(s => !s.id.startsWith('custom-'));
    setSimulationStatus('running');
    for (const scenario of templateScenarios) {
      setSelectedScenarioId(scenario.id);
      await simulateScenario(scenario.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setSimulationStatus('finished');
  };

  return (
    <TelemetryContext.Provider value={{ 
      events, setEvents, scenarios, addScenario, addCustomScenario, gaps, setGaps, attackLogs,
      selectedScenarioId, setSelectedScenarioId, aiAnalysis, setAiAnalysis, isAnalyzing, setIsAnalyzing,
      simulateScenario, clearLogs, resetSession, history, loadSimulation, attackSurface, recommendations,
      anomalies, researchAlignment, activePage, setActivePage, refreshAttackSurface, isScanning,
      isBootstrapping, simulationSettings, setSimulationSettings, currentStepId, simulationStatus,
      user, setUser, notifications, addNotification, removeNotification, selectedThreatId, setSelectedThreatId,
      simulateAdversaryVsDefender, simulateAllScenarios
    }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (context === undefined) throw new Error('useTelemetry must be used within a TelemetryProvider');
  return context;
}
