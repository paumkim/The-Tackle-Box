
import React, { useEffect, useState } from 'react';
import { Compass as CompassIcon, Navigation } from 'lucide-react';
import { Task, CompassMode } from '../types';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';

interface CompassProps {
  topTask?: Task;
  pendingCount: number;
}

export const Compass: React.FC<CompassProps> = ({ topTask, pendingCount }) => {
  const compassMode = useAppStore(state => state.compassMode);
  const [rotation, setRotation] = useState(0);

  // Logic: Points to task based on urgency/priority
  useEffect(() => {
    if (!topTask) {
        // Idle Spin (Searching)
        const interval = setInterval(() => {
            setRotation(r => (r + 0.5) % 360);
        }, 50);
        return () => clearInterval(interval);
    } else {
        // True North Logic: Calculate a distinct "bearing" for the top task.
        // We simulate a bearing based on the task ID hash to give it a "real" direction on the map.
        const idHash = topTask.id ? (topTask.id * 137) % 360 : 0;
        
        let target = idHash;
        
        // Mode adjustments
        if (compassMode === 'URGENCY') {
            // Urgent tasks pull towards "Storm North" (roughly 340-20 degrees)
            if (topTask.priority === 'URGENT') target = (Math.random() * 40) - 20; 
        } else if (compassMode === 'IMPORTANCE') {
             if (topTask.effort === 'HIGH') target = 0; // Straight North for Big Game
        }

        setRotation(target);
    }
  }, [topTask, compassMode]);

  return (
    <div className="bg-white p-6 rounded-xl border border-[#E0E0E0] shadow-sm flex flex-col h-full relative overflow-hidden group">
      
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center font-mono">
            <CompassIcon className="w-3 h-3 mr-1" />
            True North
          </span>
          <h3 className="text-lg font-bold text-slate-800 leading-tight max-w-[200px] line-clamp-2">
            {topTask ? topTask.title : "Calm Waters"}
          </h3>
        </div>
        
        {/* The Digital Compass Ring - Inverted for Light Mode */}
        <div className="relative w-16 h-16">
           <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Outer Ring */}
              <circle cx="50" cy="50" r="45" stroke="#e2e8f0" strokeWidth="2" fill="none" />
              {/* Ticks */}
              {[...Array(12)].map((_, i) => (
                  <line 
                    key={i} 
                    x1="50" y1="5" x2="50" y2="10" 
                    stroke={i === 0 ? "#ef4444" : "#94a3b8"} 
                    strokeWidth={i === 0 ? 3 : 2} 
                    transform={`rotate(${i * 30} 50 50)`} 
                  />
              ))}
           </svg>
           
           {/* The Needle */}
           <motion.div 
             className="absolute inset-0 flex items-center justify-center text-slate-800"
             animate={{ rotate: rotation }}
             transition={{ type: "spring", stiffness: 40, damping: 12 }}
           >
              <Navigation className="w-8 h-8 fill-current text-blue-600 drop-shadow-md" />
           </motion.div>
        </div>
      </div>

      <div className="mt-auto pt-6 z-10">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>{pendingCount} OBJECTIVES</span>
          <span className={topTask?.priority === 'URGENT' ? 'text-red-500 font-bold animate-pulse' : 'text-blue-600 font-bold'}>
              {topTask ? `BEARING ${Math.abs(Math.round(rotation))}°` : 'DRIFTING'}
          </span>
        </div>
        
        {/* Current Strength Indicator */}
        <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          {topTask && (
              <motion.div 
                className={`h-full rounded-full ${topTask.effort === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'}`}
                initial={{ width: 0 }}
                animate={{ width: topTask.effort === 'HIGH' ? '80%' : (topTask.effort === 'MEDIUM' ? '50%' : '20%') }}
                transition={{ duration: 1 }}
              ></motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
