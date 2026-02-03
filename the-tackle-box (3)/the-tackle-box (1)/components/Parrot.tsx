
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { Check, X } from 'lucide-react';

const POSITIVE_QUOTES = [
  "Steady winds, Captain!",
  "Smooth sailing.",
  "Making great time.",
  "The horizon is clear.",
  "Efficiency is optimal."
];

const DRAG_QUOTES = [
  "We're catching drag!",
  "Something's pulling.",
  "Hull speed dropping.",
  "Resistance detected.",
  "Check your lines."
];

const HQ_QUOTES = [
  "Cupertino is calling!",
  "Midway point reached.",
  "Land Ho!",
  "Logbook looks good.",
  "HQ will be pleased."
];

const NEUTRAL_QUOTES = [
  "System Nominal.",
  "Monitoring vitals.",
  "Data stream active.",
  "Hold steady.",
  "Keep your heading."
];

const STORM_QUOTES = [
  "Barometer dropping!",
  "Storm front approaching!",
  "Rough seas ahead.",
  "Heavy weather detected.",
  "Hold the wheel."
];

export const Parrot: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const taskCount = useLiveQuery(() => db.tasks.where('isCompleted').equals(0).count());
  const completedTaskCount = useLiveQuery(() => db.tasks.where('isCompleted').equals(1).count());
  
  // Voyage Monitoring
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());
  const shiftDuration = useAppStore(state => state.shiftDuration);
  const isDragDetected = useAppStore(state => state.isDragDetected);
  const weatherCondition = useAppStore(state => state.weatherCondition);
  const isShoreLeave = useAppStore(state => state.isShoreLeave);
  const isConfirmingBreak = useAppStore(state => state.isConfirmingBreak);
  const setConfirmingBreak = useAppStore(state => state.setConfirmingBreak);
  const setShoreLeave = useAppStore(state => state.setShoreLeave);
  const setCaptainStatus = useAppStore(state => state.setCaptainStatus);

  // P.A.T.C.O. Settings & Alerts
  const patcoAudioEnabled = useAppStore(state => state.patcoAudioEnabled);
  const patcoVisualsEnabled = useAppStore(state => state.patcoVisualsEnabled);
  const patcoVolume = useAppStore(state => state.patcoVolume);
  const patcoAlert = useAppStore(state => state.patcoAlert);
  const setPatcoAlert = useAppStore(state => state.setPatcoAlert);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio Logic
  const playSquawk = () => {
      if (!patcoAudioEnabled) return;
      try {
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          if (!AudioContextClass) return;
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.15);
          
          const vol = (patcoVolume / 100) * 0.1;
          gain.gain.setValueAtTime(vol, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
      } catch (e) {}
  };

  const showMessage = (msg: string) => {
      setMessage(msg);
      playSquawk(); 
  };

  // Interaction Logic
  const confirmBreak = () => {
      setShoreLeave(true);
      setCaptainStatus('SHORE_LEAVE');
      setConfirmingBreak(false);
      setMessage(null);
  };

  const denyBreak = () => {
      setConfirmingBreak(false);
      showMessage("Very well. Resume watch.");
      setTimeout(() => setMessage(null), 3000);
  };

  // Reactive State Logic
  const isWorking = !!activeSession;
  const isSleeping = isShoreLeave;

  // Immediate Alert System
  useEffect(() => {
      if (patcoAlert) {
          showMessage(patcoAlert);
          const timer = setTimeout(() => {
              setPatcoAlert(null);
              setMessage(null);
          }, 8000);
          return () => clearTimeout(timer);
      }
  }, [patcoAlert, setPatcoAlert]);

  // Commentary Loop
  const triggerCommentary = () => {
      if (patcoAlert || isConfirmingBreak || isSleeping) return;

      let quotePool = NEUTRAL_QUOTES;

      if (weatherCondition === 'STORM' || weatherCondition === 'RAIN') {
          quotePool = STORM_QUOTES;
      } else if (isDragDetected) {
          quotePool = DRAG_QUOTES;
      } else {
          const total = (taskCount || 0) + (completedTaskCount || 0);
          const efficiency = total > 0 ? ((completedTaskCount || 0) / total) * 100 : 0;
          
          if (efficiency > 90) {
              quotePool = POSITIVE_QUOTES;
          } else {
              if (activeSession) {
                  const now = Date.now();
                  const elapsedMs = now - activeSession.startTime;
                  const totalMs = shiftDuration * 60 * 60 * 1000;
                  const progress = (elapsedMs / totalMs) * 100;
                  
                  if (progress > 50 && progress < 90) {
                      quotePool = HQ_QUOTES;
                  }
              }
          }
      }

      const randomQuote = quotePool[Math.floor(Math.random() * quotePool.length)];
      showMessage(randomQuote);
      setTimeout(() => setMessage(null), 10000);
  };

  useEffect(() => {
    const minTime = 15 * 60 * 1000;
    const maxTime = 30 * 60 * 1000;
    
    const scheduleNext = () => {
        const delay = Math.floor(Math.random() * (maxTime - minTime + 1) + minTime);
        timeoutRef.current = setTimeout(() => {
            triggerCommentary();
            scheduleNext();
        }, delay);
    };
    
    timeoutRef.current = setTimeout(() => {
        scheduleNext();
    }, 10000); 

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isDragDetected, taskCount, completedTaskCount, activeSession, shiftDuration, patcoAlert, weatherCondition, isConfirmingBreak, isSleeping]);

  const handlePoke = () => {
    if (isSleeping) {
        showMessage("Zzz...");
        setTimeout(() => setMessage(null), 2000);
        return;
    }
    const status = `System Nominal. ${taskCount || 0} active signals.`;
    showMessage(status);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
      
      {/* Smart Chat Bubble - Constrained to Sidebar Safe Zone (Growing Up) */}
      <AnimatePresence>
        {(message || isConfirmingBreak) && patcoVisualsEnabled && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-full left-0 mb-4 ml-[-8px] w-[240px] bg-[#fdfbf7] border border-slate-300 rounded-xl rounded-bl-none p-4 shadow-xl z-50 origin-bottom-left"
          >
            {isConfirmingBreak ? (
                <div className="space-y-3">
                    <p className="text-xs font-serif font-bold text-slate-800">Shall we start break time, Captain?</p>
                    <div className="flex gap-2">
                        <button onClick={confirmBreak} className="flex-1 bg-slate-800 text-white py-1.5 rounded text-xs font-bold hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors">
                            <Check className="w-3 h-3" /> Aye
                        </button>
                        <button onClick={denyBreak} className="flex-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1 transition-colors">
                            <X className="w-3 h-3" /> Nay
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-xs font-serif text-slate-700 leading-snug">
                    {message}
                </p>
            )}
            {/* Pointer */}
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-[#fdfbf7] border-b border-l border-slate-300 transform -rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Mascot Icon */}
      <div 
        onClick={handlePoke}
        className="group cursor-pointer relative w-full h-full"
        title={isSleeping ? "Mascot is Resting" : "P.A.T.C.O. Unit"}
      >
        {/* Safe Zone Frame (Transparent Circle) */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-300/30 bg-slate-50/10 backdrop-blur-[1px] group-hover:bg-slate-50/50 transition-colors"></div>
        
        {/* Minimalist Penguin SVG (Draft B) with State Variants */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full p-2 drop-shadow-sm transition-transform group-hover:-translate-y-1 group-active:scale-95"
        >
           {/* Body (Oval Shape) */}
           <path d="M50 15 C 30 15 15 35 15 65 C 15 85 30 95 50 95 C 70 95 85 85 85 65 C 85 35 70 15 50 15 Z" fill="white" stroke="#334155" strokeWidth="3" />
           
           {/* Wings */}
           <path d="M15 50 Q 5 65 15 75" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />
           <path d="M85 50 Q 95 65 85 75" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />

           {/* Face Logic */}
           {isSleeping ? (
               <>
                   {/* Sleeping Eyes (Closed Lines) */}
                   <path d="M35 42 Q 40 45 45 42" stroke="#334155" strokeWidth="2" fill="none" />
                   <path d="M55 42 Q 60 45 65 42" stroke="#334155" strokeWidth="2" fill="none" />
                   {/* Zzz Particles */}
                   <path d="M70 20 L 80 20 L 70 30 L 80 30" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.6" transform="scale(0.5) translate(80, -20)" />
               </>
           ) : (
               <>
                   {/* Awake Eyes */}
                   <circle cx="38" cy="40" r="4" fill="#334155" />
                   <circle cx="62" cy="40" r="4" fill="#334155" />
                   
                   {/* Beak */}
                   <path d="M45 48 Q 50 55 55 48" stroke="#fb923c" strokeWidth="3" fill="none" strokeLinecap="round" />
                   
                   {/* Bow Tie */}
                   <path d="M40 65 L 50 70 L 60 65 L 50 60 Z" fill="#334155" />
               </>
           )}
           
           {/* Watch Mode: Sailor Cap */}
           {isWorking && !isSleeping && (
               <g transform="translate(0, -5)">
                   <path d="M35 15 Q 50 5 65 15" stroke="#334155" strokeWidth="2" fill="white" />
                   <path d="M30 15 L 70 15 L 65 5 L 35 5 Z" fill="#334155" stroke="#334155" strokeWidth="2" />
               </g>
           )}

           {/* Feet */}
           <path d="M30 95 L 25 100" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
           <path d="M70 95 L 75 100" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
