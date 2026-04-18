import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Lock, 
  Settings, 
  UserCheck, 
  ArrowRight,
  Send,
  Loader2,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Terminal,
  ChevronRight,
  RefreshCcw,
  ListFilter,
  Layers,
  Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Artifact, AuditWorkflow } from '../../types';
import { runAuditStream } from '../../services/auditService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface AuditPanelProps {
  artifacts: Artifact[];
}

const AuditPanel: React.FC<AuditPanelProps> = ({ artifacts }) => {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResponse, setAuditResponse] = useState('');
  const [auditProgress, setAuditProgress] = useState(0);
  const [chats, setChats] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const workflows: AuditWorkflow[] = [
    { id: 'posture', name: 'Full Posture Audit', description: 'Scores the whole machine and lists findings by severity.', type: 'posture', icon: 'ShieldCheck' },
    { id: 'filevault', name: 'FileVault & Secure Boot', description: 'Audits disk encryption, SIP, and SSV status.', type: 'filevault', icon: 'Lock' },
    { id: 'mdm', name: 'MDM Profile Review', description: 'Flags missing payloads and generates corrected snippets.', type: 'mdm', icon: 'Settings' },
    { id: 'privacy', name: 'App & TCC Privacy', description: 'Gatekeeper, XProtect, and TCC privacy grants.', type: 'privacy', icon: 'UserCheck' }
  ];

  const iconMap: Record<string, React.ReactNode> = {
    ShieldCheck: <ShieldCheck size={20} />,
    Lock: <Lock size={20} />,
    Settings: <Settings size={20} />,
    UserCheck: <UserCheck size={20} />
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [auditResponse, chats]);

  const handleStartWorkflow = async (workflowId: string) => {
    if (artifacts.length === 0) {
      alert("Please upload at least one artifact first.");
      return;
    }

    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    setActiveWorkflow(workflowId);
    setIsAuditing(true);
    setAuditResponse('');
    setAuditProgress(10);
    
    setChats(prev => [...prev, { role: 'user', content: `Start ${workflow.name} on ${artifacts.length} artifacts.` }]);

    try {
      setAuditProgress(30);
      const response = await runAuditStream(artifacts, workflow.name, (chunk) => {
        setAuditResponse(prev => prev + chunk);
        setAuditProgress(prev => Math.min(prev + 0.5, 95));
      });
      
      setChats(prev => [...prev, { role: 'assistant', content: response }]);
      setAuditProgress(100);
    } catch (error) {
      setChats(prev => [...prev, { role: 'assistant', content: "Error performing audit. Please check your system artifacts and try again." }]);
    } finally {
      setIsAuditing(false);
      setTimeout(() => setAuditProgress(0), 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-6 h-[80px] forensic-panel sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-ink rounded-2xl flex items-center justify-center shadow-2xl shadow-ink/20 transform hover:scale-110 transition-transform cursor-pointer">
            <Fingerprint size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-ink">Trace Audit Engine</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] text-ink/40 font-bold uppercase tracking-[0.2em]">Core v3.1 Pro Online</p>
            </div>
          </div>
        </div>
        
        {isAuditing && (
          <div className="flex items-center gap-6 w-72 p-3 glass-card rounded-2xl">
             <div className="flex-1 space-y-1.5">
               <div className="flex justify-between text-[9px] font-black text-ink/40 tracking-widest">
                 <span>ANALYSIS IN PROGRESS</span>
                 <span className="text-primary">{Math.floor(auditProgress)}%</span>
               </div>
               <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                 <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${auditProgress}%` }}
                 />
               </div>
             </div>
             <Loader2 size={16} className="text-primary animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-surface/30">
        <ScrollArea className="flex-1 px-8 pt-8" ref={scrollRef}>
          <div className="pb-32 max-w-4xl mx-auto space-y-12">
            
            {/* Initial Workflow Selection */}
            {chats.length === 0 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-4">
                  <Badge className="bg-primary text-white border-none rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.25em] shadow-lg shadow-primary/20">
                    System Ready
                  </Badge>
                  <h2 className="text-5xl font-black tracking-tighter text-ink leading-tight">Identify your context.</h2>
                  <p className="text-ink/40 text-lg max-w-xl mx-auto font-medium">Select a specialized audit path to begin extracting evidence from your system artifacts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {workflows.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleStartWorkflow(w.id)}
                      disabled={isAuditing}
                      className="group relative text-left p-8 bg-white border border-border rounded-[2.5rem] hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 disabled:opacity-50 overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <div className="w-14 h-14 rounded-[1.25rem] bg-surface flex items-center justify-center text-ink group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                            {iconMap[w.icon]}
                          </div>
                          <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-500">
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-ink mb-2">{w.name}</h3>
                        <p className="text-sm text-ink/40 font-medium leading-relaxed">{w.description}</p>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-all"></div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation/Results */}
            <div className="space-y-12">
              {chats.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[85%] p-8 rounded-[2.5rem] shadow-sm relative
                    ${chat.role === 'user' 
                      ? 'bg-ink text-white font-medium text-lg' 
                      : 'forensic-panel text-ink'}
                  `}>
                    <div className="markdown-body">
                      {chat.content === auditResponse && isAuditing ? (
                        <div className="flex flex-col gap-6">
                           <ReactMarkdown>{chat.content}</ReactMarkdown>
                           <div className="flex items-center gap-3 text-[10px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">
                             <Sparkles size={14} />
                             Trace Intelligence Pipeline Active
                           </div>
                        </div>
                      ) : (
                        <ReactMarkdown>{chat.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isAuditing && (
                <div className="flex justify-start">
                   <div className="max-w-[85%] p-8 rounded-[2.5rem] forensic-panel animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="markdown-body">
                       <ReactMarkdown>{auditResponse}</ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-3 mt-8 text-[10px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">
                      <Sparkles size={14} />
                      Synthesizing findings...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Action Bar */}
        <div className="p-6 bg-white border-t border-[#F5F5F7]">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder={artifacts.length > 0 ? "Ask follow-up or provide custom instructions..." : "Upload artifacts to begin..."}
                  disabled={artifacts.length === 0 || isAuditing}
                  className="w-full h-14 pl-6 pr-14 rounded-full border border-[#D2D2D7] focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 transition-all outline-none text-sm disabled:bg-[#F5F5F7] disabled:text-[#86868B]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const val = e.currentTarget.value;
                      e.currentTarget.value = '';
                      setChats(prev => [...prev, { role: 'user', content: val }]);
                      // In a real app we would call handleStartWorkflow with custom text here
                    }
                  }}
                />
                <Button 
                  size="icon" 
                  className="absolute right-2 top-2 h-10 w-10 rounded-full bg-[#1D1D1F] hover:bg-black transition-all"
                  disabled={artifacts.length === 0 || isAuditing}
                >
                  <Send size={18} />
                </Button>
             </div>
             
             {chats.length > 0 && (
               <Button 
                 variant="outline" 
                 size="icon" 
                 className="h-14 w-14 rounded-full border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                 onClick={() => {
                   setChats([]);
                   setAuditResponse('');
                   setActiveWorkflow(null);
                 }}
               >
                 <RefreshCcw size={18} />
               </Button>
             )}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4 opacity-50">
             <div className="flex items-center gap-1 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">
                <CheckCircle2 size={12} className="text-green-500" />
                Evidence Citing Active
             </div>
             <div className="flex items-center gap-1 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">
                <Zap size={12} className="text-yellow-500" />
                SIMD Instruction Audit
             </div>
             <div className="flex items-center gap-1 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">
                <ShieldCheck size={12} className="text-blue-500" />
                CIS Benchmarking
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditPanel;
