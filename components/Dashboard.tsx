
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Activity, Clock, CheckCircle, Sunrise, Sun, Moon, Anchor, Fish, Wind, Pin, Coffee, Palmtree, Ship } from 'lucide-react';
import { TidePhase, TaskPriority, EnergyLevel, EffortLevel, CrewStatus } from '../types';
import { Compass } from './Compass';
import { OxygenLevels } from './OxygenLevels';
import { PressureGauge } from './PressureGauge';
import { ManifestCheck } from './ManifestCheck';
import { WeatherGlass } from './WeatherGlass';
import { ResourceDock } from './ResourceDock';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

export const Dashboard: React.FC = () => {
  const taskCount = useLiveQuery(() => db.tasks.count());
  const noteCount = useLiveQuery(() => db.notes.count());
  const tasks = useLiveQuery(() => db.tasks.where('isCompleted').equals(0).toArray());
  const completedTasksCount = useLiveQuery(() => db.tasks.where('isCompleted').equals(1).count());
  
  const [phase, setPhase] = useState<TidePhase>(TidePhase.DEEP_WATER);
  
  // Use global energy level from Right Rail control
  const energy = useAppStore(state => state.energyLevel);
  
  const morningBrief = useAppStore(state => state.morningBrief);
  const setMorningBrief = useAppStore(state => state.setMorningBrief);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setPhase(TidePhase.SUNRISE);
    else if (hour >= 11 && hour < 18) setPhase(TidePhase.DEEP_WATER);
    else setPhase(TidePhase.SHORE);
  }, []);

  const getPhaseMeta = () => {
    switch(phase) {
      case TidePhase.SUNRISE:
        return {
          title: "Morning Tide",
          subtitle: "Chart the course. Prioritize the urgent.",
          icon: Sunrise,
          color: "text-orange-500",
          bg: "bg-orange-50 border-orange-200"
        };
      case TidePhase.DEEP_WATER:
        return {
          title: "Deep Water",
          subtitle: "Execution mode. Silence the noise.",
          icon: Sun,
          color: "text-blue-500",
          bg: "bg-blue-50 border-blue-200"
        };
      case TidePhase.SHORE:
        return {
          title: "The Shore",
          subtitle: "Reflect and prepare for tomorrow.",
          icon: Moon,
          color: "text-indigo-500",
          bg: "bg-indigo-50 border-indigo-200"
        };
    }
  };

  const meta = getPhaseMeta();
  const PhaseIcon = meta.icon;

  const filteredTasks = tasks?.filter(t => {
    if (energy === EnergyLevel.LOW) {
      return t.effort === EffortLevel.LOW;
    }
    return true; 
  }) || [];

  const sortedTasks = filteredTasks.sort((a, b) => {
    if (a.priority === TaskPriority.URGENT && b.priority !== TaskPriority.URGENT) return -1;
    if (a.priority !== TaskPriority.URGENT && b.priority === TaskPriority.URGENT) return 1;
    
    if (energy === EnergyLevel.HIGH) {
       const effortScore = { [EffortLevel.HIGH]: 3, [EffortLevel.MEDIUM]: 2, [EffortLevel.LOW]: 1 };
       return effortScore[b.effort] - effortScore[a.effort];
    }
    return 0; 
  });

  const topPriorityTask = sortedTasks[0];
  const recommendedTasks = sortedTasks.slice(0, 5);

  return (
    <div className="relative w-full h-full overflow-y-auto pb-12 custom-scrollbar">
      
      {/* "The Schooling" - Background Data Viz - Subtle Grey */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-5">
        {Array.from({ length: Math.min(completedTasksCount || 0, 20) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: -100, y: Math.random() * 500 }}
            animate={{ x: '120%' }}
            transition={{ 
              duration: 15 + Math.random() * 10, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 10 
            }}
            className="absolute"
          >
            <Fish className="w-6 h-6 text-slate-900" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 pt-6 px-6">
        
        {/* Morning Brief (Pinned Note) */}
        <div className="mb-8 relative max-w-xl">
            {/* Paper Shadow */}
            <div className="absolute inset-0 bg-white transform -rotate-1 shadow-md border border-stone-300 rounded-sm z-0"></div>
            
            {/* Main Note */}
            <div className="relative z-10 bg-[#fdfbf7] p-4 border border-stone-300 rounded-sm shadow-sm flex items-start gap-4">
                <div className="w-1 h-12 bg-blue-300 rounded-full mt-1"></div>
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-sans">Morning Brief (Focus)</label>
                    <input 
                        className="w-full bg-transparent font-serif text-xl text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0 italic"
                        placeholder="Set the Signal of the Day (e.g. Focus on Client Assets)"
                        value={morningBrief}
                        onChange={(e) => setMorningBrief(e.target.value)}
                    />
                </div>
            </div>
            
            {/* Pin graphic */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-stone-300 shadow-sm border border-stone-400 z-20 flex items-center justify-center">
                <div className="w-1 h-1 bg-stone-100 rounded-full opacity-50"></div>
            </div>
        </div>

        <header 
          className={`mb-8 p-6 rounded-xl border-2 shadow-sm ${meta.bg} bg-[#fdfbf7]/80 backdrop-blur-sm`}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className={`p-2 bg-white rounded-lg shadow-sm border border-stone-200 ${meta.color}`}>
              <PhaseIcon className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 font-serif">{meta.title}</h2>
          </div>
          <p className="text-slate-500 ml-14 font-serif italic">{meta.subtitle}</p>
        </header>

        {/* The Manifest Check (Crew Roster) */}
        <ManifestCheck />

        <OxygenLevels />

        {/* 2x2 or 4-col Grid for primary instruments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* 1. The Compass */}
          <div className="h-48">
            <Compass topTask={topPriorityTask} pendingCount={tasks?.length || 0} />
          </div>

          {/* 2. The Weather Glass */}
          <div className="h-48">
            <WeatherGlass />
          </div>

          {/* 3. The Resource Dock (New) */}
          <div className="h-48">
            <ResourceDock />
          </div>

          {/* 4. The Pressure Gauge */}
          <div className="h-48">
            <PressureGauge />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#fdfbf7] border-2 border-stone-200 shadow-sm rounded-xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Haul</span>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-3xl font-bold text-slate-800 font-serif relative z-10">{taskCount ?? 0}</span>
          </div>
          
          <div className="bg-[#fdfbf7] border-2 border-stone-200 shadow-sm rounded-xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Vault Items</span>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-3xl font-bold text-slate-800 font-serif relative z-10">{noteCount ?? 0}</span>
          </div>

          <div className="bg-[#fdfbf7] border-2 border-stone-200 shadow-sm rounded-xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Efficiency</span>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-3xl font-bold text-slate-800 font-serif relative z-10">98%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
