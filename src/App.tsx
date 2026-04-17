import React, { useState } from 'react';
import { 
  Activity, 
  Shield, 
  Search, 
  Zap, 
  Network, 
  LayoutDashboard, 
  AlertTriangle,
  FileText,
  Menu,
  ChevronRight,
  History as HistoryIcon,
  RotateCcw,
  BrainCircuit,
  Bell,
  X
} from 'lucide-react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip';
import { Toaster } from 'sonner';
import Dashboard from './components/dashboard/Dashboard';
import TelemetryExplorer from './components/telemetry/TelemetryExplorer';
import AttackScenarios from './components/scenarios/AttackScenarios';
import GapAnalysis from './components/gap/GapAnalysis';
import BehaviorGraph from './components/graph/BehaviorGraph';
import History from './components/history/History';

import AttackSurfaceMap from './components/surface/AttackSurfaceMap';
import SecurityIntelligence from './components/intelligence/SecurityIntelligence';
import LandingPage from './components/LandingPage';
import GlobalSearch from './components/search/GlobalSearch';
import { Badge } from './components/ui/badge';

type Page = 'dashboard' | 'telemetry' | 'scenarios' | 'surface' | 'gaps' | 'graph' | 'history' | 'intelligence';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <TooltipProvider>
      <TelemetryProvider>
        <Toaster position="top-right" expand={true} richColors closeButton />
        <AppContent onLogout={() => setShowLanding(true)} />
      </TelemetryProvider>
    </TooltipProvider>
  );
}

function AppContent({ onLogout }: { onLogout: () => void }) {
  const { 
    resetSession, 
    activePage, 
    setActivePage, 
    isBootstrapping, 
    user, 
    notifications, 
    removeNotification,
    setSelectedThreatId 
  } = useTelemetry();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLogout = () => {
    onLogout();
  };

  if (isBootstrapping) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-[#F5F5F7] border-t-[#0071E3] animate-spin"></div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">Initializing Intelligence Engine</h2>
          <p className="text-sm text-[#86868B] animate-pulse">Generating dynamic macOS security scenarios and telemetry profiles...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'telemetry': return <TelemetryExplorer />;
      case 'scenarios': return <AttackScenarios />;
      case 'surface': return <AttackSurfaceMap />;
      case 'gaps': return <GapAnalysis />;
      case 'graph': return <BehaviorGraph />;
      case 'history': return <History />;
      case 'intelligence': return <SecurityIntelligence />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'intelligence', label: 'Security Intelligence', icon: BrainCircuit },
    { id: 'telemetry', label: 'Telemetry Explorer', icon: Search },
    { id: 'scenarios', label: 'Attack Scenarios', icon: Zap },
    { id: 'surface', label: 'Attack Surface', icon: Shield },
    { id: 'gaps', label: 'Gap Analysis', icon: AlertTriangle },
    { id: 'graph', label: 'Behavior Graph', icon: Network },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <div className="flex h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#D2D2D7] flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1D1D1F] flex items-center justify-center relative">
            <div className="w-4 h-[1px] bg-[#1D1D1F] rotate-45"></div>
            <div className="absolute w-1 h-1 bg-blue-500 rounded-full top-1 right-1"></div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Trace</h1>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === item.id 
                    ? 'bg-[#0071E3] text-white' 
                    : 'text-[#424245] hover:bg-[#F5F5F7]'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-[#D2D2D7]">
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-[#86868B]">
            <Shield size={14} />
            <span>macOS Intelligence</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-bottom border-[#D2D2D7] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-[#86868B]">
            <span>Trace</span>
            <ChevronRight size={14} />
            <span className="text-[#1D1D1F] font-medium capitalize">{activePage.replace('-', ' ')}</span>
          </div>

          <div className="flex-1 max-w-md mx-8 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] group-focus-within:text-[#0071E3] transition-colors" size={16} />
            <Input 
              placeholder="Search Trace Intelligence..." 
              className="w-full pl-10 h-10 rounded-full bg-[#F5F5F7] border-none focus-visible:ring-1 focus-visible:ring-[#0071E3] transition-all cursor-pointer"
              onClick={() => setSearchOpen(true)}
              readOnly
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold bg-white">⌘</Badge>
              <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold bg-white">K</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Tooltip>
                <TooltipTrigger 
                  className="rounded-full relative h-10 w-10 flex items-center justify-center hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} className={notifications.length > 0 ? 'text-blue-600' : 'text-[#86868B]'} />
                  {notifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#D2D2D7] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-[#F5F5F7] flex items-center justify-between">
                    <h3 className="text-sm font-bold">Notifications</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setShowNotifications(false)}>
                      <X size={14} />
                    </Button>
                  </div>
                  <ScrollArea className="max-h-[400px]">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-[#F5F5F7]">
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className="p-4 hover:bg-[#F5F5F7] transition-colors group cursor-pointer"
                            onClick={() => {
                              if (notif.targetPage) {
                                if (notif.metadata?.threatId) setSelectedThreatId(notif.metadata.threatId);
                                setActivePage(notif.targetPage as any);
                                setShowNotifications(false);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-[#1D1D1F]">{notif.title}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[9px] text-[#86868B]">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                                  {notif.targetPage && (
                                    <span className="text-[9px] font-bold text-blue-600">
                                      Go to Intelligence
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notif.id);
                                }}
                              >
                                <X size={10} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-[#86868B]">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No new notifications</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 bg-[#F5F5F7] rounded-full border border-[#D2D2D7]">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                {user?.displayName?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium">{user?.displayName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full text-red-600 hover:bg-red-50 text-xs"
              onClick={resetSession}
            >
              <RotateCcw size={14} className="mr-2" />
              Reset
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full text-[#86868B] hover:bg-[#F5F5F7] text-xs"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {renderPage()}
        </div>
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </main>
    </div>
  );
}
