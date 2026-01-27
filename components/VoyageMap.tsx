
import React, { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useAppStore } from '../store';
import { Task } from '../types';
import { Sailboat, MapPin, Anchor, Navigation, Palmtree, Users, Ship, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

export const VoyageMap: React.FC = () => {
  const mapStyle = useAppStore(state => state.mapStyle);
  const projects = useLiveQuery(() => db.projects.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const crew = useAppStore(state => state.crewManifest);
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());
  const shiftDuration = useAppStore(state => state.shiftDuration);
  
  const [islands, setIslands] = useState<{id: number, x: number, y: number, name: string, progress: number, shapeId: number}[]>([]);
  const [sextantActive, setSextantActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projects && tasks) {
      const mappedIslands = projects.map(p => {
        // Deterministic position based on Project ID
        const seed = p.id || 0;
        const x = (seed * 9301 + 49297) % 70 + 15; // 15% to 85%
        const y = (seed * 49297 + 9301) % 60 + 20; // 20% to 80%
        const shapeId = (seed % 3);
        
        // Calculate progress
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.isCompleted).length;
        const progress = total > 0 ? (completed / total) : 0;

        return { id: p.id!, x, y, name: p.name, progress, shapeId };
      });
      
      // Add "Open Sea" dummy island if no projects
      if (mappedIslands.length === 0) {
          mappedIslands.push({ id: 0, x: 50, y: 50, name: "Open Sea", progress: 0, shapeId: 0 });
      }
      
      setIslands(mappedIslands);
    }
  }, [projects, tasks]);

  // Determine active destination (Island with highest progress that isn't 100%)
  const activeIsland = islands.find(i => i.progress < 1) || islands[0];
  
  // Ship Position: Interpolate towards active island based on its progress
  const shipX = 50 + (activeIsland ? (activeIsland.x - 50) * activeIsland.progress : 0);
  const shipY = 85 + (activeIsland ? (activeIsland.y - 85) * activeIsland.progress : 0);

  // Calculate Drift (Dead Weight)
  const unassignedTaskCount = tasks?.filter(t => !t.isCompleted && !t.projectId).length || 0;
  const projectTaskCount = tasks?.filter(t => !t.isCompleted && t.projectId).length || 0;
  const totalActive = unassignedTaskCount + projectTaskCount;
  const driftRatio = totalActive > 0 ? (unassignedTaskCount / totalActive) : 0;
  
  // Calculate Distance to Goal (Remaining Time as Nautical Miles)
  let nauticalMilesRemaining = 0;
  if (activeSession) {
      const endTime = activeSession.startTime + (shiftDuration * 60 * 60 * 1000);
      const remainingMs = Math.max(0, endTime - Date.now());
      // 1 Hour = 10 NM approximation for visual flavor
      nauticalMilesRemaining = Math.round(remainingMs / (1000 * 60 * 6)); 
  }

  const isPaper = mapStyle === 'PAPER';
  const bgClass = isPaper ? 'bg-[#F8F9FA]' : 'bg-[#0a192f]';
  const gridClass = isPaper ? 'stroke-slate-300' : 'stroke-cyan-900/30';
  const textClass = isPaper ? 'text-slate-600' : 'text-cyan-400';
  const islandColor = isPaper ? 'text-stone-700' : 'text-cyan-200';

  const LandmassShape = ({ id, className }: { id: number, className: string }) => {
      switch(id) {
          case 0: return <path d="M10,15 Q30,5 50,15 T90,15 Q100,30 90,45 T50,55 T10,45 Z" className={className} fill="currentColor" opacity="0.2" />;
          case 1: return <path d="M20,10 Q50,0 80,10 T90,40 T60,60 T30,50 T10,30 Z" className={className} fill="currentColor" opacity="0.2" />;
          default: return <path d="M30,5 Q70,5 80,30 T60,60 T20,50 T10,20 Z" className={className} fill="currentColor" opacity="0.2" />;
      }
  }

  // The Sextant Visuals
  const SextantOverlay = () => {
      if (!sextantActive || !activeIsland) return null;
      
      const isDeadWeight = driftRatio > 0.4;
      const lineColor = isDeadWeight ? '#f59e0b' : '#3b82f6'; // Amber if drifting, Blue if aligned

      return (
          <div className="absolute inset-0 pointer-events-none z-30">
              <svg width="100%" height="100%">
                  {/* True North Line (Dashed) */}
                  <line 
                    x1={`${shipX}%`} y1={`${shipY}%`} 
                    x2={`${activeIsland.x}%`} y2={`${activeIsland.y}%`}
                    stroke={lineColor} strokeWidth="2" strokeDasharray="8 4" opacity="0.5"
                  />
                  {/* Actual Drift Heading (Solid) - Simplified visual representation of drift */}
                  <line 
                    x1={`${shipX}%`} y1={`${shipY}%`} 
                    x2={`${activeIsland.x + (driftRatio * 30)}%`} y2={`${activeIsland.y}%`}
                    stroke={lineColor} strokeWidth="3"
                  />
                  
                  {/* Arc */}
                  <path 
                    d={`M ${shipX}% ${shipY}% Q ${activeIsland.x}% ${activeIsland.y + 20}% ${activeIsland.x}% ${activeIsland.y}%`} 
                    fill="none" stroke={lineColor} strokeWidth="1" opacity="0.2"
                  />
              </svg>
              
              {/* Sextant readout */}
              <div 
                className="absolute bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-slate-300 shadow-xl text-xs font-mono"
                style={{ top: '10%', right: '10%' }}
              >
                  <div className="flex items-center gap-2 font-bold mb-2 border-b border-slate-200 pb-1">
                      <Compass className={`w-4 h-4 ${isDeadWeight ? 'text-amber-500' : 'text-blue-500'}`} />
                      ALIGNMENT CHECK
                  </div>
                  <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                          <span className="text-slate-500">TRUE NORTH:</span>
                          <span className="font-bold">{activeIsland.name}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                          <span className="text-slate-500">DRIFT FACTOR:</span>
                          <span className={`font-bold ${isDeadWeight ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {(driftRatio * 100).toFixed(0)}%
                          </span>
                      </div>
                      <div className="flex justify-between gap-4">
                          <span className="text-slate-500">STATUS:</span>
                          <span className="font-bold">
                              {isDeadWeight ? 'DEAD WEIGHT DETECTED' : 'ON COURSE'}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Map Container */}
      <div 
        ref={containerRef} 
        onMouseEnter={() => setSextantActive(true)}
        onMouseLeave={() => setSextantActive(false)}
        className={`relative flex-1 rounded-2xl overflow-hidden border ${isPaper ? 'border-stone-300 shadow-inner' : 'border-slate-700 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]'} ${bgClass} transition-colors duration-500 min-h-[400px]`}
      >
        
        {/* Paper Texture Overlay */}
        {isPaper && (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none z-0"></div>
        )}

        {/* Base Grid Layer (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" width="100%" height="100%">
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" className={gridClass} strokeWidth={isPaper ? "0.5" : "0.5"} strokeDasharray={isPaper ? "4,4" : "0"} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Depth Contours (Decorative) */}
          <path d="M0,100 Q200,150 400,100 T800,120" fill="none" stroke={isPaper ? '#cbd5e1' : '#1e293b'} strokeWidth="1" strokeDasharray="8,8" />
          <path d="M0,300 Q300,250 600,300 T1000,280" fill="none" stroke={isPaper ? '#cbd5e1' : '#1e293b'} strokeWidth="1" strokeDasharray="8,8" />

          {/* Path to Active Island */}
          {activeIsland && (
             <line 
               x1="50%" 
               y1="85%" 
               x2={`${activeIsland.x}%`} 
               y2={`${activeIsland.y}%`} 
               stroke={isPaper ? '#94a3b8' : '#0ea5e9'} 
               strokeWidth="2" 
               strokeDasharray="6,4"
               className={isPaper ? '' : 'animate-pulse'}
             />
          )}
        </svg>

        {/* The Sextant Overlay */}
        <SextantOverlay />

        {/* Islands (Projects) */}
        {islands.map(island => (
          <motion.div
            key={island.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
            style={{ left: `${island.x}%`, top: `${island.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <div className={`relative flex flex-col items-center ${islandColor}`}>
               {/* Island Icon */}
               <div className="relative z-10 flex flex-col items-center">
                  <Palmtree className={`w-8 h-8 ${island.progress >= 1 ? 'text-emerald-500' : (isPaper ? 'text-stone-500' : 'text-cyan-600')}`} />
                  {island.progress >= 1 && <div className="absolute -top-1 -right-1 text-yellow-500"><Anchor className="w-4 h-4" /></div>}
               </div>
               
               {/* Label */}
               <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap z-20 flex flex-col items-center ${isPaper ? 'bg-white text-stone-800 border border-stone-200' : 'bg-slate-800 text-cyan-200 border border-cyan-800'}`}>
                  <span>{island.name}</span>
                  <div className="w-10 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${island.progress * 100}%` }}></div>
                  </div>
               </div>
               
               {/* Landmass Blob (Underlay) */}
               <svg className="absolute -top-6 -left-10 w-32 h-32 pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100">
                   <LandmassShape id={island.shapeId} className={isPaper ? 'text-stone-300' : 'text-cyan-900'} />
               </svg>
            </div>
          </motion.div>
        ))}

        {/* The Ship (User) */}
        <motion.div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: `${shipX}%`, top: `${shipY}%` }}
          animate={{ 
             y: [0, -3, 0],
             rotate: [-1, 1, -1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
           <div className="relative group">
              <Sailboat className={`w-10 h-10 ${isPaper ? 'text-slate-700 fill-current' : 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]'}`} />
              
              {/* Distance Overlay */}
              {activeSession && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-slate-200 px-2 py-1 rounded text-[10px] font-bold text-slate-600 whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {nauticalMilesRemaining} NM TO GOAL
                  </div>
              )}

              {/* Wake */}
              <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-20 h-16 bg-gradient-to-t ${isPaper ? 'from-white/50' : 'from-cyan-500/20'} to-transparent clip-path-wake blur-sm`}></div>
           </div>
        </motion.div>

        {/* Compass Rose (Decorative) */}
        <div className={`absolute top-6 right-6 pointer-events-none z-0 ${isPaper ? 'opacity-10' : 'opacity-30'}`}>
           <Navigation className={`w-24 h-24 ${textClass}`} />
        </div>

        {/* Legend / Status (Torn Paper Style) */}
        <div 
          className={`absolute top-4 left-4 p-4 min-w-[140px] z-20 ${isPaper ? 'bg-white shadow-lg text-stone-700' : 'bg-slate-900/80 border border-slate-700 text-cyan-400 rounded-lg backdrop-blur-sm'}`}
          style={isPaper ? { 
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 95%, 95% 100%, 85% 96%, 75% 100%, 65% 97%, 55% 100%, 45% 96%, 35% 100%, 25% 96%, 15% 100%, 5% 96%, 0% 100%)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          } : {}}
        >
           <h4 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-current pb-1">
              <Anchor className="w-3 h-3" /> Chart Status
           </h4>
           <div className="text-[10px] space-y-1.5 font-mono leading-tight">
              <p className="flex justify-between"><span>LAT:</span> <span>{new Date().getHours()}° {new Date().getMinutes()}' N</span></p>
              <p className="flex justify-between"><span>ISLANDS:</span> <span>{islands.length} CHARTED</span></p>
              <p className="flex justify-between"><span>MODE:</span> <span>{mapStyle}</span></p>
           </div>
        </div>
      </div>

      {/* Fleet Status Ledger */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-3 bg-[#fdfbf7] border-b border-stone-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Ship className="w-4 h-4 text-slate-400" /> Fleet Registry
              </h4>
              <span className="text-[10px] font-mono text-slate-400">STATUS: ALL SYSTEMS NOMINAL</span>
          </div>
          
          <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-serif font-bold border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-2 uppercase tracking-wider">Vessel / Officer</th>
                      <th className="px-6 py-2 uppercase tracking-wider">Classification</th>
                      <th className="px-6 py-2 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-2 uppercase tracking-wider text-right">Reliability</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                  {/* The User's Ship */}
                  <tr className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-800 flex items-center gap-2">
                          <Sailboat className="w-4 h-4 text-blue-500" /> The Tackle Box
                      </td>
                      <td className="px-6 py-3">Flagship</td>
                      <td className="px-6 py-3"><span className="text-emerald-600 font-bold">Underway</span></td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800">100%</td>
                  </tr>
                  
                  {/* Crew Members */}
                  {crew.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium flex items-center gap-2">
                              <Users className="w-3 h-3 text-slate-400" /> {member.name}
                          </td>
                          <td className="px-6 py-3 opacity-80">{member.role} Class</td>
                          <td className="px-6 py-3">
                              <span className={`
                                  ${member.status === 'AT_OARS' ? 'text-emerald-600' : 
                                    member.status === 'DRIFTING' ? 'text-amber-500 animate-pulse' : 
                                    'text-slate-400'}
                              `}>
                                  {member.status.replace('_', ' ')}
                              </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                              {member.status === 'DRIFTING' ? <span className="text-red-500 font-bold">75%</span> : '98%'}
                          </td>
                      </tr>
                  ))}
                  
                  {/* Active Projects as Support Vessels */}
                  {projects?.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors opacity-70">
                          <td className="px-6 py-3 font-medium flex items-center gap-2">
                              <Ship className="w-3 h-3 text-slate-300" /> {p.name}
                          </td>
                          <td className="px-6 py-3">Support Vessel</td>
                          <td className="px-6 py-3 text-slate-500">Stationed</td>
                          <td className="px-6 py-3 text-right">100%</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};
