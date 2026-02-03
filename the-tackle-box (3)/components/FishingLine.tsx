import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion, AnimatePresence } from 'framer-motion';

export const FishingLine: React.FC = () => {
  const activeTaskId = useAppStore(state => state.activeTaskId);
  const task = useLiveQuery(() => activeTaskId ? db.tasks.get(activeTaskId) : Promise.resolve(undefined), [activeTaskId]);
  const [isTyping, setIsTyping] = useState(false);

  // Vibrate on activity
  useEffect(() => {
    let timeout: number;
    const handleActivity = () => {
      setIsTyping(true);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => setIsTyping(false), 200);
    };

    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timeout);
    }
  }, []);

  if (!task || task.isCompleted) return null;

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full pointer-events-none z-0 overflow-hidden">
      {/* The Line */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: '60%' }} // Drop down to roughly center screen where work happens
        exit={{ height: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`w-px bg-cyan-400/50 shadow-[0_0_8px_cyan] mx-auto origin-top ${isTyping ? 'animate-jiggle' : ''}`}
      >
        {/* The Hook/Lure at the bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-gradient-to-b from-cyan-400 to-transparent opacity-80"></div>
      </motion.div>
    </div>
  );
};