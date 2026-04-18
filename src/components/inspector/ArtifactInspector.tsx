import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileUp, 
  Terminal, 
  FileText, 
  Trash2, 
  Plus, 
  ScrollText,
  Binary,
  ShieldCheck,
  Activity,
  ChevronDown,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Artifact } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface ArtifactInspectorProps {
  artifacts: Artifact[];
  onAddArtifact: (artifact: Artifact) => void;
  onRemoveArtifact: (id: string) => void;
}

const ArtifactInspector: React.FC<ArtifactInspectorProps> = ({ 
  artifacts, 
  onAddArtifact, 
  onRemoveArtifact 
}) => {
  const [isAddingText, setIsAddingText] = useState(false);
  const [newTextName, setNewTextName] = useState('');
  const [newTextContent, setNewTextContent] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        onAddArtifact({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'file',
          content,
          mimeType: file.type,
          timestamp: new Date().toISOString(),
          size: file.size
        });
      };
      reader.readAsText(file);
    });
  }, [onAddArtifact]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxSize: 2 * 1024 * 1024 // 2MB
  });

  const handleAddText = () => {
    if (!newTextName || !newTextContent) return;
    onAddArtifact({
      id: Math.random().toString(36).substr(2, 9),
      name: newTextName,
      type: 'command_output',
      content: newTextContent,
      timestamp: new Date().toISOString()
    });
    setNewTextName('');
    setNewTextContent('');
    setIsAddingText(false);
  };

  const artifactIcons = {
    file: <FileText size={16} />,
    command_output: <Terminal size={16} />
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border shadow-2xl z-20">
      <div className="p-6 pb-4 bg-white/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ink text-white flex items-center justify-center shadow-lg shadow-ink/20">
              <Binary size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink">Inspector</h2>
              <p className="text-[10px] text-ink/40 font-mono">v4.0.2 Stable</p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-full bg-white font-mono text-[10px] border-border/50 px-3">
            {artifacts.length}
          </Badge>
        </div>

        <div 
          {...getRootProps()} 
          className={`
            relative h-36 border-2 border-dashed rounded-[2rem] transition-all duration-500 flex flex-col items-center justify-center gap-2 cursor-pointer group overflow-hidden
            ${isDragActive ? 'border-primary bg-primary/5 scale-[0.98]' : 'border-border bg-white hover:border-ink/20 hover:shadow-xl hover:shadow-ink/5'}
          `}
        >
          <input {...getInputProps()} />
          <div className={`p-4 rounded-full transition-all duration-500 ${isDragActive ? 'bg-primary text-white scale-110' : 'bg-surface text-ink/40 group-hover:scale-110 group-hover:bg-ink group-hover:text-white'}`}>
            <FileUp size={24} />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-ink mb-1">Source Ingestion</p>
            <p className="text-[10px] text-ink/40 font-medium">Drop artifacts to begin</p>
          </div>
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pt-6 bg-surface/50">
        <div className="space-y-4 pb-20">
          <AnimatePresence initial={false}>
            {artifacts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 border border-[#D2D2D7]">
                  <ScrollText size={20} className="text-[#86868B]" />
                </div>
                <p className="text-xs font-semibold text-[#1D1D1F]">No artifacts attached</p>
                <p className="text-[10px] text-[#86868B] max-w-[200px] mt-1">Upload system files or paste command output to begin audit.</p>
              </motion.div>
            ) : (
              artifacts.map((artifact) => (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative"
                >
                  <div className="glass-card rounded-[2rem] overflow-hidden hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shadow-inner ${artifact.type === 'file' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {artifactIcons[artifact.type]}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-ink line-clamp-1">{artifact.name}</p>
                            <p className="text-[9px] text-ink/40 font-mono uppercase tracking-widest">
                              {artifact.type.replace('_', ' ')} • {(artifact.size ? (artifact.size / 1024).toFixed(1) + ' KB' : 'Stream')}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full text-ink/20 group-hover:text-red-600 transition-colors"
                          onClick={() => onRemoveArtifact(artifact.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      <div className="bg-surface/50 rounded-[1.25rem] p-3 border border-border/50 max-h-20 overflow-hidden relative">
                        <pre className="text-[9px] font-mono text-ink/60 whitespace-pre-wrap break-all leading-relaxed">
                          {artifact.content.slice(0, 150)}
                          {artifact.content.length > 150 && '...'}
                        </pre>
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-surface/80 to-transparent" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="p-6 bg-white border-t border-[#D2D2D7]">
        <AnimatePresence>
          {isAddingText ? (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 mb-4 overflow-hidden"
            >
              <Input 
                placeholder="Artifact Name (e.g., csrutil status)" 
                value={newTextName}
                onChange={(e) => setNewTextName(e.target.value)}
                className="rounded-xl border-[#D2D2D7] text-xs h-9 focus-visible:ring-[#0071E3]"
              />
              <Textarea 
                placeholder="Paste command output or raw data..." 
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                className="rounded-xl border-[#D2D2D7] text-[11px] min-h-[120px] font-mono focus-visible:ring-[#0071E3]"
              />
              <div className="flex gap-2">
                <Button 
                  className="flex-1 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-semibold"
                  onClick={handleAddText}
                  disabled={!newTextName || !newTextContent}
                >
                  Confirm Artifact
                </Button>
                <Button 
                  variant="outline" 
                   className="rounded-xl text-xs"
                   onClick={() => setIsAddingText(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full rounded-2xl border-[#D2D2D7] h-11 text-xs font-semibold gap-2 transition-all hover:bg-[#F5F5F7]"
              onClick={() => setIsAddingText(true)}
            >
              <Plus size={16} />
              Paste Raw Data
            </Button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ArtifactInspector;
