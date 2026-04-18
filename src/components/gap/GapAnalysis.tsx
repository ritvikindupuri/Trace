import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, ShieldAlert, BrainCircuit, Loader2, ChevronRight, Zap, HelpCircle, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from '../ui/button';
import { analyzeTelemetryGap } from '../../lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function GapAnalysis() {
  const { gaps, scenarios, setActivePage } = useTelemetry();
  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<Record<string, string>>({});
  const [loadingGaps, setLoadingGaps] = useState<Record<string, boolean>>({});

  const handleAnalyzeGap = async (gapId: string, reason: string, impact: string) => {
    setLoadingGaps(prev => ({ ...prev, [gapId]: true }));
    const reasoning = await analyzeTelemetryGap(reason, impact);
    setAiReasoning(prev => ({ ...prev, [gapId]: reasoning || "Analysis failed." }));
    setLoadingGaps(prev => ({ ...prev, [gapId]: false }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Telemetry Gap Analysis</h2>
          <p className="text-[#86868B]">Identify blind spots where current telemetry is insufficient for detection.</p>
        </div>
        <div className="flex items-center gap-3">
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
                    <AlertTriangle size={18} />
                    <h4 className="font-bold text-sm">Gap Intelligence</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Detection Blindspots</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Gap Analysis identifies steps in a simulation that <strong>failed to generate expected telemetry</strong>. This highlights critical blindspots in your detection pipeline.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Root Cause Analysis</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        The engine analyzes why a signal was missed—whether it's due to <strong>SIP restrictions</strong>, <strong>Unified Log suppression</strong>, or <strong>ESF configuration</strong> issues.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">AI Reasoning</p>
                      <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                        Use <strong>Generate Analysis</strong> to get a deep dive into the security impact of the gap and actionable steps to improve telemetry collection for that specific tradecraft.
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button 
            variant="outline" 
            className="rounded-xl border-[#D2D2D7] text-xs font-bold uppercase h-10 px-4 hover:bg-[#F5F5F7] flex items-center gap-2"
            onClick={() => setActivePage('scenarios')}
          >
            <Zap size={14} className="text-yellow-500" />
            Run New Simulation
          </Button>
        </div>
      </div>

      {gaps.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {gaps.map((gap, i) => {
            const scenario = scenarios.find(s => s.id === gap.scenario_id);
            const step = scenario?.steps.find(s => s.id === gap.step_id);
            const gapId = `${gap.scenario_id}-${gap.step_id}`;

            return (
              <Card key={i} className="border-red-200 bg-red-50/10 overflow-hidden">
                <div className="bg-red-500 h-1 w-full"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="text-red-500" size={20} />
                      <CardTitle className="text-lg">Gap Identified: {step?.description}</CardTitle>
                    </div>
                    <Badge variant="destructive" className="rounded-full px-3">Critical Blindspot</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="font-medium text-[#1D1D1F]">{scenario?.name}</span>
                    <ChevronRight size={14} />
                    <span>Step {step?.order}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#86868B] uppercase tracking-widest">Reason</p>
                      <p className="text-sm text-[#1D1D1F] leading-relaxed bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                        {gap.reason}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#86868B] uppercase tracking-widest">Impact</p>
                      <p className="text-sm text-[#1D1D1F] leading-relaxed bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                        {gap.impact}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#86868B] uppercase tracking-widest">AI-Assisted Reasoning</p>
                      {!aiReasoning[gapId] && !loadingGaps[gapId] && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-7"
                          onClick={() => handleAnalyzeGap(gapId, gap.reason, gap.impact)}
                        >
                          <BrainCircuit size={14} className="mr-2" />
                          Generate Analysis
                        </Button>
                      )}
                    </div>

                    {loadingGaps[gapId] ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 animate-pulse">
                        <Loader2 className="animate-spin text-blue-500" size={18} />
                        <span className="text-sm text-blue-600 font-medium">Analyzing telemetry signals...</span>
                      </div>
                    ) : aiReasoning[gapId] ? (
                      <div className="p-6 rounded-[2rem] bg-white border border-blue-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                          <div className="flex items-center gap-2 text-blue-600">
                            <BrainCircuit size={20} />
                            <span className="text-xs font-bold uppercase tracking-widest">Analyst Insight</span>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold">
                            AI GENERATED
                          </Badge>
                        </div>
                        <div className="markdown-body">
                          <ReactMarkdown>{aiReasoning[gapId]}</ReactMarkdown>
                        </div>
                        <div className="pt-4 border-t border-blue-50 flex items-center gap-2 text-[10px] text-[#86868B] font-bold uppercase tracking-widest">
                          <Info size={12} />
                          <span>This analysis is based on simulated tradecraft and ESF telemetry gaps.</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center text-[#86868B] bg-white rounded-3xl border border-dashed border-[#D2D2D7]">
          <AlertTriangle size={48} className="opacity-10 mb-4" />
          <h3 className="text-lg font-medium text-[#1D1D1F]">No Gaps Identified</h3>
          <p className="text-sm text-center max-w-xs mt-2">
            Run an attack simulation to analyze telemetry coverage and identify potential detection blind spots.
          </p>
        </div>
      )}
    </div>
  );
}
