
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { db } from '../db';
import { Phone, PhoneOff, Mic, MicOff, Clock, Save, X, Radio } from 'lucide-react';
import { Contact } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const TheBuoy: React.FC = () => {
  const activeCall = useAppStore(state => state.activeCall);
  const setActiveCall = useAppStore(state => state.setActiveCall);
  const quietMode = useAppStore(state => state.quietMode);
  const isSubmerged = useAppStore(state => state.isSubmerged);
  
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-collapse when diving/submerged
  useEffect(() => {
    if (isSubmerged) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isSubmerged]);

  useEffect(() => {
    let interval: number;
    if (activeCall) {
      interval = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
      setNotes('');
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const endCall = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeCall || !activeCall.id) return;

    // Save Log
    const newLog = {
      id: crypto.randomUUID(),
      type: 'call' as const,
      timestamp: Date.now(),
      duration: duration,
      notes: notes || 'No notes taken.'
    };

    // Update Contact History
    const contact = await db.contacts.get(activeCall.id);
    if (contact) {
      const updatedHistory = [...(contact.history || []), newLog];
      await db.contacts.update(contact.id, { history: updatedHistory });
    }
    
    if (notes.trim()) {
        await db.notes.add({
            title: `Call Log: ${activeCall.name}`,
            content: `**Duration:** ${formatTime(duration)}\n**Notes:**\n${notes}`,
            folder: 'Call Logs',
            updatedAt: Date.now(),
            depth: 'Surface',
            tags: ['call', 'reef']
        });
    }

    setActiveCall(null);
  };

  if (!activeCall) return null;

  // Radio Silence Mode (Collapsed)
  if (!isExpanded) {
    return (
      <motion.div 
        layoutId="buoy"
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-[100] cursor-pointer group"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="relative">
          {/* Bioluminescent Pulse */}
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          <div className="relative bg-slate-900 border border-blue-500/50 text-blue-200 p-3 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 hover:bg-slate-800 transition-colors">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono font-bold hidden group-hover:block transition-all">
              SIGNAL ACTIVE {formatTime(duration)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full Buoy Mode
  return (
    <motion.div 
      layoutId="buoy"
      className={`fixed bottom-6 right-6 w-80 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-[100] transition-all duration-500 ${quietMode ? 'opacity-80' : 'opacity-100'}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(false)}>
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
               <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
               <h3 className="font-bold text-sm">{activeCall.name}</h3>
               <div className="flex items-center text-xs text-blue-200">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(duration)}
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} 
              className={`p-2 rounded-full ${isMuted ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Quick Note Pad */}
      <div className="p-4 bg-slate-800">
         <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Quick Log</label>
         <textarea 
           value={notes}
           onChange={(e) => setNotes(e.target.value)}
           className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none placeholder:text-slate-600"
           placeholder="Type notes here... (autosaved)"
         />
      </div>

      {/* Actions */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
         <span className="text-xs text-slate-500 italic">Call in progress...</span>
         <button 
           onClick={endCall}
           className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
         >
           <PhoneOff className="w-4 h-4" /> End Call
         </button>
      </div>
    </motion.div>
  );
};
