
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

  // Only show if there is water
  if (localBilgeLevel < 5) return null;

  // Visual clamp
  const displayHeight = Math.min(localBilgeLevel, 40); // Max 40% screen height to prevent total obscuration

  return (
    <>
      {/* The Water Overlay - Purely Visual, No Interaction */}
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
    </>
  );
};
