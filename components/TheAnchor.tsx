import React, { useState, useEffect } from 'react';
import { Anchor, Play, Pause, Square } from 'lucide-react';

interface TheAnchorProps {
  onToggleDeepWater: (isActive: boolean) => void;
}

export const TheAnchor: React.FC<TheAnchorProps> = ({ onToggleDeepWater }) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: number;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onToggleDeepWater(false);
      // Play sound effect here ideally
      setTimeLeft(25 * 60);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onToggleDeepWater]);

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      onToggleDeepWater(true);
    } else {
      setIsActive(false);
      onToggleDeepWater(false); // Pause lifts the mode? Or keeps it? Let's say pause keeps mode, stop lifts it. 
      // For simplicity in this UI, toggle pauses.
    }
  };

  const stopTimer = () => {
    setIsActive(false);
    onToggleDeepWater(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${isHovered || isActive ? 'translate-y-0' : '-translate-y-2'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        flex items-center gap-4 px-6 py-2 rounded-b-xl shadow-lg border-x border-b border-slate-200 backdrop-blur-md transition-colors
        ${isActive ? 'bg-slate-900/90 text-white' : 'bg-white/90 text-slate-800'}
      `}>
        <div className="flex items-center gap-2 font-mono text-xl font-bold min-w-[80px]">
          <Anchor className={`w-5 h-5 ${isActive ? 'animate-pulse text-blue-400' : 'text-slate-400'}`} />
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTimer}
            className={`p-1.5 rounded-full transition-colors ${isActive ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
            title={isActive ? "Pause Drift" : "Drop Anchor"}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          {isActive && (
            <button 
              onClick={stopTimer}
              className="p-1.5 rounded-full hover:bg-slate-700 text-red-400 transition-colors"
              title="Return to Shore"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};