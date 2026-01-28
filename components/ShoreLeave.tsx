
import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Lock, Activity, Anchor, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db';
import { Chronometer } from './Chronometer';

export const ShoreLeave: React.FC = () => {
  const isShoreLeave = useAppStore(state => state.isShoreLeave);
  const setShoreLeave = useAppStore(state => state.setShoreLeave);
  const captainStatus = useAppStore(state => state.captainStatus);
  const setCaptainStatus = useAppStore(state => state.setCaptainStatus);
  const awayStartTime = useAppStore(state => state.awayStartTime);
  const shoreLeaveDuration = useAppStore(state => state.shoreLeaveDuration);
  const currentFPS = useAppStore(state => state.currentFPS);
  
  const [timeLeft, setTimeLeft] = useState(shoreLeaveDuration * 60);
  
  // Resume Watch Hold Logic
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);
  const HOLD_DURATION = 3000;

  // Immersive Mode: Fullscreen & Context Menu Block
  useEffect(() => {
      if (isShoreLeave) {
          // Request Fullscreen
          document.documentElement.requestFullscreen().catch(err => {
              console.warn("Fullscreen denied:", err);
          });

          // Block Right Click
          const blockContext = (e: Event) => e.preventDefault();
          document.addEventListener('contextmenu', blockContext);
          
          return () => {
              document.removeEventListener('contextmenu', blockContext);
              if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
              }
          };
      }
  }, [isShoreLeave]);

  useEffect(() => {
      let interval: number;
      if (isShoreLeave && awayStartTime) {
          const breakDuration = captainStatus === 'GALLEY' ? 60 * 60 * 1000 : shoreLeaveDuration * 60 * 1000;
          
          // Timer Tick
          const updateTimer = () => {
              const now = Date.now();
              const remaining = Math.max(0, Math.floor(((awayStartTime + breakDuration) - now) / 1000));
              setTimeLeft(remaining);
          };
          
          updateTimer(); // Initial call
          interval = window.setInterval(updateTimer, 1000);
      } else {
          setTimeLeft(shoreLeaveDuration * 60);
      }
      return () => clearInterval(interval);
  }, [isShoreLeave, awayStartTime, captainStatus, shoreLeaveDuration]);

  const handleResume = async () => {
      // Haptic confirmation
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      // Exit Fullscreen
      if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch(e) { console.error(e); }
      }

      // Log the break duration
      if (awayStartTime) {
          const duration = Math.floor((Date.now() - awayStartTime) / 1000);
          const type = captainStatus === 'GALLEY' ? 'LUNCH_BREAK' : 'SHORE_LEAVE';
          await db.auditLogs.add({
              type: 'SAFETY_CHECK',
              timestamp: Date.now(),
              details: `Captain returned from ${type}. Absent: ${Math.floor(duration/60)}m ${duration%60}s`
          });
      }

      setCaptainStatus('AT_OARS');
      setShoreLeave(false);
  };

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
      if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return;
      
      setIsHolding(true);
      const start = Date.now();
      
      // Initial subtle vibration
      if (navigator.vibrate) navigator.vibrate(20);

      holdIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - start;
          const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
          setHoldProgress(progress);
          
          // Ramp up haptics near the end
          if (progress > 80 && Math.random() > 0.7) {
             if (navigator.vibrate) navigator.vibrate(10);
          }

          if (progress >= 100) {
              if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
              handleResume();
          }
      }, 16);
  };

  const endHold = () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
  };

  const formatTimer = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      
      if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isShoreLeave) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#f4ecd8] flex flex-col items-center justify-center cursor-default select-none overflow-hidden"
      >
         {/* Texture Overlay - Full Parchment */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none"></div>
         {/* Vignette */}
         <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(87,83,78,0.3)] pointer-events-none"></div>

         <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col items-center text-center max-w-md w-full p-8"
         >
            {/* Header Stamp */}
            <div className="mb-8 border-b-2 border-[#b5a642]/40 pb-6 w-full">
                <h2 className="text-xl font-black text-[#78350f] tracking-[0.3em] uppercase font-serif flex items-center justify-center gap-3 opacity-80">
                    <Coffee className="w-6 h-6" /> 
                    {captainStatus === 'GALLEY' ? 'The Galley' : 'Shore Leave'}
                </h2>
                <p className="text-xs text-[#8b7d3b] font-mono mt-2 tracking-widest font-bold">
                    SYSTEMS IDLE • CREW RESTING
                </p>
            </div>

            {/* The Ship's Chronometer (Large) */}
            <Chronometer variant="shore" />

            {/* Recessed Timer (Duration) */}
            <div className="mb-8 relative">
                <div className="text-[10px] font-bold text-[#5c4d08]/60 uppercase tracking-widest mb-1">Time Remaining</div>
                <div className="text-7xl font-serif font-bold text-[#5c4d08]/90 tracking-tighter tabular-nums" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.7), inset 1px 1px 2px rgba(0,0,0,0.1)' }}>
                    {formatTimer(timeLeft)}
                </div>
            </div>

            {/* Ink Heartbeat */}
            <div className="w-64 h-16 relative flex items-center justify-center mb-12 opacity-80">
                <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    {/* Hand-drawn baseline */}
                    <path d="M0,30 Q 50,28 100,30 T 200,30" fill="none" stroke="#9f1239" strokeWidth="1" strokeOpacity="0.2" />
                    
                    {/* Live Ink EKG */}
                    <motion.path 
                        d="M0,30 L60,30 L70,10 L80,50 L90,30 L200,30" 
                        fill="none" 
                        stroke="#9f1239" 
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                            pathLength: [0, 1, 1], 
                            opacity: [0, 1, 0],
                            pathOffset: [0, 0, 1]
                        }}
                        transition={{ 
                            duration: currentFPS >= 60 ? 1.5 : 0.8,
                            repeat: Infinity, 
                            ease: "linear",
                            times: [0, 0.8, 1]
                        }}
                    />
                </svg>
                <div className="absolute -right-4 bottom-0 text-[9px] font-mono text-[#9f1239] font-bold">
                    {currentFPS} BPM
                </div>
            </div>

            {/* The Brass Seal Button */}
            <div className="relative group">
                <div className="absolute -top-10 left-0 right-0 text-center transition-opacity duration-300">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] font-serif ${isHolding ? 'text-[#78350f]' : 'text-[#a8a29e]'}`}>
                        {isHolding ? "Engaging Mechanism..." : "Hold Seal to Return"}
                    </span>
                </div>

                <button 
                    onMouseDown={startHold}
                    onMouseUp={endHold}
                    onMouseLeave={endHold}
                    onTouchStart={startHold}
                    onTouchEnd={endHold}
                    className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.15),0_4px_6px_rgba(0,0,0,0.1)] active:scale-95 active:shadow-inner transition-transform duration-100"
                    style={{
                        background: 'linear-gradient(135deg, #d4c55e 0%, #b5a642 50%, #854d0e 100%)',
                    }}
                >
                    {/* Inner pressed groove */}
                    <div className="absolute inset-2 rounded-full border-2 border-[#713f12]/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]"></div>
                    
                    {/* Ink Fill Progress (SVG Ring) */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                        {/* Track */}
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#713f12" strokeWidth="1" opacity="0.1" />
                        {/* Ink */}
                        <circle 
                            cx="50" cy="50" r="46" 
                            fill="none" 
                            stroke="#451a03" 
                            strokeWidth="8"
                            strokeDasharray="289"
                            strokeDashoffset={289 - (289 * holdProgress / 100)}
                            strokeLinecap="butt"
                            className="transition-all duration-75 ease-linear"
                            style={{ mixBlendMode: 'multiply' }}
                        />
                    </svg>

                    {/* Button Face */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <Anchor className={`w-8 h-8 text-[#451a03] mb-1 ${isHolding ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-black text-[#451a03] uppercase tracking-widest font-serif leading-none">
                            RETURN
                        </span>
                    </div>
                </button>
            </div>

         </motion.div>
         
         {/* Footer Disclaimer */}
         <div className="absolute bottom-6 text-[10px] text-[#a8a29e] font-serif italic opacity-60">
             Vessel in Low Power Mode. Unauthorized access prohibited.
         </div>

      </motion.div>
    </AnimatePresence>
  );
};
