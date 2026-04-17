import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { BrainCircuit, Send, User, Bot, Loader2, Sparkles, X, MessageSquare } from 'lucide-react';
import { chatAboutVisibilityMatrix } from '../../lib/gemini';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

interface VisibilityChatbotProps {
  scores: any;
  onClose?: () => void;
}

export default function VisibilityChatbot({ scores, onClose }: VisibilityChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: "Hello! I'm your macOS Telemetry Visibility Expert. I can explain the visibility scores for each attack vector, how they were calculated, and what they mean for your security posture based on recent simulations. What would you like to know?"
    }
  ]);
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
      const history = messages.map(m => ({ role: m.role, parts: m.parts }));
      const response = await chatAboutVisibilityMatrix(scores, userMessage, history);
      setMessages(prev => [...prev, { role: 'model', parts: response || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', parts: "An error occurred while processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] border-[#D2D2D7] shadow-2xl rounded-[2rem] overflow-hidden bg-white animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-[#F5F5F7] border-b border-[#D2D2D7] py-4 px-6 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-[#1D1D1F]">Visibility Intelligence Agent</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Gemini 3.0 Flash</span>
            </div>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/50">
            <X size={18} className="text-[#86868B]" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-[#FBFBFD]">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === 'user' ? 'bg-[#1D1D1F] text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-[#1D1D1F] text-white rounded-tr-none' 
                      : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-[#1D1D1F] prose-headings:font-bold prose-strong:text-inherit">
                      <ReactMarkdown>{m.parts}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={14} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#D2D2D7] text-[#86868B] rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs font-medium italic">Analyzing visibility telemetry...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t border-[#D2D2D7] shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about visibility scores..."
              className="flex-1 rounded-xl border-[#D2D2D7] h-11 focus-visible:ring-blue-600"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 h-11 w-11 shrink-0 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              <Send size={18} />
            </Button>
          </form>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Sparkles size={10} className="text-blue-600" />
            <span className="text-[9px] font-bold text-[#86868B] uppercase tracking-widest">Powered by Gemini Intelligence Engine</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
