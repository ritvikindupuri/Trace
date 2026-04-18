import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { BrainCircuit, Sparkles, Info, ShieldCheck, Zap, Target, HelpCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function SecurityIntelligence() {
  const { researchAlignment, recommendations, scenarios, notifications, selectedThreatId, setSelectedThreatId } = useTelemetry();

  const threatNotifications = notifications.filter(n => n.type === 'threat');

  const threatRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  React.useEffect(() => {
    if (selectedThreatId) {
      // Small delay to ensure the DOM is ready and list is rendered
      const scrollTimer = setTimeout(() => {
        const element = threatRefs.current[selectedThreatId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Clear the selection after a longer stay so the highlight is visible
      const selectTimer = setTimeout(() => setSelectedThreatId(null), 5000);
      
      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(selectTimer);
      };
    }
  }, [selectedThreatId]);

  const handleViewResearch = (threatTitle: string) => {
    // Mapping of common threat keywords to official research papers or articles
    const researchLinks: Record<string, string> = {
      'Atomic Stealer': 'https://www.sentinelone.com/blog/atomic-stealer-macos-malware-distributed-via-malvertising/',
      'LockBit': 'https://www.sentinelone.com/blog/lockbit-locker-ransomware-targets-macos-for-the-first-time/',
      'XLoader': 'https://www.sentinelone.com/blog/xloader-macos-malware-now-distributed-as-office-files/',
      'ShadowVault': 'https://www.guardz.com/blog/shadowvault-macos-malware/',
      'Realst': 'https://www.sentinelone.com/blog/realst-malware-macos-stealer-targets-gamers/',
      'TCC Bypass': 'https://www.jamf.com/blog/macos-tcc-bypass-vulnerability/',
      'SIP Bypass': 'https://support.apple.com/en-us/102149',
      'CVE-2023-': 'https://nvd.nist.gov/vuln/detail/CVE-2023-',
      'CVE-2024-': 'https://nvd.nist.gov/vuln/detail/CVE-2024-',
      'iLeakage': 'https://ileakage.com/',
      'BlastPass': 'https://citizenlab.ca/2023/09/blastpass-nso-group-iphone-zero-click-zero-day-exploit-captured-in-the-wild/',
      'Silver Sparrow': 'https://redcanary.com/blog/clipping-silver-sparrows-wings/',
      'XCSSET': 'https://www.trendmicro.com/vinfo/us/security/news/vulnerabilities-and-exploits/macos-malware-xcsset-uses-zero-day-vulnerability-to-bypass-tcc-protections',
      'Shlayer': 'https://www.sentinelone.com/blog/macos-shlayer-malware-evolves-to-bypass-gatekeeper-notarization/',
    };

    const cleanTitle = threatTitle.replace('New Threat Detected: ', '').trim();
    const foundKey = Object.keys(researchLinks).find(key => cleanTitle.toLowerCase().includes(key.toLowerCase()));
    
    if (foundKey) {
      let url = researchLinks[foundKey];
      if (foundKey.startsWith('CVE-')) {
        const cveMatch = cleanTitle.match(/CVE-\d{4}-\d+/);
        if (cveMatch) url = `https://nvd.nist.gov/vuln/detail/${cveMatch[0]}`;
      }
      window.open(url, '_blank');
    } else {
      // Fallback to a highly targeted search on trusted security research sites
      // We use a more robust search query that avoids "I'm Feeling Lucky" which can be unreliable
      const query = encodeURIComponent(`${cleanTitle} macOS security research sentinelone jamf objective-see`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Offensive Research Alignment</h2>
          <p className="text-[#86868B]">Dynamic intelligence mapping current research to emerging macOS threats.</p>
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
                    <BrainCircuit size={18} />
                    <h4 className="font-bold text-sm">Intelligence Engine</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Research Alignment</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Maps current macOS security research to the platform's state, providing <strong>dynamic research focus</strong> and analyst tips based on emerging tradecraft.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Threat Feed</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Refreshes every 15 minutes, fetching the most recent vulnerability disclosures and campaign data to keep your research relevant.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Hardening</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Generates <strong>real-time recommendations</strong> to secure your environment against specific identified threat patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger 
                className="rounded-xl border border-[#D2D2D7] text-[#424245] h-9 px-4 flex items-center gap-2 hover:bg-[#F5F5F7] transition-colors bg-white"
              >
                <BrainCircuit size={16} className="text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider">System Intelligence Overview</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[350px] p-5 rounded-2xl border-[#D2D2D7] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-600">
                    <BrainCircuit size={18} />
                    <h4 className="font-bold text-sm">System Intelligence</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Bootstrapping</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        The engine initializes with a unique research focus and analyst tips based on current macOS security trends.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Simulation Impact</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Scenarios generate telemetry that the engine monitors to dynamically update the <strong>Attack Surface</strong> and security posture.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Surface Risks</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Tracks vulnerable components in real-time. Successful simulations increment this counter by introducing new risks.
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-[#1D1D1F] text-white overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                  <BrainCircuit size={14} />
                  Intelligence Engine Output
                </CardTitle>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] font-bold">
                  LIVE FEED
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-2xl font-bold break-words">{researchAlignment?.headline || 'Analyzing Emerging macOS Tradecraft...'}</h3>
                {researchAlignment?.headline && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 text-[10px] font-bold uppercase h-9 px-4 shrink-0"
                    onClick={() => handleViewResearch(researchAlignment.headline)}
                  >
                    <ExternalLink size={14} className="mr-2 text-blue-400" />
                    View Source Research
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-4">
                <div className="markdown-body">
                  <ReactMarkdown>
                    {researchAlignment?.description || 'The Intelligence Engine is currently processing recent vulnerability disclosures and adversary emulation data to align your research environment with real-world threats.'}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-3 overflow-hidden group/tip hover:bg-white/[0.08] transition-colors">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Zap size={18} className="group-hover/tip:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Analyst Tip</span>
                  </div>
                  <div className="markdown-body opacity-90 text-white">
                    <ReactMarkdown>
                      {researchAlignment?.analystTip || 'Monitor for unusual XPC communication patterns between unsigned processes and system services.'}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-3 overflow-hidden group/focus hover:bg-white/[0.08] transition-colors">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Target size={18} className="group-hover/focus:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Research Focus</span>
                  </div>
                  <div className="markdown-body opacity-90 text-white">
                    <ReactMarkdown>
                      {researchAlignment?.researchFocus || 'Focus on TCC bypasses involving transparency overrides in ~/Library/Application Support/com.apple.TCC.'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              Dynamic Hardening Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, i) => (
                <Card key={i} className="border-[#D2D2D7] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">{rec.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-[#86868B] leading-relaxed">{rec.desc}</p>
                    <div className="pt-2 border-t border-[#F5F5F7] flex flex-col gap-3">
                      <div>
                        <p className="text-[9px] font-bold text-[#1D1D1F] uppercase tracking-widest opacity-40">Security Insight</p>
                        <p className="text-[10px] text-blue-600 italic mt-0.5">{rec.insight}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full h-7 rounded-lg border-[#D2D2D7] text-[9px] font-bold uppercase hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                        onClick={() => handleViewResearch(rec.title)}
                      >
                        <ExternalLink size={10} className="mr-1.5" />
                        Investigate Origin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              Latest macOS Threats
            </h3>
            <div className="space-y-3">
              {threatNotifications.length > 0 ? threatNotifications.map((threat) => {
                const effectiveId = threat.metadata?.threatId || threat.id;
                return (
                  <Card 
                    key={threat.id} 
                    ref={el => { threatRefs.current[effectiveId] = el; }}
                    className={`border-[#D2D2D7] rounded-2xl shadow-sm border-l-4 border-l-red-500 transition-all duration-700 ${
                      selectedThreatId === effectiveId 
                        ? 'border-red-500 bg-red-50/40 shadow-xl shadow-red-500/10 ring-1 ring-red-200' 
                        : 'hover:border-[#86868B] hover:shadow-md'
                    }`}
                  >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#1D1D1F]">{threat.title.replace('New Threat Detected: ', '')}</p>
                          <Badge variant="outline" className="text-[8px] font-bold uppercase bg-red-50 text-red-600 border-red-100">Active Campaign</Badge>
                        </div>
                        <p className="text-xs text-[#86868B] leading-relaxed">{threat.summary}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[9px] text-[#86868B]">
                            <Clock size={10} />
                            {new Date(threat.timestamp).toLocaleString()}
                          </div>
                          <Button 
                            variant="link" 
                            className="h-auto p-0 text-[10px] font-bold text-blue-600"
                            onClick={() => {
                              handleViewResearch(threat.title);
                              setSelectedThreatId(threat.metadata?.threatId || threat.id);
                            }}
                          >
                            View Research Paper
                            <ExternalLink size={10} className="ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
                <Card className="border-[#D2D2D7] rounded-2xl border-dashed bg-[#F5F5F7]/30">
                  <CardContent className="p-8 text-center text-[#86868B]">
                    <Clock size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Fetching latest threat intelligence... (Refreshes every 15m)</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-[#D2D2D7] rounded-3xl shadow-sm overflow-hidden">
            <CardHeader className="bg-[#F5F5F7]/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" />
                Alignment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#86868B]">Engine Version</span>
                <span className="text-xs font-mono font-bold">GEMINI-3-FLASH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#86868B]">Last Sync</span>
                <span className="text-xs font-mono font-bold">JUST NOW</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#86868B]">Research Scenarios</span>
                <span className="text-xs font-mono font-bold">{scenarios.length}</span>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Active Intelligence Modules</p>
                <div className="space-y-2">
                  {['Adversary Emulation', 'Vulnerability Mapping', 'Telemetry Gap Analysis', 'macOS Internals Audit'].map((mod) => (
                    <div key={mod} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-xs font-medium">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#D2D2D7] rounded-3xl shadow-sm bg-blue-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <Info size={12} />
                Dynamic Alignment Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                This platform is driven by a <strong>Dynamic Intelligence Engine</strong>. Every session reset re-aligns the entire application state—including attack scenarios, surface risks, and research insights—with the latest macOS security research.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
