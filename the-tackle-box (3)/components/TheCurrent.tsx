import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useAppStore } from '../store';
import { Waves } from 'lucide-react';
import { motion } from 'framer-motion';

// The Current: Predictive Workload Meter
export const TheCurrent = () => {
    const inboxCount = useLiveQuery(() => db.tasks.filter(t => t.projectId === undefined).count()) || 0;
    const completedToday = useLiveQuery(() => db.tasks.where('isCompleted').equals(1).count()) || 0;
    const setShoreLeave = useAppStore(state => state.setShoreLeave);

    const velocity = Math.min(2, Math.max(0, (inboxCount / (Math.max(1, completedToday) + 5))));
    const rotation = (velocity * 90) - 45;
    const isRough = velocity > 1.2;

    return (
        <button
            className={`hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border shadow-sm transition-all cursor-help ${isRough ? 'bg-amber-50 border-amber-200' : 'bg-[#fdfbf7] border-stone-300 hover:border-stone-400'}`}
            title={`Current Velocity: ${velocity.toFixed(2)}. ${isRough ? 'Rough Seas - Shore Leave Recommended' : 'Conditions Stable'}`}
            onClick={isRough ? () => setShoreLeave(true) : undefined}
            disabled={!isRough}
            aria-label={`Current Velocity: ${velocity.toFixed(2)}. ${isRough ? 'Rough Seas - Shore Leave Recommended' : 'Conditions Stable'}`}
        >
            <div className="relative w-5 h-2.5 overflow-hidden flex items-end justify-center shrink-0">
                <div className="absolute bottom-0 w-4 h-4 rounded-full border-2 border-stone-400 border-b-transparent border-r-transparent transform rotate-45"></div>
                <motion.div
                    className={`absolute bottom-0 w-0.5 h-2 origin-bottom rounded-full ${isRough ? 'bg-amber-600' : 'bg-slate-800'}`}
                    animate={{ rotate: rotation }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                />
            </div>
            <div className="flex items-baseline gap-2 leading-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline font-serif">Current</span>
                <span className={`text-xs font-bold font-mono ${isRough ? 'text-amber-700' : 'text-slate-600'}`}>
                    {isRough ? 'SURGE' : (velocity < 0.3 ? 'SLACK' : 'FLOW')}
                </span>
            </div>
            {isRough && <Waves className="w-3 h-3 text-amber-500 animate-pulse ml-1" />}
        </button>
    );
};
