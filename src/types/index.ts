export type EventCategory = 'execution' | 'persistence' | 'file_system' | 'network' | 'privilege' | 'tcc' | 'sip' | 'xprotect' | 'credential_access' | 'discovery';

export interface MitreMapping {
  tactic: string;
  technique_id: string;
  technique_name: string;
}

export interface NormalizedEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  category: EventCategory;
  process_name: string;
  pid: string;
  parent_pid: string;
  command_line: string;
  user: string;
  file_path?: string;
  source: 'esf' | 'unified_log' | 'osquery' | 'simulator';
  entities: string[];
  mitre_mapping?: MitreMapping;
  metadata?: Record<string, any>;
}

export interface AttackLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'critical' | 'ai_analysis' | 'mitre' | 'command' | 'start' | 'end';
  message: string;
  step_id?: string;
  details?: any;
  mitre_id?: string;
  command?: string;
  output?: string;
  actor?: 'attacker' | 'defender';
  analysis?: string;
}

export interface AttackStep {
  id: string;
  order: number;
  description: string;
  mitre_mapping: MitreMapping;
  expected_signals: {
    event_type: string;
    category: EventCategory;
    description: string;
    process_name?: string;
    command_line?: string;
    file_path?: string;
  }[];
}

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: AttackStep[];
}

export interface AttackSurfaceItem {
  id: string;
  category: 'system_extension' | 'launch_item' | 'tcc_permission' | 'sip_config' | 'xprotect_rule';
  name: string;
  status: 'secure' | 'warning' | 'vulnerable';
  description: string;
  last_checked: string;
  scenario_id?: string;
  tactic?: string;
}

export interface Recommendation {
  title: string;
  desc: string;
  insight: string;
  scenario_id?: string;
}

export interface TelemetryGap {
  scenario_id: string;
  step_id: string;
  missing_signal: string;
  reason: string;
  impact: string;
  tactic?: string;
}

export interface SimulationHistory {
  id: string;
  timestamp: string;
  scenario_id: string;
  scenario_name: string;
  events: NormalizedEvent[];
  attackLogs: AttackLogEntry[];
  gaps: TelemetryGap[];
  aiAnalysis?: string;
  anomalies?: Anomaly[];
  attackSurface?: AttackSurfaceItem[];
  recommendations?: Recommendation[];
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'process' | 'file' | 'user' | 'socket' | 'dylib';
  label: string;
  metadata?: any;
}

export interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'spawned' | 'executed' | 'wrote_to' | 'modified' | 'loaded' | 'connected';
}

export interface Anomaly {
  id: string;
  title: string;
  description: string;
  time: string;
  severity: 'info' | 'warning' | 'critical';
  details: string;
}

export interface ResearchAlignment {
  headline: string;
  description: string;
  analystTip: string;
  researchFocus: string;
}

export interface SimulationSettings {
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  sources: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  type: 'threat' | 'system' | 'info';
  targetPage?: string;
  metadata?: Record<string, any>;
}
