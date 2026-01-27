
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Timer, Anchor, Ship, MapPin, Moon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { useLiveQuery } from 'dexie-react-hooks';
import { DepartureManifest } from './DepartureManifest';

export const TimeLog: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  
  // Hold-to-Confirm State (Updated to 3 seconds)
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);
  const HOLD_DURATION = 3000; // 3 seconds to confirm drop
  
  const toggleSubmersion = useAppStore(state => state.toggleSubmersion);
  const shiftDuration = useAppStore(state => state.shiftDuration); // In Hours
  const hourlyRate = useAppStore(state => state.hourlyRate);
  const setSafeHarborOpen = useAppStore(state => state.setSafeHarborOpen);
  const setLastVoyageStats = useAppStore(state => state.setLastVoyageStats);
  const setDepartureManifestOpen = useAppStore(state => state.setDepartureManifestOpen);
  
  const setOvertime = useAppStore(state => state.setOvertime);
  const isOvertime = useAppStore(state => state.isOvertime);

  // Check for active session on load
  useEffect(() => {
    const checkActive = async () => {
      const active = await db.sessions.where('endTime').equals(0).first();
      if (active && active.id) {
        setActiveSessionId(active.id);
        setSessionStartTime(active.startTime);
        setElapsed(Math.floor((Date.now() - active.startTime) / 1000));
        toggleSubmersion(true);
      }
    };
    checkActive();
  }, [toggleSubmersion]);

  // Timer interval & Overtime Check
  useEffect(() => {
    let interval: number;
    if (activeSessionId) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const currentElapsed = Math.floor((now - sessionStartTime) / 1000);
        setElapsed(currentElapsed);
        
        // Check Overtime
        const shiftSeconds = shiftDuration * 60 * 60;
        if (currentElapsed > shiftSeconds) {
            if (!isOvertime) setOvertime(true);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSessionId, sessionStartTime, shiftDuration, isOvertime, setOvertime]);

  // This function ends the session and triggers Safe Harbor (Arrival Document)
  const performDropAnchor = async () => {
      if (!activeSessionId) return;

      const now = Date.now();
      const itemsCaught = Math.floor(Math.random() * 5); // Mock catch count - in real app query tasks completed
      const durationSeconds = (now - sessionStartTime) / 1000;
      const earnings = (durationSeconds / 3600) * hourlyRate;

      await db.sessions.update(activeSessionId, {
        endTime: now,
        itemsCaught: itemsCaught
      });

      // Trigger Arrival Document
      setLastVoyageStats({
          duration: durationSeconds,
          earnings: earnings,
          itemsCaught: itemsCaught
      });
      
      setSafeHarborOpen(true);
      setOvertime(false); 

      setActiveSessionId(null);
      setSessionStartTime(0);
      setElapsed(0);
      toggleSubmersion(false);
  }

  // Called after Early Exit Manifest is filed
  const onManifestComplete = () => {
      performDropAnchor();
  }

  const checkDepartureProtocol = () => {
    if (activeSessionId) {
        // Check if Early
        const shiftSeconds = shiftDuration * 60 * 60;
        if (elapsed < shiftSeconds) {
            // Trigger Early Exit Protocol
            setDepartureManifestOpen(true);
        } else {
            // Standard Procedure: Direct to Safe Harbor
            performDropAnchor();
        }
    }
  };

  const startSession = async () => {
      const now = Date.now();
      const id = await db.sessions.add({
        startTime: now,
        endTime: 0,
        focusArea: 'General',
        itemsCaught: 0
      });
      setActiveSessionId(id as number);
      setSessionStartTime(now);
      toggleSubmersion(true);
  }
  
  // Format MM:SS or Xh
  const formatTimerSimple = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      return h > 0 ? `${h}h` : `${Math.floor(totalSeconds / 60)}m`;
  }

  // Hold-to-Confirm Logic
  const handleMouseDown = () => {
      setIsHolding(true);
      setHoldProgress(0);
      
      let startTime = Date.now();
      holdIntervalRef.current = window.setInterval(() => {
          const delta = Date.now() - startTime;
          const progress = Math.min(100, (delta / HOLD_DURATION) * 100);
          setHoldProgress(progress);
          
          if (progress >= 100) {
              if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
              setIsHolding(false);
              setHoldProgress(0);
              
              if (activeSessionId) {
                  checkDepartureProtocol();
              } else {
                  startSession();
              }
          }
      }, 16); // ~60fps
  };

  const handleMouseUp = () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
  };

  return (
    <>
      <DepartureManifest onComplete={onManifestComplete} />
      
      {/* Fixed Vertical Anchor Control (Right Gutter) */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-[40] flex flex-col items-end pointer-events-auto">
        <motion.button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          whileTap={{ scale: 0.98 }}
          className={`
            relative flex flex-col items-center justify-center gap-2 py-6 px-1 rounded-l-xl border-y border-l transition-all duration-300 overflow-hidden group select-none shadow-lg
            ${activeSessionId 
              ? (isOvertime ? 'bg-orange-900 border-orange-800 text-orange-100 w-12' : 'bg-slate-800 border-slate-700 text-white w-12')
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 w-10 hover:w-12'
            }
          `}
          title={activeSessionId ? "Hold 3s to Drop Anchor" : "Hold 3s to Start Watch"}
        >
          {/* Progress Fill Overlay (Vertical) */}
          <div 
            className={`absolute bottom-0 left-0 right-0 z-0 origin-bottom transition-all ${activeSessionId ? 'bg-white/20' : 'bg-blue-500/20'}`}
            style={{ height: `${holdProgress}%` }}
          ></div>

          <div className={`relative z-10 flex flex-col items-center gap-4`}>
             {activeSessionId ? (
               <>
                 <div className={`transition-all ${isHolding ? 'scale-110' : ''}`}>
                    {isHolding ? (
                        <Lock className="w-5 h-5 text-red-400 animate-pulse" />
                    ) : (
                        <Anchor className={`w-5 h-5 ${isOvertime ? 'text-orange-300' : 'text-slate-300'}`} />
                    )}
                 </div>
                 
                 {/* Vertical Text */}
                 <span className="text-[10px] font-mono font-bold tracking-widest" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                     {isHolding ? "HOLD..." : (isOvertime ? "OVERTIME" : `${formatTimerSimple(elapsed)}`)}
                 </span>
               </>
             ) : (
               <>
                 <div className={`transition-all ${isHolding ? 'scale-110' : ''}`}>
                    <Ship className={`w-5 h-5 ${isHolding ? 'text-blue-500' : 'text-slate-400'} transition-colors`} />
                 </div>
                 {/* Permanent Start Text */}
                 <span className="text-[10px] font-bold tracking-widest text-slate-400" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                     {isHolding ? "HOLD..." : "START"}
                 </span>
               </>
             )}
          </div>
        </motion.button>
      </div>
    </>
  );
};
