
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Anchor, Ship, Lock } from 'lucide-react';
import { useAppStore } from '../store';
import { DepartureManifest } from './DepartureManifest';
import { ViewState } from '../types';

export const TimeLog: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);
  const HOLD_DURATION = 3000; 
  
  const shiftDuration = useAppStore(state => state.shiftDuration); 
  const hourlyRate = useAppStore(state => state.hourlyRate);
  const setSafeHarborOpen = useAppStore(state => state.setSafeHarborOpen);
  const setLastVoyageStats = useAppStore(state => state.setLastVoyageStats);
  const setDepartureManifestOpen = useAppStore(state => state.setDepartureManifestOpen);
  const requestNavigation = useAppStore(state => state.requestNavigation);
  
  const setOvertime = useAppStore(state => state.setOvertime);
  const isOvertime = useAppStore(state => state.isOvertime);

  useEffect(() => {
    const checkActive = async () => {
      const active = await db.sessions.where('endTime').equals(0).first();
      if (active && active.id) {
        setActiveSessionId(active.id);
        setSessionStartTime(active.startTime);
        setElapsed(Math.floor((Date.now() - active.startTime) / 1000));
      }
    };
    checkActive();
  }, []);

  useEffect(() => {
    let interval: number;
    if (activeSessionId) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const currentElapsed = Math.floor((now - sessionStartTime) / 1000);
        setElapsed(currentElapsed);
        
        const shiftSeconds = shiftDuration * 60 * 60;
        if (currentElapsed > shiftSeconds) {
            if (!isOvertime) setOvertime(true);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSessionId, sessionStartTime, shiftDuration, isOvertime, setOvertime]);

  const performDropAnchor = async () => {
      if (!activeSessionId) return;

      const now = Date.now();
      const itemsCaught = Math.floor(Math.random() * 5); 
      const durationSeconds = (now - sessionStartTime) / 1000;
      const earnings = (durationSeconds / 3600) * hourlyRate;

      await db.sessions.update(activeSessionId, {
        endTime: now,
        itemsCaught: itemsCaught
      });

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
  }

  const onManifestComplete = () => {
      performDropAnchor();
  }

  const checkDepartureProtocol = () => {
    if (activeSessionId) {
        const shiftSeconds = shiftDuration * 60 * 60;
        if (elapsed < shiftSeconds) {
            setDepartureManifestOpen(true);
        } else {
            performDropAnchor();
        }
    }
  };

  const startSession = async () => {
      const now = Date.now();
      
      // Check if this is the first session of the day
      const startOfDay = new Date(now);
      startOfDay.setHours(0,0,0,0);
      const todaySessions = await db.sessions.where('startTime').above(startOfDay.getTime()).count();
      
      const id = await db.sessions.add({
        startTime: now,
        endTime: 0,
        focusArea: 'General',
        itemsCaught: 0
      });
      setActiveSessionId(id as number);
      setSessionStartTime(now);

      // Automatic Morning Review if first session
      if (todaySessions === 0) {
          requestNavigation(ViewState.INBOX);
      }
  }
  
  const formatTimerSimple = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60); 
      if (h > 0) return `${h}h${Math.floor(m)}m`;
      return `${Math.floor(totalSeconds / 60)}m`;
  }

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
      }, 16);
  };

  const handleMouseUp = () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
  };

  return (
    <>
      <DepartureManifest onComplete={onManifestComplete} />
      
      <div className="flex flex-col items-center pointer-events-auto">
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`
            relative flex flex-col items-center justify-center py-6 px-1 rounded-full border transition-all duration-300 overflow-hidden group select-none shadow-sm
            ${activeSessionId 
              ? 'bg-amber-50 border-amber-300 text-slate-900 w-12' 
              : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400 w-12'
            }
          `}
          title={activeSessionId ? "Hold 3s to Drop Anchor" : "Hold 3s to Start Watch"}
        >
          {/* Progress Fill Overlay (Vertical) */}
          <div 
            className={`absolute bottom-0 left-0 right-0 z-0 origin-bottom transition-all ${activeSessionId ? 'bg-amber-200/50' : 'bg-blue-500/20'}`}
            style={{ height: `${holdProgress}%` }}
          ></div>

          <div className={`relative z-10 flex flex-col items-center ${activeSessionId ? 'gap-1' : 'gap-4'}`}>
             
             {/* 1. Status Dot (Top Stack - Active Only) */}
             {activeSessionId && (
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.6)] mb-1"></div>
             )}

             {/* 2. The Icon */}
             {activeSessionId ? (
               <div className={`transition-all ${isHolding ? 'scale-110' : ''}`}>
                  {isHolding ? (
                      <Lock className="w-5 h-5 text-red-400 animate-pulse" />
                  ) : (
                      <Anchor className="w-5 h-5 text-amber-600" />
                  )}
               </div>
             ) : (
               <div className={`transition-all ${isHolding ? 'scale-110' : ''}`}>
                  <Ship className={`w-5 h-5 ${isHolding ? 'text-blue-500' : 'text-slate-400'} transition-colors`} />
               </div>
             )}
             
             {/* 3. The Text */}
             <span 
                className={`text-[10px] font-mono font-bold tracking-widest ${activeSessionId ? 'text-slate-900' : 'text-slate-400 opacity-100'}`} 
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
             >
                 {activeSessionId 
                    ? (isHolding ? "HOLD" : (isOvertime ? "OT" : formatTimerSimple(elapsed)))
                    : (isHolding ? "HOLD" : "START")
                 }
             </span>
          </div>
        </button>
      </div>
    </>
  );
};
