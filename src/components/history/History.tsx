import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, History as HistoryIcon, Zap, ChevronRight, Trash2, HelpCircle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function History() {
  const { history, loadSimulation, setActivePage } = useTelemetry();

  const handleReopen = (id: string) => {
    loadSimulation(id);
    setActivePage('scenarios');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Simulation History</h2>
          <p className="text-[#86868B]">Review and reopen past macOS security tradecraft simulations.</p>
        </div>
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
                  <HistoryIcon size={18} />
                  <h4 className="font-bold text-sm">History Intelligence</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Simulation Archiving</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Every simulation run is automatically archived with its full <strong>telemetry stream</strong>, <strong>attack logs</strong>, and <strong>AI analysis</strong>.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">State Restoration</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Clicking <strong>Reopen Simulation</strong> restores the entire application state to that specific run, allowing you to re-examine the behavior graph and telemetry explorer for that session.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#86868B] tracking-widest">Comparative Analysis</p>
                    <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                      Use the history to compare different iterations of the same tradecraft or to verify if new detection rules successfully capture previously identified gaps.
                    </p>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((sim) => (
            <Card key={sim.id} className="border-[#D2D2D7] bg-white rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="h-1.5 w-full bg-[#0071E3]"></div>
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 border-[#D2D2D7]">
                    {new Date(sim.timestamp).toLocaleDateString()}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] text-[#86868B] font-medium">
                    <Clock size={12} />
                    {new Date(sim.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-[#1D1D1F] line-clamp-1">{sim.scenario_name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-2 gap-4 mt-4 mb-6">
                  <div className="bg-[#F5F5F7] p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-1">Events</p>
                    <p className="text-xl font-bold text-[#1D1D1F]">{sim.events.length}</p>
                  </div>
                  <div className="bg-[#F5F5F7] p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-1">Logs</p>
                    <p className="text-xl font-bold text-[#1D1D1F]">{sim.attackLogs.length}</p>
                  </div>
                </div>
                <Button 
                  className="w-full rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-bold uppercase h-10 group-hover:gap-3 transition-all"
                  onClick={() => handleReopen(sim.id)}
                >
                  Reopen Simulation
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center text-[#86868B] bg-white rounded-3xl border border-dashed border-[#D2D2D7]">
          <HistoryIcon size={48} className="opacity-10 mb-4" />
          <h3 className="text-lg font-medium text-[#1D1D1F]">No History Found</h3>
          <p className="text-sm text-center max-w-xs mt-2">
            Completed simulations will appear here for later review and analysis.
          </p>
        </div>
      )}
    </div>
  );
}
