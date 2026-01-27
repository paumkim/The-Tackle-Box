
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Droplets, AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

export const BilgeWater: React.FC = () => {
  // Logic: Water level rises with Overdue Tasks
  const overdueTasks = useLiveQuery(() => 
    db.tasks
      .where('isCompleted')
      .equals(0)
      .and(t => !!t.dueDate && t.dueDate < new Date().toISOString().split('T')[0])
      .toArray()
  );

  const setGlobalBilgeLevel = useAppStore(state => state.setBilgeLevel);
  const [localBilgeLevel, setLocalBilgeLevel] = useState(0);
  const [isPumping, setIsPumping] = useState(false);

  useEffect(() => {
    // Base level from overdue tasks (each adds 10% water)
    const taskWater = (overdueTasks?.length || 0) * 10;
    
    // Simulate slow leak over time (Entropy)
    const leakInterval = setInterval(() => {
        setLocalBilgeLevel(prev => Math.min(100, prev + 0.5));
    }, 5000);

    setLocalBilgeLevel(prev => Math.max(prev, taskWater));

    return () => clearInterval(leakInterval);
  }, [overdueTasks]);

  // Sync to global store for Parrot
  useEffect(() => {
      setGlobalBilgeLevel(localBilgeLevel);
  }, [localBilgeLevel, setGlobalBilgeLevel]);

  const handlePump = () => {
    setIsPumping(true);
    // Pumping reduces water
    setLocalBilgeLevel(prev => Math.max(0, prev - 20));
    setTimeout(() => setIsPumping(false), 800);
  };

  // Only show if there is water
  if (localBilgeLevel < 5) return null;

  // Visual clamp
  const displayHeight = Math.min(localBilgeLevel, 40); // Max 40% screen height to prevent total obscuration

  return (
    <>
      {/* The Water Overlay */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-[5] pointer-events-none flex items-end justify-center"
        initial={{ height: 0 }}
        animate={{ height: `${displayHeight}%` }}
        transition={{ type: 'spring', stiffness: 20, damping: 20 }}
      >
         {/* Ink Wash Texture */}
         <div className="w-full h-full bg-blue-900/10 backdrop-blur-[1px] relative overflow-hidden">
            {/* Top Wave Line (Hand-drawn style) */}
            <svg className="absolute top-0 left-0 w-full h-4 -mt-4 text-blue-900/20" preserveAspectRatio="none" viewBox="0 0 100 10">
               <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/watercolor.png')] opacity-50 mix-blend-multiply"></div>
         </div>
      </motion.div>

      {/* The Pump Station (Only appears when water is rising) */}
      <div className="fixed bottom-4 right-20 z-50">
         <motion.button
           onClick={handlePump}
           whileTap={{ scale: 0.9 }}
           animate={localBilgeLevel > 90 ? { scale: [1, 1.1, 1], boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)" } : {}}
           transition={localBilgeLevel > 90 ? { repeat: Infinity, duration: 1 } : {}}
           className={`group flex flex-col items-center gap-2 p-3 rounded-full shadow-lg border-2 transition-all ${
             localBilgeLevel > 50 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
           }`}
           title="Bilge Pump: Clear accumulated entropy"
         >
            <div className={`p-2 rounded-full ${isPumping ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-blue-600'}`}>
               <RefreshCcw className={`w-5 h-5 ${isPumping ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                 {localBilgeLevel > 50 ? 'Flood Warning' : 'Bilge Pump'}
               </span>
               <div className="w-12 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full ${localBilgeLevel > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                    style={{ width: `${Math.min(100, localBilgeLevel)}%` }}
                  ></div>
               </div>
            </div>
         </motion.button>
      </div>
    </>
  );
};
