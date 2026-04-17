import React, { useState, useEffect, useMemo } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { 
  Search, 
  X, 
  Activity, 
  Shield, 
  Terminal, 
  ChevronRight, 
  Clock,
  Database,
  FileText,
  Zap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Button } from '../ui/button';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { events, attackLogs, attackSurface, setActivePage } = useTelemetry();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return { events: [], logs: [], surface: [] };

    const lowerQuery = query.toLowerCase();

    return {
      events: events.filter(e => 
        e.process_name?.toLowerCase().includes(lowerQuery) || 
        e.command_line?.toLowerCase().includes(lowerQuery) ||
        e.event_type?.toLowerCase().includes(lowerQuery)
      ).slice(0, 10),
      logs: attackLogs.filter(l => 
        l.message.toLowerCase().includes(lowerQuery) || 
        l.command?.toLowerCase().includes(lowerQuery)
      ).slice(0, 10),
      surface: attackSurface.filter(s => 
        s.name.toLowerCase().includes(lowerQuery) || 
        s.description.toLowerCase().includes(lowerQuery) ||
        s.category.toLowerCase().includes(lowerQuery)
      ).slice(0, 10)
    };
  }, [query, events, attackLogs, attackSurface]);

  const totalResults = results.events.length + results.logs.length + results.surface.length;

  const handleNavigate = (page: string) => {
    setActivePage(page);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-[#D2D2D7] shadow-2xl">
        <div className="flex items-center p-4 border-b border-[#F5F5F7] bg-white">
          <Search className="text-[#86868B] mr-3" size={20} />
          <Input 
            placeholder="Search telemetry, logs, or surface inventory..." 
            className="flex-1 border-none shadow-none focus-visible:ring-0 text-lg p-0 h-auto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold text-[#86868B] border-[#D2D2D7]">ESC</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
              <X size={16} />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          {query.length > 0 && query.length < 2 ? (
            <div className="p-12 text-center text-[#86868B]">
              <p className="text-sm">Type at least 2 characters to search...</p>
            </div>
          ) : query.length >= 2 && totalResults === 0 ? (
            <div className="p-12 text-center text-[#86868B]">
              <Search size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm font-medium">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try searching for process names, MITRE techniques, or system paths.</p>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-2 space-y-6 pb-8">
              {results.surface.length > 0 && (
                <div className="space-y-2">
                  <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-[#86868B] flex items-center gap-2">
                    <Shield size={12} />
                    Surface Inventory ({results.surface.length})
                  </h3>
                  <div className="space-y-1">
                    {results.surface.map((item) => (
                      <button 
                        key={item.id}
                        className="w-full flex items-center justify-between p-3 px-4 rounded-xl hover:bg-[#F5F5F7] transition-colors text-left group"
                        onClick={() => handleNavigate('surface')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.status === 'secure' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-bold text-[#1D1D1F]">{item.name}</p>
                            <p className="text-[11px] text-[#86868B] line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[#D2D2D7] group-hover:text-[#0071E3] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.events.length > 0 && (
                <div className="space-y-2">
                  <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-[#86868B] flex items-center gap-2">
                    <Activity size={12} />
                    Telemetry Events ({results.events.length})
                  </h3>
                  <div className="space-y-1">
                    {results.events.map((event) => (
                      <button 
                        key={event.event_id}
                        className="w-full flex items-center justify-between p-3 px-4 rounded-xl hover:bg-[#F5F5F7] transition-colors text-left group"
                        onClick={() => handleNavigate('telemetry')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Terminal size={12} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1D1D1F]">{event.process_name || event.event_type}</p>
                            <code className="text-[10px] text-[#86868B] line-clamp-1 font-mono">{event.command_line || event.file_path}</code>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[#D2D2D7] group-hover:text-[#0071E3] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.logs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-[#86868B] flex items-center gap-2">
                    <Zap size={12} />
                    Attack Logs ({results.logs.length})
                  </h3>
                  <div className="space-y-1">
                    {results.logs.map((log) => (
                      <button 
                        key={log.id}
                        className="w-full flex items-center justify-between p-3 px-4 rounded-xl hover:bg-[#F5F5F7] transition-colors text-left group"
                        onClick={() => handleNavigate('scenarios')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                            <FileText size={12} className="text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1D1D1F] line-clamp-1">{log.message}</p>
                            <p className="text-[10px] text-[#86868B]">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[#D2D2D7] group-hover:text-[#0071E3] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#F5F5F7] flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-[#D2D2D7]" />
              </div>
              <h4 className="text-sm font-bold text-[#1D1D1F]">Global Trace Search</h4>
              <p className="text-xs text-[#86868B] mt-1 max-w-[240px] mx-auto">
                Search across all telemetry signals, attack logs, and surface inventory items.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className="p-3 rounded-2xl border border-[#F5F5F7] text-left space-y-1">
                  <p className="text-[10px] font-bold text-[#86868B] uppercase">Try searching</p>
                  <p className="text-[11px] font-medium text-blue-600">"Safari"</p>
                </div>
                <div className="p-3 rounded-2xl border border-[#F5F5F7] text-left space-y-1">
                  <p className="text-[10px] font-bold text-[#86868B] uppercase">Try searching</p>
                  <p className="text-[11px] font-medium text-blue-600">"T1543"</p>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-3 bg-[#F5F5F7] flex items-center justify-center gap-6 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="bg-white px-1.5 h-5 text-[9px]">ENTER</Badge>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="bg-white px-1.5 h-5 text-[9px]">↑↓</Badge>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="bg-white px-1.5 h-5 text-[9px]">ESC</Badge>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
