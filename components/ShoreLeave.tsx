
import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Palmtree, Coffee, Play, Timer, Clock, Lock, Waves, Wind, CloudRain, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db';

export const ShoreLeave: React.FC = () => {
  const isShoreLeave = useAppStore(state => state.isShoreLeave);
  const setShoreLeave = useAppStore(state => state.setShoreLeave);
  const captainStatus = useAppStore(state => state.captainStatus);
  const setCaptainStatus = useAppStore(state => state.setCaptainStatus);
  const awayStartTime = useAppStore(state => state.awayStartTime);
  const shoreLeaveDuration = useAppStore(state => state.shoreLeaveDuration);
  const weatherCondition = useAppStore(state => state.weatherCondition);
  
  const [timeLeft, setTimeLeft] = useState(shoreLeaveDuration * 60);
  const [estimatedReturn, setEstimatedReturn] = useState<string | null>(null);

  // Resume Watch Hold Logic
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);
  const HOLD_DURATION = 3000;

  useEffect(() => {
      let interval: number;
      if (isShoreLeave && awayStartTime) {
          // Calculate Forecast once based on user setting
          const breakDuration = captainStatus === 'GALLEY' ? 60 * 60 * 1000 : shoreLeaveDuration * 60 * 1000;
          const returnDate = new Date(awayStartTime + breakDuration);
          setEstimatedReturn(returnDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

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
          setEstimatedReturn(null);
      }
      return () => clearInterval(interval);
  }, [isShoreLeave, awayStartTime, captainStatus, shoreLeaveDuration]);

  const handleResume = async () => {
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
      setIsHolding(true);
      const start = Date.now();
      
      holdIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - start;
          const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
          setHoldProgress(progress);
          
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

  const getSeaStateLabel = () => {
      switch(weatherCondition) {
          case 'STORM': return 'Heavy Swell';
          case 'RAIN': return 'Choppy';
          case 'FOG': return 'Low Visibility';
          default: return 'Glassy';
      }
  };

  if (!isShoreLeave) return null;

  const isGalley = captainStatus === 'GALLEY';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-[#fdfbf7] flex flex-col items-center justify-center text-center p-8"
      >
         {/* Live Atmospheric Background */}
         <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-80 mix-blend-multiply"></div>
             {/* Sea Mist Animation */}
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/20 via-transparent to-transparent animate-current opacity-50"></div>
         </div>
         
         <div className="relative z-10 max-w-xl w-full">
            {/* Status Icon */}
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center shadow-inner relative border-4 ${isGalley ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-blue-50 border-blue-100 text-emerald-600'}`}
            >
               {isGalley ? (
                   <>
                       <Coffee className="w-12 h-12" />
                       <motion.div 
                           className="absolute -top-4 right-6 w-2 h-2 bg-white/50 rounded-full blur-sm"
                           animate={{ y: -20, opacity: 0 }}
                           transition={{ duration: 2, repeat: Infinity }}
                       />
                   </>
               ) : (
                   <Palmtree className="w-12 h-12" />
               )}
            </motion.div>
            
            <h2 className="text-3xl font-serif font-bold text-slate-800 mb-6 tracking-tight">
                {isGalley ? 'The Galley' : 'Shore Leave'}
            </h2>
            
            {/* Live Status Board */}
            <div className="bg-white border-2 border-slate-800 rounded-xl p-6 shadow-[4px_4px_0px_rgba(30,41,59,0.2)] mb-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] pointer-events-none"></div>
                
                <div className="relative z-10 grid grid-cols-2 gap-8 text-left">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Time Remaining</span>
                        <div className="text-5xl font-mono font-bold text-slate-800 tracking-tighter">
                            {formatTimer(timeLeft)}
                        </div>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">EXPECTED BACK ON BRIDGE</span>
                            <div className="text-lg font-serif font-bold text-blue-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {estimatedReturn || '--:--'}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sea State</span>
                            <div className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                {weatherCondition === 'CLEAR' ? <Sun className="w-4 h-4 text-amber-500" /> : <Waves className="w-4 h-4 text-blue-500" />}
                                {getSeaStateLabel()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-slate-500 text-sm font-serif italic mb-10">
               "{isGalley ? 'Fuel the engine, Captain. The ship waits.' : 'The sea will be there when you return. Rest your eyes.'}"
            </p>

            {/* Triple-Phase Resume Button */}
            <button 
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              className="group relative flex items-center justify-center gap-3 bg-slate-800 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-xl mx-auto overflow-hidden select-none active:scale-95 active:bg-slate-900"
            >
               {/* Phase 2: The Charge (Filling Ring) */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   {isHolding && (
                       <svg className="w-full h-full absolute inset-0 transform -rotate-90 opacity-20">
                           <rect width="100%" height="100%" fill="#1e3a8a" style={{ width: `${holdProgress}%`, transition: 'width 0.1s linear' }} />
                       </svg>
                   )}
               </div>

               {/* Phase 3: The Ignition (Ripple) */}
               {holdProgress >= 100 && (
                   <motion.div 
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 2, opacity: 0 }}
                        className="absolute inset-0 bg-blue-400 rounded-full"
                   />
               )}

               <div className="relative z-10 flex items-center gap-3">
                   {isHolding ? <Lock className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current" />}
                   {isHolding ? "HOLD TO CONFIRM..." : "RESUME WATCH"}
               </div>
            </button>
            
            <div className="mt-8 opacity-40">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   Vessel Underway • Autopilot Active
               </span>
            </div>
         </div>
      </motion.div>
    </AnimatePresence>
  );
};
