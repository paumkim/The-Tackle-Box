
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { Anchor, Bell } from 'lucide-react';

export const TheBallast: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 Minutes Default
  const [isHovered, setIsHovered] = useState(false);
  const soundEnabled = useAppStore(state => state.soundEnabled);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const FOCUS_DURATION = 25 * 60;

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playBell();
      setTimeLeft(FOCUS_DURATION); // Reset
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playBell = () => {
      if (!soundEnabled) return;
      // Simple synthetic bell if audio context available, or nothing
      try {
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          if (AudioContextClass) {
              const ctx = new AudioContextClass();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
              osc.start();
              osc.stop(ctx.currentTime + 1.5);
          }
      } catch (e) {}
  };

  const toggleBallast = () => {
      setIsActive(!isActive);
  };

  const percentage = (timeLeft / FOCUS_DURATION) * 100;

  return (
    <div 
        className="fixed right-4 top-1/3 transform -translate-y-1/2 z-40 flex flex-col items-center gap-2 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        {/* Tooltip */}
        <div className={`absolute right-full mr-2 bg-slate-800 text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
            {isActive ? `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s` : 'Drop Ballast (Focus)'}
        </div>

        <div className="relative w-2 h-32 bg-slate-200 rounded-full overflow-hidden border border-slate-300 shadow-inner">
            <motion.div 
                className={`absolute bottom-0 left-0 right-0 w-full ${isActive ? 'bg-slate-600' : 'bg-slate-400'}`}
                initial={{ height: '100%' }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5 }}
            ></motion.div>
        </div>

        <button 
            onClick={toggleBallast}
            className={`p-2 rounded-full border shadow-sm transition-all ${isActive ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'}`}
        >
            <Bell className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
        </button>
    </div>
  );
};
