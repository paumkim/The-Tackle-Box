
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { MapPin, Palmtree, Building2, Home, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';

// Mini version of the high-fidelity ship for the bar
const ThreeMastedShipMini = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
    <path d="M10 75 Q 25 90 50 90 Q 85 90 95 70 L 90 60 H 15 L 10 75 Z" fill="currentColor" fillOpacity="0.1" />
    <line x1="30" y1="60" x2="30" y2="25" />
    <line x1="55" y1="60" x2="55" y2="15" />
    <line x1="80" y1="60" x2="80" y2="30" />
    <path d="M30 30 Q 15 30 15 45 Q 30 45 30 45" fill="currentColor" fillOpacity="0.2" />
    <path d="M55 20 Q 35 20 35 40 Q 55 40 55 40" fill="currentColor" fillOpacity="0.2" />
    <path d="M55 15 L 65 12 L 55 18" fill="currentColor" />
  </svg>
);

export const VoyageBar: React.FC = () => {
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());
  const shiftDuration = useAppStore(state => state.shiftDuration); // Hours
  const activeProjectId = useAppStore(state => state.activeProjectId);
  const hqName = useAppStore(state => state.hqName);
  const isDepartureManifestOpen = useAppStore(state => state.isDepartureManifestOpen);
  const connectionStatus = useAppStore(state => state.connectionStatus);
  const currentFPS = useAppStore(state => state.currentFPS);
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

  // Clamping logic to keep ship inside the visible track
  const shipPosition = Math.max(3, Math.min(97, progress));

  // --- Vessel Motion Protocol ---
  const isHeavySeas = currentFPS < 55;
  const swayDuration = Math.max(0.5, currentFPS / 15);

  return (
    <div className={`w-full h-16 bg-transparent relative flex items-center select-none z-50 mt-0 transition-all duration-500 ${isDepartureManifestOpen ? 'pointer-events-none' : ''}`}>
      
      {/* Hand-Drawn Horizon Line (Ink Style) - Lowered to top-10 (40px) */}
      <div className="absolute top-10 left-4 right-4 h-px bg-slate-300 z-0"></div>
      
      {/* Markers (Islands/Hours) - Ink Dots */}
      <div className="absolute left-[25%] top-10 -translate-y-1/2 text-slate-400 z-0"><div className="w-1.5 h-1.5 rounded-full border border-current bg-[#fdfbf7]"></div></div>
      <div className="absolute left-[50%] top-10 -translate-y-1/2 text-slate-400 z-0"><div className="w-1.5 h-1.5 rounded-full border border-current bg-[#fdfbf7]"></div></div>
      <div className="absolute left-[75%] top-10 -translate-y-1/2 text-slate-400 z-0"><div className="w-1.5 h-1.5 rounded-full border border-current bg-[#fdfbf7]"></div></div>

      {/* Scrolling Waves (Bottom Edge) - Contained to bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-5 overflow-hidden opacity-30 pointer-events-none z-0">
          <motion.div 
            className="flex w-[200%]"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          >
             <svg className="w-full h-full text-slate-400" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 10 0 20 5 T 40 5 T 60 5 T 80 5 T 100 5 V 10 H 0 Z" fill="currentColor" opacity="0.5" />
             </svg>
             <svg className="w-full h-full text-slate-400" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 10 0 20 5 T 40 5 T 60 5 T 80 5 T 100 5 V 10 H 0 Z" fill="currentColor" opacity="0.5" />
             </svg>
          </motion.div>
      </div>

      {/* Departure Icon (Left Edge) */}
      {!activeProjectId && (
          <div className="absolute left-4 top-10 -translate-y-1/2 opacity-40 text-slate-500" title="Home Port">
              <Home className="w-5 h-5" />
          </div>
      )}

      {/* Destination Icon (End of Bar) */}
      <div className={`absolute right-4 top-10 -translate-y-1/2 transition-colors ${isFinalApproach ? 'text-amber-600 opacity-100 animate-pulse' : 'text-slate-400 opacity-40'}`} title={activeProjectId ? 'Island Complete' : hqName}>
          {activeProjectId ? <Palmtree className="w-5 h-5" /> : (isDocked ? <Anchor className="w-5 h-5" /> : <Building2 className="w-5 h-5" />)}
      </div>

      {/* The Ship - Buoyant Movement */}
      <motion.div 
        className={`absolute top-10 -translate-y-1/2 z-20 ${isFinalApproach ? 'text-blue-800' : 'text-slate-800'}`}
        initial={{ left: '3%' }}
        animate={{ left: `${shipPosition}%` }}
        transition={{ type: "spring", stiffness: 40, damping: 20 }} // Smooth, buoyant easing
        style={{ overflow: 'visible' }}
      >
         <div 
            className={`relative -ml-5 -mt-7 transform-gpu ${isHeavySeas ? 'vessel-sway-heavy' : 'vessel-sway-idle'}`}
            style={{ animationDuration: `${swayDuration}s` }}
         >
             <ThreeMastedShipMini className="w-10 h-10 drop-shadow-sm" />
             
             {/* Ink Wake Trail */}
             {activeSession && !isDocked && (
               <motion.svg 
                 className="absolute right-6 top-8 w-16 h-2 overflow-visible"
                 viewBox="0 0 50 10"
               >
                   <motion.path 
                     d="M0 5 Q 10 8 20 5 T 40 5" 
                     fill="none" 
                     stroke="currentColor" 
                     strokeWidth="1" 
                     strokeOpacity="0.3"
                     strokeDasharray="2 2"
                     animate={{ x: [0, -5] }}
                     transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                   />
               </motion.svg>
             )}
         </div>
      </motion.div>

      {/* Status Text (Torn Paper Label) */}
      <div className="absolute right-12 top-10 -translate-y-1/2 z-10">
          <div className={`
              text-[9px] font-mono uppercase tracking-widest bg-[#fdfbf7]/90 px-2 py-1 border transition-all flex items-center gap-2 shadow-sm
              ${isFinalApproach ? 'text-amber-700 border-amber-200' : 'text-slate-500 border-stone-300'}
          `} style={{ clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)' }}>
             <span>
                {activeProjectId ? 'ISLAND' : 'VOYAGE'}: 
                <span className={isFinalApproach ? 'animate-pulse font-bold' : 'font-bold'}> {Math.round(progress)}%</span>
             </span>
             
             <div className="w-px h-3 bg-stone-300 mx-1"></div>
             
             <div className="flex items-center gap-1" title={`COMM-LINK: ${connectionStatus}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${
                     connectionStatus === 'GOOD' ? 'bg-emerald-500' : 
                     connectionStatus === 'LAG' ? 'bg-amber-400' : 'bg-red-500'
                 }`}></div>
             </div>
          </div>
      </div>
    </div>
  );
};
