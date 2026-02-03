
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Anchor, LifeBuoy, Users, AlertTriangle, Zap, CheckCircle2, Eye, DownloadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrewStatus, FlareType } from '../types';
import { NotificationManager } from '../utils/notifications';

export const ManifestCheck: React.FC = () => {
  const crewManifest = useAppStore(state => state.crewManifest);
  const resolveFlare = useAppStore(state => state.resolveFlare);
  const throwLifebuoy = useAppStore(state => state.throwLifebuoy);
  const performSafetyCheck = useAppStore(state => state.performSafetyCheck);
  
  // Drag State
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  // Auto-log general inspection when opened/mounted
  useEffect(() => {
      performSafetyCheck();
  }, [performSafetyCheck]);

  const handleCrewClick = (id: string) => {
      performSafetyCheck(id);
  };

  const getStatusIcon = (status: CrewStatus) => {
    switch (status) {
      case 'AT_OARS': return <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.6)]"></div>;
      case 'DRIFTING': return <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]"></div>;
      case 'MAN_OVERBOARD': return <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>;
    }
  };

  const getStatusText = (status: CrewStatus) => {
      switch (status) {
          case 'AT_OARS': return 'At the Oars';
          case 'DRIFTING': return 'Drifting';
          case 'MAN_OVERBOARD': return 'Man Overboard!';
      }
  };

  const getFlareIcon = (type?: FlareType) => {
      if (!type) return null;
      switch (type) {
          case 'RED': return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
          case 'WHITE': return <Zap className="w-4 h-4 text-slate-400 animate-pulse" />;
          case 'GREEN': return <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />;
      }
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      setDragTargetId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, member: any) => {
      e.preventDefault();
      setDragTargetId(null);
      
      const files = Array.from(e.dataTransfer.files);
      const text = e.dataTransfer.getData('text');
      
      if (files.length > 0) {
          NotificationManager.send("Supply Drop", `Crate of ${files.length} items tossed to ${member.name}.`);
      } else if (text) {
          NotificationManager.send("Supply Drop", `Intel note tossed to ${member.name}.`);
      }
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-sm overflow-hidden mb-6 relative">
      {/* Paper Header */}
      <div className="bg-[#F8F9FA] border-b border-[#E0E0E0] px-6 py-3 flex justify-between items-center">
        <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-slate-500" />
          Crew Manifest
        </h3>
        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
            {crewManifest.filter(c => c.status === 'AT_OARS').length} / {crewManifest.length} Active
        </span>
      </div>

      <div className="divide-y divide-stone-100">
        <AnimatePresence>
        {crewManifest.map(member => (
          <motion.div 
            key={member.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => handleCrewClick(member.id)}
            onDragOver={(e) => handleDragOver(e, member.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, member)}
            className={`
                px-6 py-3 flex items-center justify-between group transition-all cursor-pointer relative overflow-hidden
                ${member.status === 'MAN_OVERBOARD' ? 'bg-red-50/50' : 'hover:bg-stone-50'}
                ${dragTargetId === member.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}
            `}
          >
            {/* Supply Drop Overlay */}
            {dragTargetId === member.id && (
                <div className="absolute inset-0 bg-blue-100/80 flex items-center justify-center z-10 text-blue-600 font-bold text-xs uppercase tracking-wider gap-2">
                    <DownloadCloud className="w-4 h-4 animate-bounce" /> Toss Crate
                </div>
            )}

            <div className="flex items-center gap-4">
               {getStatusIcon(member.status)}
               <div>
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 text-sm">{member.name}</span>
                    {member.activeFlare && (
                        <div 
                            className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-0.5 rounded-full cursor-pointer hover:border-blue-300 transition-colors shadow-sm"
                            onClick={(e) => { e.stopPropagation(); resolveFlare(member.id); }}
                            title="Acknowledge Flare"
                        >
                            {getFlareIcon(member.activeFlare)}
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Signal</span>
                        </div>
                    )}
                 </div>
                 <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wide flex items-center gap-2">
                    <span>{member.role} Class</span>
                    <span className="text-stone-300">•</span>
                    <span className={`${member.status === 'MAN_OVERBOARD' ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                        {getStatusText(member.status)}
                    </span>
                 </div>
               </div>
            </div>

            <div className="flex items-center">
               {/* Hover Eye for Safety Check Indication */}
               <div className="opacity-0 group-hover:opacity-30 mr-3 text-slate-400" title="Logging Safety Check">
                   <Eye className="w-4 h-4" />
               </div>

               {member.status !== 'AT_OARS' && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); throwLifebuoy(member.id); }}
                     className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-bold text-blue-600 hover:text-blue-700 hover:border-blue-300 shadow-sm transition-all"
                     title="Throw Lifebuoy"
                   >
                     <LifeBuoy className="w-3 h-3" />
                     Rescue
                   </button>
               )}
               {member.status === 'AT_OARS' && (
                   <Anchor className="w-4 h-4 text-stone-200" />
               )}
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
