
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Send, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HookDeck: React.FC = () => {
  const isChatOpen = useAppStore(state => state.isChatOpen);
  const hookedContactId = useAppStore(state => state.hookedContactId);
  const sidebarState = useAppStore(state => state.sidebarState);
  const setCrewTyping = useAppStore(state => state.setCrewTyping);
  
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{id: string, text: string, sender: 'me' | 'crew', time: number}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contact = useLiveQuery(() => hookedContactId ? db.contacts.get(hookedContactId) : Promise.resolve(undefined), [hookedContactId]);

  // Anchoring Calculation: Strictly flush to rail
  const getLeftOffset = () => {
      switch(sidebarState) {
          case 'full': return '260px'; 
          case 'mini': return '68px';
          case 'hidden': return '0px'; 
          default: return '260px';
      }
  };

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [chatHistory, isChatOpen]);

  // Simulate Crew Response
  useEffect(() => {
      let typingTimeout: number;
      if (isChatOpen && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === 'me') {
          // Simulate typing start
          typingTimeout = window.setTimeout(() => {
              setCrewTyping(true);
              
              // Simulate typing end & message
              setTimeout(() => {
                  setCrewTyping(false);
                  setChatHistory(prev => [...prev, {
                      id: Date.now().toString(),
                      text: "Aye Captain, received.",
                      sender: 'crew',
                      time: Date.now()
                  }]);
              }, 2000);
          }, 1000);
      }
      return () => clearTimeout(typingTimeout);
  }, [chatHistory, isChatOpen, setCrewTyping]);

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;
      
      setChatHistory(prev => [...prev, {
          id: Date.now().toString(),
          text: message,
          sender: 'me',
          time: Date.now()
      }]);
      setMessage('');
  };

  return (
    <AnimatePresence>
      {isChatOpen && hookedContactId && (
        <motion.div 
            style={{ left: getLeftOffset() }}
            className="fixed top-0 bottom-0 w-[240px] z-[997] bg-[#fdfbf7]/95 backdrop-blur-sm shadow-xl border-r border-y border-slate-200/50 rounded-r-xl overflow-hidden flex flex-col pointer-events-auto"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.3 }}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-200/50 bg-white/40 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Channel</span>
                </div>
                {contact && (
                    <div className="mt-1 font-serif font-bold text-slate-700 text-sm truncate">
                        {contact.name}
                    </div>
                )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={scrollRef}>
                {chatHistory.length === 0 && (
                    <div className="text-center text-slate-400 text-xs italic mt-10">
                        Channel open. Awaiting orders.
                    </div>
                )}
                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                        <div 
                            className={`
                                max-w-[85%] p-2 rounded-lg text-xs leading-relaxed font-sans
                                ${msg.sender === 'me' 
                                    ? 'bg-slate-800 text-white rounded-br-none' 
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                }
                            `}
                        >
                            {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-300 mt-1 uppercase font-mono">
                            {new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                ))}
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <form onSubmit={handleSend} className="relative">
                    <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message crew..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-colors font-serif"
                    />
                    <button 
                        type="submit"
                        disabled={!message.trim()}
                        className="absolute right-1 top-1 p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
