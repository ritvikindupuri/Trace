import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, User, BrainCircuit, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { chatAboutSurfaceItem } from '../../lib/gemini';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

interface SurfaceItemChatProps {
  item: {
    name: string;
    category: string;
    description: string;
  };
}

export default function SurfaceItemChat({ item }: SurfaceItemChatProps) {
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
      const response = await chatAboutSurfaceItem(
        item.name,
        item.category,
        item.description,
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
    <div className="flex flex-col h-[500px] border border-[#D2D2D7] rounded-[2rem] bg-[#FBFBFD] overflow-hidden shadow-inner">
      <div className="p-4 border-b border-[#D2D2D7] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-purple-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#86868B]">Intelligence Chat</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-50 border border-purple-100">
          <Sparkles size={12} className="text-purple-500" />
          <span className="text-[10px] font-bold text-purple-600 uppercase">Gemini 2.0 Flash</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
              <BrainCircuit size={48} className="mb-4" />
              <p className="text-sm font-medium">Ask me anything about the tradecraft or hardening of this component.</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-100 text-purple-600'}`}>
                {msg.role === 'user' ? <User size={16} /> : <BrainCircuit size={16} />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#0071E3] text-white rounded-tr-none' 
                  : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-tl-none shadow-sm'
              }`}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.parts}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <BrainCircuit size={16} className="text-purple-600 animate-pulse" />
              </div>
              <div className="bg-white border border-[#D2D2D7] p-4 rounded-2xl rounded-tl-none shadow-sm">
                <Loader2 size={16} className="animate-spin text-purple-500" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-[#D2D2D7]">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Discuss technical details..."
            className="rounded-full border-[#D2D2D7] bg-[#F5F5F7] focus-visible:ring-purple-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full bg-purple-500 hover:bg-purple-600 shrink-0"
            disabled={isLoading || !input.trim()}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
