import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, User, BrainCircuit, Sparkles, Database, Fingerprint } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { chatAboutScenarioInventory } from '../../lib/gemini';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

interface ForensicEvidenceChatProps {
  scenarioName: string;
  items: any[];
}

export default function ForensicEvidenceChat({ scenarioName, items }: ForensicEvidenceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatAboutScenarioInventory(
        scenarioName,
        items,
        userMessage,
        messages
      );
      setMessages(prev => [...prev, { role: 'model', parts: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', parts: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-[#D2D2D7] rounded-[2rem] bg-[#FBFBFD] overflow-hidden shadow-sm">
      <div className="p-5 border-b border-[#F5F5F7] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Fingerprint size={20} className="text-purple-500" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#86868B] block">Forensic Intelligence</span>
            <span className="text-[11px] font-bold text-[#1D1D1F] line-clamp-1">{scenarioName} Triage</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1D1D1F] text-white">
          <Sparkles size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Gemini 3.0 Experimental</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-6">
                <Database size={32} className="text-[#D2D2D7]" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-2">Evidence Triage Chat</h3>
              <p className="text-xs text-[#86868B] max-w-[240px] leading-relaxed">
                Analyze the {items.length} high-signal evidence markers from this attack. Explore chain of custody and tradecraft links.
              </p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-[#1D1D1F] text-white' : 'bg-purple-50 text-purple-600'}`}>
                {msg.role === 'user' ? <User size={18} /> : <BrainCircuit size={18} />}
              </div>
              <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#0071E3] text-white rounded-tr-none shadow-md shadow-blue-500/10' 
                  : 'bg-white border border-[#F5F5F7] text-[#1D1D1F] rounded-tl-none shadow-sm'
              }`}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.parts}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <BrainCircuit size={18} className="text-purple-600 animate-bounce" />
              </div>
              <div className="bg-white border border-[#F5F5F7] p-5 rounded-3xl rounded-tl-none shadow-sm">
                <Loader2 size={18} className="animate-spin text-purple-500" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-6 bg-white border-t border-[#F5F5F7]">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Triage evidence markers..."
            className="rounded-2xl h-14 pl-6 pr-14 border-[#D2D2D7] bg-[#FBFBFD] focus-visible:ring-purple-500 placeholder:text-[#86868B]"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20"
            disabled={isLoading || !input.trim()}
          >
            <Send size={20} />
          </Button>
        </form>
        <p className="text-[10px] text-center text-[#86868B] mt-4 font-bold uppercase tracking-widest">
          Correlating {items.length} evidence markers in real-time
        </p>
      </div>
    </div>
  );
}
