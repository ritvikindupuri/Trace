import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import ArtifactInspector from './components/inspector/ArtifactInspector';
import AuditPanel from './components/audit/AuditPanel';
import { Artifact } from './types';
import LandingPage from './components/LandingPage';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const handleAddArtifact = (artifact: Artifact) => {
    setArtifacts(prev => [...prev, artifact]);
  };

  const handleRemoveArtifact = (id: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
  };

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-white text-[#1D1D1F] font-sans selection:bg-blue-100 overflow-hidden">
        <Toaster position="top-right" expand={true} richColors closeButton />
        
        {/* Left Side: Artifact Inspector (30% width) */}
        <aside className="w-[380px] flex-shrink-0 z-20">
          <ArtifactInspector 
            artifacts={artifacts} 
            onAddArtifact={handleAddArtifact} 
            onRemoveArtifact={handleRemoveArtifact} 
          />
        </aside>

        {/* Right Side: Audit Engine (Remaining width) */}
        <main className="flex-1 min-w-0 z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
          <AuditPanel artifacts={artifacts} />
        </main>
      </div>
    </TooltipProvider>
  );
}
