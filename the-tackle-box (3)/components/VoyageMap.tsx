
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useAppStore } from '../store';
import { Palmtree, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

// --- VISUAL ASSETS (Embedded for Zero-Latency) ---

const ThreeMastedShip = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
    {/* Hull */}
    <path d="M10 75 Q 25 90 50 90 Q 85 90 95 70 L 90 60 H 15 L 10 75 Z" fill="currentColor" fillOpacity="0.05" />
    <path d="M15 60 L 90 60" strokeWidth="1" />
    <path d="M20 70 L 85 70" strokeOpacity="0.3" strokeWidth="0.5" />
    
    {/* Masts */}
    <line x1="30" y1="60" x2="30" y2="25" strokeWidth="2" />
    <line x1="55" y1="60" x2="55" y2="15" strokeWidth="2" />
    <line x1="80" y1="60" x2="80" y2="30" strokeWidth="2" />
    
    {/* Sails (Billowing forward) */}
    <path d="M30 30 Q 15 30 15 45 Q 30 45 30 45" fill="currentColor" fillOpacity="0.1" />
    <path d="M30 48 Q 15 48 15 58 Q 30 58 30 58" fill="currentColor" fillOpacity="0.1" />
    <path d="M55 20 Q 35 20 35 40 Q 55 40 55 40" fill="currentColor" fillOpacity="0.1" />
    <path d="M55 45 Q 35 45 35 58 Q 55 58 55 58" fill="currentColor" fillOpacity="0.1" />
    <path d="M80 35 Q 70 35 70 50 Q 80 50 80 50" fill="currentColor" fillOpacity="0.1" />
    
    {/* Bowsprit & Flag */}
    <line x1="90" y1="60" x2="100" y2="50" strokeWidth="1.5" />
    <path d="M55 15 L 65 12 L 55 18" fill="currentColor" />
  </svg>
);

const CompassRose = ({ className, rotation }: { className?: string, rotation: number }) => (
    <div className={`relative ${className}`}>
        <motion.div 
            className="w-full h-full text-slate-800"
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 20, damping: 15 }}
        >
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="50" cy="50" r="45" strokeWidth="2" stroke="#b5a642" />
                <circle cx="50" cy="50" r="42" strokeWidth="0.5" strokeDasharray="1 2" stroke="#b5a642" />
                <path d="M50 5 L 60 40 L 95 50 L 60 60 L 50 95 L 40 60 L 5 50 L 40 40 Z" fill="currentColor" fillOpacity="0.05" />
                <path d="M50 5 L 55 45 L 50 50 L 45 45 Z" fill="#ef4444" stroke="none" />
                <path d="M50 95 L 55 55 L 50 50 L 45 55 Z" fill="currentColor" stroke="none" opacity="0.8" />
                <text x="50" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" style={{ fontFamily: 'serif' }}>N</text>
            </svg>
        </motion.div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 bg-red-500"></div>
    </div>
);

const InkWave: React.FC<{ speed: number; delay: number; opacity: number; y: string }> = ({ speed, delay, opacity, y }) => {
  return (
    <motion.div
      className="absolute left-0 right-0 h-16 overflow-hidden pointer-events-none"
      style={{ top: y, opacity }}
    >
      <motion.div
        className="absolute top-0 left-0 w-[200%] h-full flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
          duration: speed, 
          ease: "linear", 
          repeat: Infinity, 
          delay: delay 
        }}
      >
        <svg className="w-1/2 h-full text-slate-800" viewBox="0 0 1000 50" preserveAspectRatio="none">
           <path d="M0 25 C 200 15, 300 35, 500 25 C 700 15, 800 35, 1000 25" fill="none" stroke="currentColor" strokeWidth="0.5" />
           <path d="M50 35 C 250 25, 350 45, 550 35 C 750 25, 850 45, 1050 35" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        </svg>
        <svg className="w-1/2 h-full text-slate-800" viewBox="0 0 1000 50" preserveAspectRatio="none">
           <path d="M0 25 C 200 15, 300 35, 500 25 C 700 15, 800 35, 1000 25" fill="none" stroke="currentColor" strokeWidth="0.5" />
           <path d="M50 35 C 250 25, 350 45, 550 35 C 750 25, 850 45, 1050 35" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        </svg>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

export const VoyageMap: React.FC = () => {
  // Safe default hooks
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());
  
  const shiftDuration = useAppStore(state => state.shiftDuration) || 8;
  const currentFPS = useAppStore(state => state.currentFPS) || 60;
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Derived State (Memoized for performance)
  const islands = useMemo(() => {
      const list = projects.map(p => {
        const seed = p.id || 0;
        const x = (seed * 9301 + 49297) % 65 + 20; 
        const y = (seed * 49297 + 9301) % 55 + 20; 
        
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.isCompleted).length;
        const progress = total > 0 ? (completed / total) : 0;

        return { id: p.id!, x, y, name: p.name, progress };
      });
      
      // Ensure at least one destination exists to prevent crash
      if (list.length === 0) {
          list.push({ id: 0, x: 50, y: 40, name: "Open Sea", progress: 0 });
      }
      return list;
  }, [projects, tasks]);

  // Navigation Logic
  const activeIsland = islands.find(i => i.progress < 1) || islands[0];
  const startX = 50;
  const startY = 90;
  const targetX = activeIsland ? activeIsland.x : 50;
  const targetY = activeIsland ? activeIsland.y : 50;
  const progress = activeIsland ? activeIsland.progress : 0;
  
  const shipX = startX + (targetX - startX) * progress;
  const shipY = startY + (targetY - startY) * progress;

  const dx = targetX - startX;
  const dy = -(targetY - startY);
  const bearing = (Math.atan2(dx, dy) * 180 / Math.PI) || 0;

  // Animation Physics
  const waveSpeedBase = 30; 
  const waveSpeedModifier = Math.max(0.5, currentFPS / 60);
  const adjustedWaveSpeed = waveSpeedBase / waveSpeedModifier;

  // Telemetry
  let nauticalMilesRemaining = 0;
  if (activeSession) {
      const now = Date.now();
      const elapsedMs = now - activeSession.startTime;
      const totalMs = shiftDuration * 60 * 60 * 1000;
      const remainingHours = Math.max(0, (totalMs - elapsedMs) / (1000 * 60 * 60));
      const currentSpeed = currentFPS > 55 ? 18.5 : 12.0;
      nauticalMilesRemaining = Math.round(remainingHours * currentSpeed);
  }

  // Render
  return (
    <div className="flex flex-col h-full space-y-4" style={{ backgroundColor: '#f4ecd8' }}> {/* Fallback background */}
      
      {/* Map Container */}
      <div 
        ref={containerRef} 
        className="relative flex-1 rounded-xl overflow-hidden border-2 border-[#d4c5a5] shadow-inner bg-[#f4ecd8] min-h-[400px]"
      >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none z-0"></div>

        {/* Dynamic Compass (Top Right) */}
        <div className="absolute top-6 right-6 z-20 w-24 h-24 opacity-80 pointer-events-none">
            <CompassRose rotation={bearing} className="w-full h-full" />
        </div>

        {/* Chart Status Ledger (Top Left) */}
        <div className="absolute top-6 left-6 z-20 bg-[#fdfbf7] border-4 border-[#b5a642] p-4 rounded shadow-lg min-w-[160px]">
           {/* Decorative Screws */}
           <div className="absolute top-1 left-1 w-1 h-1 bg-stone-400 rounded-full"></div>
           <div className="absolute top-1 right-1 w-1 h-1 bg-stone-400 rounded-full"></div>
           <div className="absolute bottom-1 left-1 w-1 h-1 bg-stone-400 rounded-full"></div>
           <div className="absolute bottom-1 right-1 w-1 h-1 bg-stone-400 rounded-full"></div>

           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#78350f] mb-2 border-b border-[#b5a642]/50 pb-1">
              Voyage Log
           </h4>
           <div className="space-y-1 font-mono text-[9px] text-slate-600">
               <div className="flex justify-between"><span>LAT:</span><span className="font-bold">{Math.round(shipY)}°N</span></div>
               <div className="flex justify-between"><span>LONG:</span><span className="font-bold">{Math.round(shipX)}°W</span></div>
               <div className="flex justify-between"><span>SPEED:</span><span className="font-bold text-blue-600">{currentFPS > 55 ? '18.5' : '12.0'} kts</span></div>
               <div className="flex justify-between mt-2 pt-1 border-t border-stone-200"><span>TARGET:</span><span className="font-bold truncate max-w-[80px]">{activeIsland?.name}</span></div>
           </div>
        </div>

        {/* Hand-Drawn Waves (Parallax) */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <InkWave speed={adjustedWaveSpeed} delay={0} opacity={0.6} y="15%" />
            <InkWave speed={adjustedWaveSpeed * 1.5} delay={2} opacity={0.4} y="40%" />
            <InkWave speed={adjustedWaveSpeed * 1.2} delay={5} opacity={0.5} y="65%" />
            <InkWave speed={adjustedWaveSpeed * 0.8} delay={1} opacity={0.7} y="90%" />
        </div>

        {/* Ink Trail */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <motion.path 
                d={`M ${startX}% ${startY}% Q ${(startX + shipX)/2}% ${startY}% ${shipX}% ${shipY}%`} 
                fill="none" 
                stroke="#57534e" 
                strokeWidth="2" 
                strokeDasharray="4,8" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />
        </svg>

        {/* Islands */}
        {islands.map(island => (
          <motion.div
            key={island.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
            style={{ left: `${island.x}%`, top: `${island.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <div className="relative flex flex-col items-center text-slate-700">
               <div className="relative z-10 flex flex-col items-center">
                  <Palmtree className={`w-8 h-8 ${island.progress >= 1 ? 'text-emerald-600' : 'text-stone-600'}`} />
                  {island.progress >= 1 && <div className="absolute -top-1 -right-1 text-yellow-500"><Anchor className="w-4 h-4" /></div>}
               </div>
               <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap z-20 bg-white border border-stone-200">
                  <span>{island.name}</span>
               </div>
            </div>
          </motion.div>
        ))}

        {/* The Ship */}
        <motion.div 
          className="absolute z-20"
          initial={{ left: `${startX}%`, top: `${startY}%` }}
          animate={{ left: `${shipX}%`, top: `${shipY}%` }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
           <motion.div 
             className="relative -translate-x-1/2 -translate-y-1/2"
             animate={{ y: [0, -5, 0], rotate: [0, 1, 0, -1, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           >
              <ThreeMastedShip className="w-24 h-24 text-slate-800 drop-shadow-lg" />
              {activeSession && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-1 rounded text-[9px] font-bold text-slate-600 whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {nauticalMilesRemaining} NM TO GOAL
                  </div>
              )}
           </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default VoyageMap;
