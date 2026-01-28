
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ChronometerProps {
  className?: string;
  variant?: 'bridge' | 'shore';
}

export const Chronometer: React.FC<ChronometerProps> = ({ className = '', variant = 'bridge' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // High-precision sync loop
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Extract city name for "Location" stamp (e.g., "America/New_York" -> "NEW YORK")
  const locationStamp = (timeZone.split('/')[1] || 'LOCAL').replace(/_/g, ' ').toUpperCase();

  if (variant === 'shore') {
      return (
        <div className={`flex flex-col items-center mb-6 ${className}`}>
            <div className="text-[#8b7d3b] text-[10px] font-bold tracking-[0.2em] uppercase mb-2 font-mono flex items-center gap-2 opacity-70">
                <span className="w-2 h-2 rounded-full bg-[#b5a642]"></span>
                {locationStamp} TIME
                <span className="w-2 h-2 rounded-full bg-[#b5a642]"></span>
            </div>
            <div className="bg-[#f4ecd8] border-4 border-[#b5a642] px-8 py-3 rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.1),0_4px_10px_rgba(0,0,0,0.1)] flex items-center gap-4 relative overflow-hidden">
                {/* Glass Reflection */}
                <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
                
                <Clock className="w-6 h-6 text-[#78350f] opacity-80" />
                <span className="text-4xl font-serif font-black text-[#451a03] tabular-nums tracking-widest" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.5)' }}>
                    {formatTime(time)}
                </span>
            </div>
        </div>
      );
  }

  return (
    <div className={`flex flex-col justify-center bg-[#fdfbf7] border border-[#b5a642] px-3 py-1.5 rounded shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-0.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981] animate-pulse"></div>
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-serif leading-none">
                {locationStamp}
            </span>
        </div>
        <div className="text-sm font-serif font-bold text-slate-800 tabular-nums tracking-wide leading-none pl-3.5">
            {formatTime(time)}
        </div>
    </div>
  );
};
