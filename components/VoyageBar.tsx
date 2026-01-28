import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Sailboat, MapPin, Palmtree, Building2, Home, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';

export const VoyageBar: React.FC = () => {
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());
  const shiftDuration = useAppStore(state => state.shiftDuration); // Hours
  const activeProjectId = useAppStore(state => state.activeProjectId);
  const hqName = useAppStore(state => state.hqName);
  const isDepartureManifestOpen = useAppStore(state => state.isDepartureManifestOpen);
  const connectionStatus = useAppStore(state => state.connectionStatus);
  const currentSpeed = useAppStore(state => state.currentSpeed);
  const [progress, setProgress] = useState(0);

  // If active project, query task stats
  const projectTasks = useLiveQuery(() => 
    activeProjectId ? db.tasks.where('projectId').equals(activeProjectId).toArray() : null, 
    [activeProjectId]
  );

  useEffect(() => {
    let interval: number;

    const updateProgress = () => {
        if (activeProjectId && projectTasks && projectTasks.length > 0) {
            // Island Mode: Progress based on task completion
            const total = projectTasks.length;
            const completed = projectTasks.filter(t => t.isCompleted).length;
            setProgress((completed / total) * 100);
        } else if (activeSession) {
            // Ocean/HQ Mode: Progress based on Time
            const now = Date.now();
            const elapsedMs = now - activeSession.startTime;
            const totalMs = shiftDuration * 60 * 60 * 1000;
            const percentage = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
            setProgress(percentage);
        } else {
            setProgress(0);
        }
    };
    
    updateProgress();
    // Update every second for live ship movement
    interval = window.setInterval(updateProgress, 1000); 

    return () => clearInterval(interval);
  }, [activeSession, shiftDuration, activeProjectId, projectTasks]);

  const isFinalApproach = progress >= 90;
  const isDocked = progress >= 100;

  // Clamping logic to keep ship inside the visible track (32px icon width approx 3-4%)
  const shipPosition = Math.max(3, Math.min(97, progress));

  // --- Vessel Motion Protocol ---
  // Heavy Seas condition based on telemetry label logic
  const isHeavySeas = currentSpeed < 15 && currentSpeed > 0;
  
  // Frequency increases with knots. Duration = TotalDistance / Speed.
  // We use a base scale to ensure visibility. 
  // At 40kts -> ~0.7s duration. At 0kts -> 4s duration.
  const swayDuration = currentSpeed > 0 ? Math.max(0.4, 40 / (currentSpeed + 10)) : 4;

  return (
    <div className={`w-full h-12 bg-transparent relative overflow-hidden flex items-center select-none z-50 mt-2 transition-all duration-500 ${isDepartureManifestOpen ? 'pointer-events-none' : ''}`}>
      {/* Grid Lines (Longitude) - Faint */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_98%,rgba(0,0,0,0.05)_99%)] bg-[length:10%_100%]"></div>

      {/* Track Line */}
      <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-slate-300"></div>

      {/* Markers (Islands/Hours) */}
      <div className="absolute left-[25%] top-1/2 -translate-y-1/2 text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-current"></div></div>
      <div className="absolute left-[50%] top-1/2 -translate-y-1/2 text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-current"></div></div>
      <div className="absolute left-[75%] top-1/2 -translate-y-1/2 text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-current"></div></div>

      {/* The Fog (Remaining Time) - White gradient */}
      <div 
        className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none transition-all duration-1000"
        style={{ left: `${progress}%` }}
      >
      </div>

      {/* Departure Icon (Left Edge) - Only in HQ Mode */}
      {!activeProjectId && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-slate-400" title="Home Port">
              <Home className="w-5 h-5" />
          </div>
      )}

      {/* Destination Icon (End of Bar) */}
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isFinalApproach ? 'text-amber-500 opacity-100 animate-pulse' : 'text-slate-400 opacity-30'}`} title={activeProjectId ? 'Island Complete' : hqName}>
          {activeProjectId ? <Palmtree className="w-5 h-5" /> : (isDocked ? <Anchor className="w-5 h-5" /> : <Building2 className="w-5 h-5" />)}
      </div>

      {/* The Ship - Snapped to Grid Logic */}
      <motion.div 
        className={`absolute top-1/2 -translate-y-1/2 z-10 ${isFinalApproach ? 'text-blue-800' : 'text-blue-600'}`}
        initial={{ left: '3%' }}
        animate={{ left: `${shipPosition}%` }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
         <div 
            className={`relative -ml-4 -mt-4 transform-gpu ${isHeavySeas ? 'vessel-sway-heavy' : 'vessel-sway-idle'}`}
            style={{ animationDuration: `${swayDuration}s` }}
         >
             <Sailboat className="w-8 h-8 fill-current" />
             {/* Wake Effect - Slows down on final approach */}
             {activeSession && !isDocked && (
               <motion.div 
                 className="absolute right-full top-6 w-16 h-[2px] bg-gradient-to-l from-blue-300 to-transparent blur-[1px]"
                 animate={{ opacity: [0.5, 1, 0.5], width: [40, 60, 40] }}
                 transition={{ duration: isFinalApproach ? 4 : 2, repeat: Infinity }}
               ></motion.div>
             )}
         </div>
      </motion.div>

      {/* Status Text with Signal Light */}
      <div className={`absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-mono uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur-sm border shadow-sm transition-all flex items-center gap-2 ${
          isFinalApproach 
          ? 'text-amber-600 border-amber-200 shadow-amber-100 font-bold' 
          : 'text-slate-400 border-slate-200'
      }`}>
         <span>
            {activeProjectId ? 'ISLAND PROGRESS' : `EN ROUTE TO ${hqName.split(',')[0].toUpperCase()}`}: 
            <span className={isFinalApproach ? 'animate-pulse' : ''}> {Math.round(progress)}%</span>
         </span>
         
         {/* Signal Light */}
         <div className="w-px h-3 bg-slate-300 mx-1"></div>
         <div className="flex items-center gap-1" title={`COMM-LINK: ${connectionStatus}`}>
             <span>LINK</span>
             <div className={`w-2 h-2 rounded-full border border-slate-300 ${
                 connectionStatus === 'GOOD' ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 
                 connectionStatus === 'LAG' ? 'bg-amber-400 animate-pulse' : 'bg-red-500 animate-flash'
             }`}></div>
         </div>
      </div>
    </div>
  );
};
