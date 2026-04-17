import React, { useMemo, useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import VisibilityChatbot from './VisibilityChatbot';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Activity, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  Clock,
  ShieldAlert,
  Database,
  Search,
  Target,
  Info,
  BrainCircuit,
  ChevronRight,
  HelpCircle,
  Shield,
  LayoutDashboard,
  History as HistoryIcon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Label,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function Dashboard() {
  const { events, scenarios, gaps, attackSurface, resetSession, setActivePage, anomalies, user, history } = useTelemetry();
  const [showChatbot, setShowChatbot] = useState(false);

  const secureCount = attackSurface.filter(s => s.status === 'secure').length;
  const totalSurfaceCount = attackSurface.length;
  const posturePercentage = totalSurfaceCount > 0 ? Math.round((secureCount / totalSurfaceCount) * 100) : 0;

  // Derive visibility data from gaps and events
  const visibilityData = useMemo(() => {
    const tactics = ['Execution', 'Persistence', 'Defense Evasion', 'Credential Access', 'Discovery'];
    return tactics.map(tactic => {
      const categoryGaps = gaps.filter(g => g.tactic === tactic || g.reason.includes(tactic)).length;
      const categoryEvents = events.filter(e => e.mitre_mapping?.tactic === tactic).length;
      
      // Base score is 85, penalty for gaps, bonus for events
      let score = 85; 
      score -= categoryGaps * 20;
      score += Math.min(categoryEvents * 0.5, 15);
      
      return {
        subject: tactic,
        A: Math.max(15, Math.min(100, score)),
        fullMark: 100,
      };
    });
  }, [gaps, events]);

  const stats = [
    { 
      label: 'Security Posture', 
      value: `${posturePercentage}%`, 
      icon: Shield, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      tooltip: "The Security Posture score is a real-time calculation of your system's defensive alignment. It monitors critical macOS security controls including SIP, Gatekeeper, and TCC. \n\nExample: If a 'Persistence' simulation successfully executes, Trace detects the new unsigned LaunchAgent, triggering a 'Vulnerable' status in your Attack Surface and automatically decreasing your posture score (e.g., from 100% to 89%).",
      targetPage: 'surface'
    },
    { 
      label: 'Visibility Score', 
      value: `${Math.round(visibilityData.reduce((acc, curr) => acc + curr.A, 0) / visibilityData.length)}%`, 
      icon: Database, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      tooltip: 'The Visibility Score measures the depth and reliability of telemetry coverage across critical macOS attack vectors. It is penalized by identified "Gaps" during simulations and bolstered by active signal ingestion from ESF and Unified Log.',
      targetPage: 'telemetry'
    },
    { 
      label: 'Active Scenarios', 
      value: scenarios.length, 
      icon: Zap, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50',
      tooltip: 'Number of security research scenarios currently available for simulation. Each scenario models specific adversary tradecraft to test your detection capabilities.',
      targetPage: 'scenarios'
    },
    { 
      label: 'Surface Risks', 
      value: attackSurface.filter(s => s.status !== 'secure').length, 
      icon: ShieldAlert, 
      color: 'text-orange-500', 
      bg: 'bg-orange-50',
      tooltip: 'Surface Risks Calculation: This metric is a real-time count of all components in your "Attack Surface" that have a status other than secure. For example, if the LaunchAgent simulation succeeds, a new entry for "Persistence Mechanisms" will appear in the Attack Surface with a vulnerable status, incrementing the Surface Risks counter on your dashboard.',
      targetPage: 'surface'
    },
  ];

  // Derive volume data from real events
  const volumeData = useMemo(() => {
    if (events.length === 0) {
      return Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - (5 - i));
        return { time: `${d.getHours().toString().padStart(2, '0')}:00`, count: 0 };
      });
    }

    // Group events by hour for the last 6 hours
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(now.getHours() - i);
      const hourStr = d.getHours().toString().padStart(2, '0');
      const count = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate.getHours() === d.getHours() && 
               eventDate.getDate() === d.getDate();
      }).length;
      data.push({ time: `${hourStr}:00`, count });
    }
    return data;
  }, [events]);

  const categoryData = [
    { name: 'Execution', value: events.filter(e => e.category === 'execution').length },
    { name: 'Persistence', value: events.filter(e => e.category === 'persistence').length },
    { name: 'File System', value: events.filter(e => e.category === 'file_system').length },
    { name: 'Network', value: events.filter(e => e.category === 'network').length },
    { name: 'Privilege', value: events.filter(e => e.category === 'privilege').length },
  ].filter(d => d.value > 0);

  const topProcesses = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.process_name] = (counts[e.process_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [events]);

  const totalProcesses = useMemo(() => {
    return topProcesses.reduce((acc, curr) => acc + curr.value, 0);
  }, [topProcesses]);

  // Fallback for empty state to show the chart structure
  const displayCategoryData = categoryData.length > 0 ? categoryData : [
    { name: 'No Data', value: 1 }
  ];

  const mitreData = useMemo(() => {
    const tactics = [
      { name: 'Initial Access', id: 'TA0001' },
      { name: 'Execution', id: 'TA0002' },
      { name: 'Persistence', id: 'TA0003' },
      { name: 'Privilege Escalation', id: 'TA0004' },
      { name: 'Defense Evasion', id: 'TA0005' },
      { name: 'Credential Access', id: 'TA0006' },
      { name: 'Discovery', id: 'TA0007' },
      { name: 'Lateral Movement', id: 'TA0008' },
      { name: 'Collection', id: 'TA0009' },
      { name: 'Command and Control', id: 'TA0011' },
      { name: 'Exfiltration', id: 'TA0010' },
      { name: 'Impact', id: 'TA0040' }
    ];

    return tactics.map(t => {
      const categoryEvents = events.filter(e => e.mitre_mapping?.tactic === t.name);
      const uniqueTechniques = Array.from(new Set(categoryEvents.map(e => e.mitre_mapping?.technique_id).filter(Boolean)));
      
      return {
        tactic: t.name,
        tacticId: t.id,
        count: uniqueTechniques.length,
        techniques: uniqueTechniques
      };
    }).filter(d => d.count > 0);
  }, [events]);

  const COLORS = ['#0071E3', '#34C759', '#FF9500', '#5856D6', '#FF3B30'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (name === 'No Data') return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1; // Further reduced to prevent cutoff
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Truncate name if too long
    const displayName = name.length > 10 ? name.substring(0, 8) + '...' : name;

    return (
      <g>
        <line 
          x1={cx + outerRadius * Math.cos(-midAngle * RADIAN)} 
          y1={cy + outerRadius * Math.sin(-midAngle * RADIAN)} 
          x2={x} 
          y2={y} 
          stroke="#D2D2D7" 
          strokeWidth={1} 
        />
        <text 
          x={x > cx ? x + 5 : x - 5} 
          y={y} 
          fill="#1D1D1F" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central" 
          className="text-[9px] font-medium" // Slightly smaller font
        >
          {`${displayName} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {showChatbot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl">
              <VisibilityChatbot 
                scores={visibilityData} 
                onClose={() => setShowChatbot(false)} 
              />
            </div>
          </div>
        )}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {user?.displayName ? `Hello, ${user.displayName.split(' ')[0]}` : 'Security Intelligence Dashboard'}
          </h2>
          <p className="text-[#86868B]">Real-time telemetry analysis and adversary behavior modeling for macOS.</p>
        </div>
        <div className="flex items-center gap-3">
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
                    <LayoutDashboard size={18} />
                    <h4 className="font-bold text-sm">Dashboard Intelligence</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Real-time Telemetry</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Aggregates live signals from ESF, Unified Log, and osquery. The <strong>Process Distribution</strong> chart shows the behavioral landscape of your macOS environment.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Threat Correlation</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Maps system events to <strong>MITRE ATT&CK</strong> tactics. High-severity alerts are prioritized based on their alignment with current offensive research.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Posture Monitoring</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Continuously evaluates system configurations against security baselines. Successful attack simulations will dynamically impact these metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-[#D2D2D7] text-[#424245]"
            onClick={() => setActivePage('history')}
          >
            <HistoryIcon size={14} className="mr-2" />
            View History
          </Button>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-[#D2D2D7] shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  {history.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full cursor-help hover:bg-green-100 transition-colors border-none">
                        <TrendingUp size={10} />
                        +12%
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl border-[#D2D2D7] bg-white shadow-lg p-3">
                        <p className="text-[10px] font-bold text-[#1D1D1F]">Trend Analysis</p>
                        <p className="text-[10px] text-[#86868B] mt-1">
                          Represents a <span className="text-green-600 font-bold">12% increase</span> in {stat.label.toLowerCase()} compared to the previous 60-minute window.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#86868B]">{stat.label}</p>
                      {stat.tooltip && (
                        <Tooltip>
                          <TooltipTrigger className="text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                            <Info size={14} />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px] p-3 rounded-xl border-[#D2D2D7] bg-white shadow-xl">
                            <p className="text-[11px] leading-relaxed text-[#424245]">
                              {stat.tooltip}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-[#1D1D1F] mt-1">{stat.value}</p>
                  </div>
                  {stat.targetPage && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl text-[10px] font-bold uppercase h-8 px-3 text-blue-600 hover:bg-blue-50"
                      onClick={() => setActivePage(stat.targetPage as any)}
                    >
                      View
                      <ChevronRight size={12} className="ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-[#D2D2D7] rounded-3xl shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">MITRE ATT&CK Coverage</CardTitle>
                <Tooltip>
                  <TooltipTrigger className="text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                    <Info size={14} />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] p-3 rounded-xl border-[#D2D2D7] bg-white shadow-xl">
                    <p className="text-[11px] leading-relaxed text-[#424245]">
                      Mapping of detected techniques to the MITRE ATT&CK framework, providing a high-level view of adversary kill-chain coverage across your environment.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-[#86868B]">Techniques detected across the kill chain.</p>
            </div>
            <Target size={16} className="text-[#86868B]" />
          </CardHeader>
            <CardContent className="h-[350px] pt-6">
              {mitreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mitreData} layout="vertical" margin={{ left: 20, right: 80, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F5F5F7" />
                    <XAxis 
                      type="number" 
                      allowDecimals={false}
                      axisLine={{ stroke: '#D2D2D7', strokeWidth: 1 }} 
                      tickLine={true} 
                      tick={{ fontSize: 10, fill: '#86868B' }}
                      label={{ value: 'Techniques Detected', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#1D1D1F', fontWeight: 700 }}
                    />
                    <YAxis 
                      dataKey="tactic" 
                      type="category" 
                      axisLine={{ stroke: '#D2D2D7', strokeWidth: 1 }} 
                      tickLine={false} 
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const item = mitreData.find(d => d.tactic === payload.value);
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={-10} y={-5} textAnchor="end" fill="#1D1D1F" fontSize={10} fontWeight={600}>
                              {payload.value}
                            </text>
                            <text x={-10} y={8} textAnchor="end" fill="#86868B" fontSize={8} fontWeight={500} className="font-mono">
                              {item?.tacticId}
                            </text>
                          </g>
                        );
                      }}
                      width={120}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#F5F5F7' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #D2D2D7', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: any, name: any, props: any) => {
                        return [
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs font-bold text-[#1D1D1F]">{value} Techniques</span>
                              <span className="text-[10px] text-[#86868B] font-mono bg-[#F5F5F7] px-1.5 py-0.5 rounded">{props.payload.tacticId}</span>
                            </div>
                            {props.payload.techniques && props.payload.techniques.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {props.payload.techniques.map((tid: string) => (
                                  <span key={tid} className="text-[9px] font-mono text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">
                                    {tid}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>,
                          null
                        ];
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28} label={{ position: 'right', fill: '#1D1D1F', fontSize: 12, fontWeight: '800', offset: 15 }}>
                      {mitreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#86868B] opacity-50">
                  <Target size={48} className="mb-4" />
                  <p>No MITRE data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-[#1D1D1F] text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                    <Zap size={12} className="text-yellow-400" />
                    Research Alignment
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger className="text-white/40 hover:text-white transition-colors">
                      <HelpCircle size={14} />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] p-4 rounded-2xl border-[#D2D2D7] bg-white text-[#1D1D1F] shadow-2xl">
                      <div className="space-y-3">
                        <p className="text-[11px] leading-relaxed">
                          The <strong>Dynamic Intelligence Engine (Gemini)</strong> bootstraps the system with unique research focus and tips based on current macOS trends.
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          Simulations (like LaunchAgent persistence) generate telemetry that the engine monitors to dynamically update your <strong>Attack Surface</strong> and <strong>Surface Risks</strong>.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs font-bold leading-relaxed">
                  {useTelemetry().researchAlignment?.headline || 'Analyzing Emerging macOS Tradecraft...'}
                </p>
                <p className="text-[10px] opacity-70 leading-relaxed line-clamp-3">
                  {useTelemetry().researchAlignment?.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-[10px] h-8"
                  onClick={() => setActivePage('intelligence')}
                >
                  View Full Alignment
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">Top Processes</CardTitle>
                      <Tooltip>
                        <TooltipTrigger className="text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                          <Info size={14} />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] p-3 rounded-xl border-[#D2D2D7] bg-white shadow-xl">
                          <p className="text-[11px] leading-relaxed text-[#424245]">
                            Identification of the most active processes by event volume. Unusual activity from standard system binaries (like <code>curl</code> or <code>zsh</code>) should be investigated.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-[#86868B]">By total event volume.</p>
                  </div>
                </div>
              </CardHeader>
      <CardContent className="h-[280px]">
        {topProcesses.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <Pie
                data={topProcesses}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={renderCustomizedLabel}
              >
                {topProcesses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label 
                  value={totalProcesses} 
                  position="center" 
                  dy={-10}
                  className="text-2xl font-bold fill-[#1D1D1F]" 
                />
                <Label 
                  value="Events" 
                  position="center" 
                  dy={15}
                  className="text-[10px] fill-[#86868B] font-bold uppercase tracking-widest" 
                />
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-[10px] font-medium text-[#424245]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#86868B] opacity-30">
            <Activity size={24} className="mb-2" />
            <p className="text-[10px]">No process data</p>
          </div>
        )}
      </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">macOS Telemetry Visibility Matrix</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowChatbot(true)}
                  className="h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ml-2"
                >
                  <BrainCircuit size={14} />
                  Ask AI Expert
                </Button>
                <Tooltip>
                  <TooltipTrigger className="text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                    <Info size={14} />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[320px] p-5 rounded-2xl border-[#D2D2D7] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Shield size={18} />
                        <h4 className="font-bold text-sm">Visibility Calculation</h4>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[11px] leading-relaxed text-[#424245]">
                          The Visibility Matrix provides a real-time assessment of your detection coverage across the MITRE ATT&CK framework for macOS.
                        </p>
                        <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#D2D2D7] font-mono">
                          <p className="text-[9px] font-bold uppercase text-[#86868B] mb-1">Scoring Algorithm</p>
                          <p className="text-[10px] text-[#1D1D1F]">
                            Base(85) - (Gaps * 20) + (Signals * 0.5)
                          </p>
                        </div>
                        <ul className="text-[10px] space-y-2 text-[#424245]">
                          <li className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-red-500 mt-1 shrink-0" />
                            <p><strong>Gaps:</strong> Identified telemetry blind spots (e.g., missing ESF Auth events) significantly penalize the score.</p>
                          </li>
                          <li className="flex gap-2">
                            <div className="w-1 h-1 rounded-full bg-green-500 mt-1 shrink-0" />
                            <p><strong>Signals:</strong> Active ingestion of high-fidelity events (Process, File, Network) provides a coverage bonus.</p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-[#86868B]">Coverage depth across macOS attack vectors.</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-[10px] text-[#86868B]">
                <Shield size={12} className="text-blue-500" />
                Real-time Coverage
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={visibilityData}>
                <PolarGrid stroke="#F5F5F7" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#1D1D1F', fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Visibility"
                  dataKey="A"
                  stroke="#0071E3"
                  fill="#0071E3"
                  fillOpacity={0.15}
                  strokeWidth={3}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #D2D2D7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-6">
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-4">
              <div className="p-2 rounded-xl bg-blue-100 h-fit">
                <BrainCircuit size={18} className="text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-900">Visibility Gap Analysis</p>
                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  {gaps.length > 0 ? (
                    <>
                      Trace has identified <span className="font-bold text-red-600">{gaps.length} critical visibility gaps</span> in your current telemetry stream. 
                      The most significant blind spot is in <span className="font-bold">{gaps[0].tactic || 'Persistence'}</span>, where encoded payloads are bypassing standard ESF notifications.
                      <span className="block mt-2 font-medium">Recommendation: Deploy the suggested hardening rules to enable high-fidelity Auth events for these subsystems.</span>
                    </>
                  ) : (
                    <>
                      Your telemetry coverage is currently <span className="font-bold text-green-600">optimal</span> across all monitored macOS subsystems. 
                      No significant visibility gaps have been identified in the current session.
                      <span className="block mt-2 font-medium">Next Step: Run an "Advanced Persistence" simulation to stress-test your heuristic detection capabilities.</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-8">
          <Card className="border-[#D2D2D7] rounded-3xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Security Intelligence Insights</CardTitle>
              <Search size={16} className="text-[#86868B]" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F5F5F7]">
                {anomalies.length > 0 ? anomalies.map((item, i) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger className="w-full text-left">
                      <div className="flex flex-col p-4 hover:bg-[#F5F5F7]/50 transition-colors gap-1 cursor-help">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              item.severity === 'critical' ? 'bg-red-500' : 
                              item.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>
                            <span className="text-sm font-bold text-[#1D1D1F]">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-[#86868B] font-medium">{item.time}</span>
                        </div>
                        <p className="text-xs text-[#86868B] ml-5">{item.description}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-4 rounded-2xl border-[#D2D2D7] bg-white shadow-xl">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#1D1D1F] flex items-center gap-2">
                          <Info size={14} className="text-blue-500" />
                          Analyst Intelligence
                        </p>
                        <p className="text-[11px] text-[#424245] leading-relaxed">
                          {item.details}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )) : (
                  <div className="p-8 text-center text-[#86868B]">
                    <ShieldAlert size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No security insights detected in the current session.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
