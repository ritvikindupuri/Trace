import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { NormalizedEvent, AttackScenario, TelemetryGap, AttackLogEntry, AttackSurfaceItem, SimulationHistory, Anomaly, ResearchAlignment, SimulationSettings, AppNotification, Recommendation } from '../types';
import { bootstrapSystem, generateSimulationGaps, scanAttackSurface, fetchLatestMacOSThreats, analyzeAdversaryAction, getSimulationAdvisorNotification } from '../lib/gemini';
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
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [user, setUser] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [aiScenarios, setAiScenarios] = useState<AttackScenario[]>(PREDEFINED_SCENARIOS);
  const [customScenarios, setCustomScenarios] = useState<AttackScenario[]>([]);
  const [history, setHistory] = useState<SimulationHistory[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [researchAlignment, setResearchAlignment] = useState<ResearchAlignment | null>(null);
  const [attackSurface, setAttackSurface] = useState<AttackSurfaceItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    duration: 2.5,
    intensity: 'medium',
    sources: ['esf', 'unified_log', 'simulator']
  });

  // Handle Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Persist history to Firestore
  useEffect(() => {
    if (!user) {
      setIsHistoryLoaded(false);
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'simulations'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedHistory = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          events: JSON.parse(data.events || '[]'),
          attackLogs: JSON.parse(data.attackLogs || '[]'),
          gaps: JSON.parse(data.gaps || '[]')
        } as SimulationHistory;
      });
      setHistory(loadedHistory);
      setIsHistoryLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  // Persist custom scenarios to Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'customScenarios'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedScenarios = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          steps: JSON.parse(data.steps || '[]')
        } as AttackScenario;
      });
      setCustomScenarios(loadedScenarios);
    });

    return () => unsubscribe();
  }, [user]);

  // Persist notifications to Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Update notifications list
      const loadedNotifications = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as AppNotification));
      
      // Deduplicate by ID just in case
      const uniqueNotifications = Array.from(
        new Map(loadedNotifications.map(n => [n.id, n])).values()
      );
      setNotifications(uniqueNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  // Populate events from history on startup to ensure persistence across sessions
  useEffect(() => {
    if (history.length > 0 && events.length === 0) {
      const allEvents = history.flatMap(h => h.events);
      // Sort by timestamp
      allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setEvents(allEvents);
    }
  }, [history, events.length]);

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = now.toISOString();
    const preciseTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Always show toast immediately for better responsiveness
    if (notification.type === 'threat') {
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
    } else if (notification.type === 'info') {
      toast.info(notification.title, {
        description: `[${preciseTime}] ${notification.summary}`,
        duration: 5000
      });
    }

    if (!user) {
      const newNotification: AppNotification = {
        ...notification,
        id,
        timestamp
      };
      setNotifications(prev => {
        const next = [newNotification, ...prev];
        return Array.from(new Map(next.map(n => [n.id, n])).values());
      });
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        uid: user.uid,
        timestamp,
        read: false
      });
    } catch (error) {
      console.error("Failed to add notification:", error);
    }
  };

  const removeNotification = async (id: string) => {
    if (!user) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Failed to remove notification:", error);
    }
  };

  const addCustomScenario = async (scenario: any) => {
    if (!user) {
      setCustomScenarios(prev => [scenario, ...prev]);
      return;
    }

    try {
      await setDoc(doc(db, 'customScenarios', scenario.id), {
        ...scenario,
        uid: user.uid,
        steps: JSON.stringify(scenario.steps)
      });
    } catch (error) {
      console.error("Failed to add custom scenario:", error);
    }
  };

  // Ensure clean state for new users
  useEffect(() => {
    if (user && isHistoryLoaded && history.length === 0 && !isBootstrapping) {
      // New user detected with no history - clear default risks and anomalies
      setAttackSurface(prev => prev.map(item => ({
        ...item,
        status: 'secure' as const
      })));
      setAnomalies([]);
      setEvents([]);
      setAttackLogs([]);
      setGaps([]);
      setRecommendations([]);
    }
  }, [user, isHistoryLoaded, history.length, isBootstrapping]);

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
    if (selectedScenarioId) {
      setSimulationStatus('idle');
    }
  }, [selectedScenarioId]);

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
            toast.info(`Real-time telemetry received`, {
              description: `Captured ${data.events.length} events from ${data.source}`,
              duration: 3000
            });
          } else if (data.type === 'system') {
            console.log(`[WS SYSTEM] ${data.message}`);
          }
        } catch (err) {
          console.error('[WS] Failed to parse message', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected. Retrying in 5s...');
        setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
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
          // Check for duplicates before adding
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
    refreshThreatIntelligence(); // Initial fetch
    const interval = setInterval(() => {
      refreshThreatIntelligence();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

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
      { name: 'softwareupdated', cmd: '/System/Library/CoreServices/Software Update.app/Contents/Resources/softwareupdated', cat: 'network' as const },
      { name: 'lsd', cmd: '/usr/libexec/lsd', cat: 'execution' as const },
      { name: 'trustd', cmd: '/usr/libexec/trustd', cat: 'network' as const },
      { name: 'opendirectoryd', cmd: '/usr/libexec/opendirectoryd', cat: 'execution' as const },
      { name: 'syspolicyd', cmd: '/usr/libexec/syspolicyd', cat: 'privilege' as const },
      { name: 'tccd', cmd: '/System/Library/PrivateFrameworks/TCC.framework/Support/tccd', cat: 'tcc' as const }
    ];

    const count = Math.floor(Math.random() * 3) + 1;
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

  const getJitter = (base: number) => {
    // Add 20-50% random jitter to simulate real-world execution variance
    const factor = 0.8 + Math.random() * 0.7; 
    return base * factor;
  };

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

    // Check if this is a re-run for this scenario
    const isReRun = history.some(h => h.scenario_id === scenarioId);

    if (!isReRun) {
      // First run: Attacker vs Defender
      return simulateAdversaryVsDefender(scenarioId);
    }

    // If it's a re-run, we use the modified strategy logic
    clearCurrentSimulation();
    setCurrentStepId(null);
    setSimulationStatus('running');
    
    addLog({ 
      type: 'start', 
      message: `>>> MODIFIED_STRATEGY_SIMULATION: ${scenario.name} (Take 2)`,
      details: { 
        mode: 'modified_strategy',
        scenario_id: scenarioId, 
        timestamp: new Date().toISOString()
      }
    });

    const currentEvents: NormalizedEvent[] = [];
    const currentLogs: AttackLogEntry[] = [];
    const currentGaps: TelemetryGap[] = [];
    const currentAnomalies: Anomaly[] = [];
    
    // Learning from previous run
    const previousRun = history.find(h => h.scenario_id === scenarioId);
    const learnedContext = previousRun ? `Based on previous run where ${previousRun.attackLogs.filter(l => l.type === 'warning').length} signals were detected.` : "Adapting to previous defensive blocks.";

    for (const step of scenario.steps) {
      setCurrentStepId(step.id);
      const stepDuration = simulationSettings.duration * 1000;

      // 1. Attacker Adaptation
      addLog({
        type: 'ai_analysis',
        message: `[ATTACKER] Adapting strategy: ${learnedContext} Implementing obfuscation...`,
        details: { actor: 'attacker', strategy: 'obfuscation' },
        actor: 'attacker'
      });
      injectBackgroundNoise();
      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.5)));

      // 2. Attacker Action (Modified)
      const originalCommand = step.expected_signals[0]?.command_line || 'sh -c "..."';
      const modifiedCommand = `base64 -d <<< "${btoa(originalCommand)}" | bash`;
      addLog({ 
        type: 'command', 
        message: `[ATTACKER] Executing Obfuscated: ${step.description}`, 
        command: modifiedCommand,
        step_id: step.id,
        actor: 'attacker'
      });
      
      // Generate Event
      const event: NormalizedEvent = {
        event_id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        event_type: 'ES_EVENT_TYPE_NOTIFY_EXEC',
        category: 'execution',
        process_name: 'bash',
        pid: Math.floor(Math.random() * 10000).toString(),
        parent_pid: Math.floor(Math.random() * 1000).toString(),
        user: 'root',
        command_line: modifiedCommand,
        source: 'esf',
        entities: ['process', 'user'],
        mitre_mapping: step.mitre_mapping
      };
      currentEvents.push(event);
      setEvents(prev => [...prev, event]);
      injectBackgroundNoise();

      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.7)));

      // 3. Defender Adaptation
      addLog({
        type: 'ai_analysis',
        message: `[DEFENDER] Heuristic engine triggered by encoded payload. Enhancing memory scanning...`,
        details: { actor: 'defender', strategy: 'heuristic_scan' },
        actor: 'defender'
      });
      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.6)));

      const defenderCommand = `esctl --monitor --pid ${event.pid} --mem-scan`;
      addLog({
        type: 'command',
        message: `[DEFENDER] Initiating deep memory inspection`,
        command: defenderCommand,
        step_id: step.id,
        actor: 'defender'
      });

      const defenderOutput = `[!] Trace Defender: Memory Scan Result\n[!] PID: ${event.pid}\n[!] Pattern: BASE64_ENCODED_SHELL\n[!] Confidence: 98%\n[!] Action: Immediate Termination Required`;
      
      addLog({
        type: 'info',
        message: `[DEFENDER] STDOUT: Heuristic scan output`,
        output: defenderOutput,
        step_id: step.id,
        actor: 'defender',
        analysis: `Adversary is using Base64 encoding to obfuscate shell commands. Memory scanning identified the decoded payload as a reverse shell attempt.`
      });

      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.5)));

      // 4. Result
      const output = `[!] CRITICAL: Advanced evasion detected and neutralized.\n[!] Process Terminated: SIGKILL sent to PID ${event.pid}.\n[!] Telemetry: Obfuscated execution chain broken.\n[!] ESF_AUTH: Result=ES_AUTH_RESULT_DENY`;
      addLog({ 
        type: 'warning', 
        message: `[SYSTEM] ATTACK_NEUTRALIZED: Modified ${step.mitre_mapping.technique_name} failed.`, 
        output: output,
        step_id: step.id 
      });

      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.8)));
    }

    addLog({ 
      type: 'end', 
      message: `<<< SIMULATION_COMPLETE: Modified attack strategy successfully countered.`,
      details: { status: 'defended_advanced', timestamp: new Date().toISOString() }
    });
    
    setSimulationStatus('finished');
    setCurrentStepId(null);

    // Update gaps and anomalies
    const newGaps: TelemetryGap[] = [{
      scenario_id: scenarioId,
      step_id: 'persist-launchagent',
      missing_signal: 'ES_EVENT_TYPE_NOTIFY_CREATE',
      reason: "Static signatures failed to detect base64 encoded payload. Heuristic analysis was required.",
      impact: "Persistence mechanism established without telemetry signal"
    }];
    setGaps(prev => [...prev, ...newGaps]);

    const newAnomalies: Anomaly[] = [{
      id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "Encoded Shell Execution",
      description: "A bash process was observed executing a base64 decoded payload, which is highly anomalous for this system.",
      severity: "critical",
      time: "Just now",
      details: "The adversary has modified their strategy to use Base64 encoding for command execution, attempting to evade static string-based detections."
    }];
    setAnomalies(prev => [...prev, ...newAnomalies]);

    // Update attack surface and recommendations based on simulation results
    const newSurfaceItems: AttackSurfaceItem[] = scenario.steps.map((step, i) => ({
      id: `sim-item-${Date.now()}-${i}`,
      name: step.expected_signals[0]?.process_name || "Suspicious Process",
      category: "launch_item",
      status: "vulnerable",
      description: `Detected via ${scenario.name}: ${step.description}`,
      last_checked: new Date().toISOString(),
      scenario_id: scenario.id
    }));

    const newRecs: Recommendation[] = scenario.steps.map(step => ({
      title: `Harden ${step.mitre_mapping.technique_name}`,
      desc: `Implement strict ESF monitoring for ${step.mitre_mapping.technique_id}.`,
      insight: `Simulation ${scenario.name} identified a gap in ${step.mitre_mapping.tactic} detection.`,
      scenario_id: scenario.id
    }));

    setAttackSurface(newSurfaceItems);
    setRecommendations(newRecs);

      // Save to history
      const newHistoryItem: SimulationHistory = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        events: [...currentEvents],
        attackLogs: [...currentLogs],
        gaps: [...currentGaps],
        aiAnalysis: "The attacker attempted to use base64 encoding to bypass static signatures, but the defender's heuristic engine identified the behavior pattern.",
        anomalies: [...currentAnomalies]
      };

      if (user) {
        addDoc(collection(db, 'simulations'), {
          uid: user.uid,
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          timestamp: newHistoryItem.timestamp,
          events: JSON.stringify(newHistoryItem.events),
          attackLogs: JSON.stringify(newHistoryItem.attackLogs),
          gaps: JSON.stringify(newHistoryItem.gaps),
          aiAnalysis: newHistoryItem.aiAnalysis,
          anomalies: JSON.stringify(newHistoryItem.anomalies)
        }).catch(err => console.error("Failed to save simulation:", err));
      } else {
        setHistory(prev => [newHistoryItem, ...prev]);
      }

      const updatedHistory = user ? history : [newHistoryItem, ...history];
      const scenarioRuns = updatedHistory.filter(h => h.scenario_id === scenario.id).length;
      
      // AI decides after at least 2 runs
      if (scenarioRuns >= 2) {
        getSimulationAdvisorNotification(scenario.name, scenarioRuns).then(result => {
          if (result && result.shouldNotify && result.message) {
            addNotification({
              title: 'Simulation Advisor',
              summary: result.message,
              type: 'info',
              targetPage: 'surface'
            });
            toast.info('Simulation Advisor', {
              description: result.message
            });
          }
        });
      }
  };

  const simulateAllScenarios = async () => {
    if (simulationStatus === 'running') return;
    
    const templateScenarios = scenarios.filter(s => !s.id.startsWith('custom-'));
    if (templateScenarios.length === 0) return;

    setSimulationStatus('running');
    toast.info("Starting Full Simulation Suite", {
      description: `Executing ${templateScenarios.length} scenarios sequentially.`
    });

    for (const scenario of templateScenarios) {
      setSelectedScenarioId(scenario.id);
      await simulateScenario(scenario.id);
      // Add a small delay between scenarios for visual clarity
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    toast.success("Full Simulation Suite Complete", {
      description: "All scenarios have been executed and telemetry captured."
    });
    setSimulationStatus('finished');
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
      details: { 
        mode: 'adversary_vs_defender',
        scenario_id: scenarioId, 
        timestamp: new Date().toISOString()
      }
    });

    const currentEvents: NormalizedEvent[] = [];
    const currentLogs: AttackLogEntry[] = [];
    const currentGaps: TelemetryGap[] = [];
    const currentAnomalies: Anomaly[] = [];
    let previousOutput = "Initial state: Hardened macOS environment.";

    for (const step of scenario.steps) {
      setCurrentStepId(step.id);
      const stepDuration = simulationSettings.duration * 1000;

      // 1. Attacker Thinking
      addLog({
        type: 'ai_analysis',
        message: `[ATTACKER] Analyzing hardened target... Identifying potential bypasses for ${step.mitre_mapping.technique_name}.`,
        details: { actor: 'attacker' },
        actor: 'attacker'
      });
      injectBackgroundNoise();
      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.4)));

      // 2. Attacker Action
      const command = step.expected_signals[0]?.command_line || 'sh -c "..."';
      addLog({ 
        type: 'command', 
        message: `[ATTACKER] Executing: ${step.description}`, 
        command: command,
        step_id: step.id,
        actor: 'attacker'
      });
      
      // Generate Event
      const event: NormalizedEvent = {
        event_id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        event_type: 'ES_EVENT_TYPE_NOTIFY_EXEC',
        category: 'execution',
        process_name: step.expected_signals[0]?.process_name || 'task',
        pid: Math.floor(Math.random() * 10000).toString(),
        parent_pid: Math.floor(Math.random() * 1000).toString(),
        user: 'root',
        command_line: command,
        file_path: step.expected_signals[0]?.file_path,
        source: 'esf',
        entities: ['process', 'user', 'file'],
        mitre_mapping: step.mitre_mapping
      };
      currentEvents.push(event);
      setEvents(prev => [...prev, event]);
      injectBackgroundNoise();

      await new Promise(resolve => setTimeout(resolve, getJitter(stepDuration * 0.3)));

      // 2.1 Attacker Command Output
      const attackerOutput = `[+] Process spawned: ${event.process_name}\n[+] PID: ${event.pid}\n[+] PPID: ${event.parent_pid}\n[+] User: ${event.user}\n[+] Status: Execution initiated.`;
      addLog({
        type: 'info',
        message: `[ATTACKER] STDOUT: Command execution output`,
        output: attackerOutput,
        step_id: step.id,
        actor: 'attacker'
      });

      await new Promise(resolve => setTimeout(resolve, stepDuration * 0.5));

      // 3. Defender Thinking & Action
      addLog({
        type: 'ai_analysis',
        message: `[DEFENDER] Telemetry spike detected in Endpoint Security Framework (ESF). Analyzing process tree for ${step.mitre_mapping.technique_id}. Correlating with known tradecraft for ${step.mitre_mapping.technique_name}...`,
        details: { actor: 'defender' },
        actor: 'defender'
      });
      await new Promise(resolve => setTimeout(resolve, stepDuration * 0.5));

      const defenderCommand = `esctl --analyze --pid ${event.pid} --mitre ${step.mitre_mapping.technique_id}`;
      addLog({
        type: 'command',
        message: `[DEFENDER] Investigating suspicious process: ${event.process_name}`,
        command: defenderCommand,
        step_id: step.id,
        actor: 'defender'
      });

      const defenderOutput = `[!] Trace Defender: Analysis Result\n[!] PID: ${event.pid}\n[!] Path: ${event.file_path || '/usr/local/bin/' + event.process_name}\n[!] Code Signature: INVALID (Unsigned or Ad-Hoc)\n[!] ESF_AUTH: Detected unauthorized ${step.mitre_mapping.tactic} attempt.\n[!] Recommendation: Terminate and Quarantine.`;
      
      addLog({
        type: 'info',
        message: `[DEFENDER] STDOUT: Defensive analysis output`,
        output: defenderOutput,
        step_id: step.id,
        actor: 'defender',
        analysis: `The process ${event.process_name} (PID: ${event.pid}) lacks a valid Apple signature and is attempting ${step.mitre_mapping.technique_name}. This matches known malware behavior for ${step.mitre_mapping.tactic}.`
      });

      await new Promise(resolve => setTimeout(resolve, stepDuration * 0.5));

      const mitigationCommand = `esctl --block --pid ${event.pid} --quarantine --reason "MITRE_${step.mitre_mapping.technique_id}"`;
      addLog({
        type: 'command',
        message: `[DEFENDER] Executing proactive mitigation`,
        command: mitigationCommand,
        step_id: step.id,
        actor: 'defender'
      });

      const mitigationOutput = `[!] ES_POLICY_BLOCK: Result=SUCCESS\n[!] Action: SIGKILL sent to PID ${event.pid}\n[!] Quarantine: File moved to /Library/Application Support/Trace/Quarantine/\n[!] Audit: Event logged to /var/log/trace/defender.audit`;

      addLog({
        type: 'info',
        message: `[DEFENDER] STDOUT: Mitigation result`,
        output: mitigationOutput,
        step_id: step.id,
        actor: 'defender',
        analysis: `Successfully neutralized the threat. The process was terminated and the binary quarantined to prevent persistence.`
      });

      await new Promise(resolve => setTimeout(resolve, stepDuration * 0.3));

      // 4. Result
      const output = `[!] ALERT: Operation blocked by Trace Defender.\n[!] Access Denied: Operation not permitted.\n[!] Telemetry: ES_EVENT_TYPE_NOTIFY_EXEC blocked.\n[!] MITRE: ${step.mitre_mapping.technique_id} detected.`;
      addLog({ 
        type: 'warning', 
        message: `[SYSTEM] ATTACK_PREVENTED: ${step.mitre_mapping.technique_name} failed.`, 
        output: output,
        step_id: step.id 
      });

      previousOutput = output;
      await new Promise(resolve => setTimeout(resolve, stepDuration * 0.8));
    }

    addLog({ 
      type: 'end', 
      message: `<<< SIMULATION_COMPLETE: Attack successfully neutralized by proactive defenses.`,
      details: { status: 'defended', timestamp: new Date().toISOString() }
    });
    
    setSimulationStatus('finished');
    setCurrentStepId(null);

    // Update gaps and anomalies
    const newGaps: TelemetryGap[] = [{
      scenario_id: scenarioId,
      step_id: scenario.steps[0].id,
      missing_signal: 'ES_EVENT_TYPE_AUTH_EXEC',
      reason: `Identified potential visibility gap in ${scenario.steps[0].mitre_mapping.tactic} during simulation.`,
      impact: "Enable ES_EVENT_TYPE_AUTH_EXEC for suspicious process paths.",
      tactic: scenario.steps[0].mitre_mapping.tactic
    }];
    setGaps(prev => [...prev, ...newGaps]);

    const newAnomalies: Anomaly[] = [{
      id: `anomaly-${Date.now()}`,
      title: "Suspicious Process Execution",
      description: `The process ${scenario.steps[0].expected_signals[0].process_name} attempted to execute with unusual arguments.`,
      severity: "critical",
      time: "Just now",
      details: "A process was spawned from /tmp/exploit which lacks a valid Apple code signature. This is a high-confidence indicator of compromise."
    }];
    setAnomalies(prev => [...prev, ...newAnomalies]);

    // Update attack surface and recommendations based on simulation results
    const newSurfaceItems: AttackSurfaceItem[] = scenario.steps.map((step, i) => ({
      id: `sim-item-${Date.now()}-${i}`,
      name: step.expected_signals[0]?.process_name || "Suspicious Process",
      category: "launch_item",
      status: "vulnerable",
      description: `Detected via ${scenario.name}: ${step.description}`,
      last_checked: new Date().toISOString(),
      scenario_id: scenario.id
    }));

    const newRecs: Recommendation[] = scenario.steps.map(step => ({
      title: `Harden ${step.mitre_mapping.technique_name}`,
      desc: `Implement strict ESF monitoring for ${step.mitre_mapping.technique_id}.`,
      insight: `Simulation ${scenario.name} identified a gap in ${step.mitre_mapping.tactic} detection.`,
      scenario_id: scenario.id
    }));

    setAttackSurface(prev => [...prev.filter(item => item.scenario_id !== scenario.id), ...newSurfaceItems]);
    setRecommendations(prev => [...prev.filter(rec => rec.scenario_id !== scenario.id), ...newRecs]);

      // Save to history
      const newHistoryItem: SimulationHistory = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        events: [...currentEvents],
        attackLogs: [...currentLogs],
        gaps: [...currentGaps],
        aiAnalysis: "The defender successfully identified and blocked the initial attack vector using real-time ESF telemetry monitoring.",
        anomalies: [...currentAnomalies],
        attackSurface: [...newSurfaceItems],
        recommendations: [...newRecs]
      };

      if (user) {
        addDoc(collection(db, 'simulations'), {
          uid: user.uid,
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          timestamp: newHistoryItem.timestamp,
          events: JSON.stringify(newHistoryItem.events),
          attackLogs: JSON.stringify(newHistoryItem.attackLogs),
          gaps: JSON.stringify(newHistoryItem.gaps),
          aiAnalysis: newHistoryItem.aiAnalysis,
          anomalies: JSON.stringify(newHistoryItem.anomalies)
        }).catch(err => console.error("Failed to save simulation:", err));
      } else {
        setHistory(prev => [newHistoryItem, ...prev]);
      }

      const updatedHistory = user ? history : [newHistoryItem, ...history];
      const scenarioRuns = updatedHistory.filter(h => h.scenario_id === scenario.id).length;
      
      // AI decides after at least 2 runs
      if (scenarioRuns >= 2) {
        getSimulationAdvisorNotification(scenario.name, scenarioRuns).then(result => {
          if (result && result.shouldNotify && result.message) {
            addNotification({
              title: 'Simulation Advisor',
              summary: result.message,
              type: 'info',
              targetPage: 'surface'
            });
            toast.info('Simulation Advisor', {
              description: result.message
            });
          }
        });
      }
  };

  return (
    <TelemetryContext.Provider value={{ 
      events, 
      setEvents, 
      scenarios,
      addScenario,
      addCustomScenario,
      gaps, 
      setGaps,
      attackLogs,
      selectedScenarioId,
      setSelectedScenarioId,
      aiAnalysis,
      setAiAnalysis,
      isAnalyzing,
      setIsAnalyzing,
      simulateScenario,
      clearLogs,
      resetSession,
      history,
      loadSimulation,
      attackSurface,
      recommendations,
      anomalies,
      researchAlignment,
      activePage,
      setActivePage,
      refreshAttackSurface,
      isScanning,
      isBootstrapping,
      simulationSettings,
      setSimulationSettings,
      currentStepId,
      simulationStatus,
      user,
      setUser,
      notifications,
      addNotification,
      removeNotification,
      selectedThreatId,
      setSelectedThreatId,
      simulateAdversaryVsDefender,
      simulateAllScenarios
    }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
