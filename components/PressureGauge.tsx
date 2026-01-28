
import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '../db';
import { TaskPriority, EffortLevel } from '../types';
import { useAppStore } from '../store';
import { Gauge, AlertTriangle, Droplets } from 'lucide-react';

export const PressureGauge: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.where('isCompleted').equals(0).toArray());
  const setPressureScore = useAppStore(state => state.setPressureScore);
  const bilgeLevel = useAppStore(state => state.bilgeLevel);

  const calculatePressure = () => {
    if (!tasks) return 0;
    
    let score = 0;
    tasks.forEach(task => {
      let taskScore = 0;
      // Effort Weight
      switch (task.effort) {
        case EffortLevel.LOW: taskScore += 5; break;
        case EffortLevel.MEDIUM: taskScore += 15; break;
        case EffortLevel.HIGH: taskScore += 30; break;
      }
      // Urgency Multiplier
      if (task.priority === TaskPriority.URGENT) {
        taskScore *= 1.5;
      }
      score += taskScore;
    });

    // Add Bilge Pressure (Entropy)
    score += bilgeLevel * 2; 

    // Normalize to 0-100 (Assuming 300 is "Max Safe Capacity")
    return Math.min(Math.round((score / 300) * 100), 100);
  };

  const pressure = calculatePressure();

  useEffect(() => {
    setPressureScore(pressure);
  }, [pressure, setPressureScore]);

  const getColor = (p: number) => {
    if (p < 50) return '#3b82f6'; // Blue
    if (p < 80) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="bg-[#fdfbf7] p-6 rounded-xl border-2 border-stone-200 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>

      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center">
            <Gauge className="w-3 h-3 mr-1" />
            Pressure Gauge
          </h3>
          <p className="text-xs text-slate-400">Cognitive Load</p>
        </div>
        {pressure > 80 && (
           <motion.div 
             animate={{ opacity: [0.5, 1, 0.5] }} 
             transition={{ repeat: Infinity, duration: 2 }}
             className="text-red-500"
           >
             <AlertTriangle className="w-5 h-5" />
           </motion.div>
        )}
      </div>

      <div className="flex items-end gap-2 mt-4 z-10">
        <span className="text-4xl font-bold text-slate-800 font-serif">{pressure}%</span>
        <span className="text-xs text-slate-500 mb-2">Capacity</span>
      </div>

      {/* Visual Gauge Bar */}
      <div className="w-full bg-stone-200 h-3 rounded-full mt-4 overflow-hidden z-10 border border-stone-300">
        <motion.div 
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pressure}%`, backgroundColor: getColor(pressure) }}
          transition={{ type: "spring", stiffness: 50 }}
        />
      </div>

      <div className="mt-2 flex justify-between items-center text-xs text-slate-400 z-10 font-mono">
        <span>
            {pressure < 50 ? "Stable Waters." : 
             pressure < 80 ? "Pressure Rising." : 
             "CRITICAL LOAD."}
        </span>
        {bilgeLevel > 20 && (
            <span className="flex items-center gap-1 text-blue-500">
                <Droplets className="w-3 h-3" />
                Taking on Water
            </span>
        )}
      </div>

      {/* Decorative Background */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 mix-blend-multiply" style={{ backgroundColor: getColor(pressure) }}></div>
    </div>
  );
};
