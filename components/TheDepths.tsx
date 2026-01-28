
import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Trash2, RefreshCw, X, Lightbulb, Zap, ToggleLeft, Layers, Plus, PanelLeft, Moon, Sun, Anchor, PenTool, FileText, Activity, Search, Wifi, Maximize2, BellOff, Book, CloudLightning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

interface TheDepthsProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConceptStatus = 'ACHIEVED' | 'DECOMMISSIONED' | 'UNDER REVIEW' | 'ARCHIVED';

interface Concept {
    id: string;
    title: string;
    version: string;
    status: ConceptStatus;
    description: string;
    icon: any;
}

export const TheDepths: React.FC<TheDepthsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'DEBRIS' | 'SCHEMATICS'>('DEBRIS');
  const [ghostQuery, setGhostQuery] = useState('');
  
  // Use Global Sync State
  const signalMode = useAppStore(state => state.signalMode);
  const setSignalMode = useAppStore(state => state.setSignalMode);
  
  // Query for deleted assets
  const deletedAssets = useLiveQuery(() => 
    db.assets.where('deletedAt').above(0).reverse().sortBy('deletedAt')
  );

  const handleRestore = async (id: number) => {
    await db.assets.update(id, { deletedAt: undefined });
  };

  const handleDeepClean = async (id: number) => {
    await db.assets.delete(id);
  };

  const emptyTrash = async () => {
    if (window.confirm("This will permanently scrub all items from existence. Proceed?")) {
        if (deletedAssets) {
            await db.assets.bulkDelete(deletedAssets.map(a => a.id!));
        }
    }
  };

  // Hull-Sync Simulation (The Silent Courier) - Override local with manual trigger if open
  useEffect(() => {
      if (isOpen) {
          // Force a sync pulse on open
          setSignalMode('SYNCING');
          setTimeout(() => setSignalMode('SUCCESS'), 2000);
      }
  }, [isOpen, setSignalMode]);

  // Dynamic Concept Ledger
  const concepts: Concept[] = [
      {
          id: 'c-logbook',
          title: 'The Logbook',
          version: 'v1.0',
          status: 'ACHIEVED',
          description: 'Official Ship\'s Manifest & Duty Roster. Now live on the bridge with automated audit tracking.',
          icon: Book
      },
      {
          id: 'c-ghost',
          title: 'Ghost Search',
          version: 'v0.1',
          status: 'UNDER REVIEW',
          description: 'Zero-UI filtering mechanism. Simply start typing on the deck to instantly filter tasks and notes.',
          icon: Search
      },
      {
          id: 'c-sync',
          title: 'Instant Hull-Sync',
          version: 'v0.2',
          status: 'UNDER REVIEW',
          description: 'Background protocol ensuring mobile-to-bridge data state is perfectly synchronized without manual refresh.',
          icon: Wifi
      },
      {
          id: 'c-horizon',
          title: 'Minimalist Horizon',
          version: 'v0.3',
          status: 'UNDER REVIEW',
          description: 'Focus Mode that strips away side rails and instruments, leaving only Classic Paper and the active task.',
          icon: Maximize2
      },
      {
          id: 'c-midnight',
          title: 'Midnight Engine',
          version: 'v0.9',
          status: 'DECOMMISSIONED',
          description: 'Dynamic theme switching logic. Disabled to preserve maximum frame rate on "Classic Paper" hull.',
          icon: Moon
      },
      {
          id: 'c-raft',
          title: 'Shark Fin & Bell',
          version: 'v0.4',
          status: 'DECOMMISSIONED',
          description: 'Mechanical raft distractions (fishing mini-games). Scrapped to avoid the "Janitor Trap".',
          icon: BellOff
      },
      {
          id: 'c-clear',
          title: 'Clear Deck Protocol',
          version: 'v0.2',
          status: 'DECOMMISSIONED',
          description: 'Sidebar collapsing mechanism. Removed to simplify layout calculations and keep navigation constant.',
          icon: PanelLeft
      },
      {
          id: 'c-morning',
          title: 'Morning Cast',
          version: 'v0.5',
          status: 'ARCHIVED',
          description: 'Automated daily planner modal. Logic removed; Captain prefers manual entry for intentionality.',
          icon: Anchor
      }
  ];

  // Logic to determine total matches for Lamp Feedback
  useEffect(() => {
      if (!ghostQuery) {
          if (signalMode === 'PROCESSING' || signalMode === 'ERROR') {
              setSignalMode('IDLE');
          }
          return;
      }

      let matchCount = 0;
      if (activeTab === 'DEBRIS' && deletedAssets) {
          matchCount = deletedAssets.filter(a => a.name.toLowerCase().includes(ghostQuery.toLowerCase())).length;
      } else if (activeTab === 'SCHEMATICS') {
          matchCount = concepts.filter(c => 
              c.title.toLowerCase().includes(ghostQuery.toLowerCase()) || 
              c.description.toLowerCase().includes(ghostQuery.toLowerCase())
          ).length;
      }

      if (matchCount === 0) {
          setSignalMode('ERROR');
      } else {
          setSignalMode('PROCESSING');
      }
  }, [ghostQuery, activeTab, deletedAssets, concepts, setSignalMode, signalMode]);

  // Ghost Search Listener (The Invisible Listener)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!isOpen) return;
          
          // Ignore if typing in a real input (though Vault has none, safety first)
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

          if (e.key === 'Escape') {
              if (ghostQuery) {
                  setGhostQuery(''); // Clear filter first
                  e.stopPropagation(); // Prevent modal close if clearing filter
              } else {
                  onClose(); // Close modal if no filter
              }
              return;
          }

          if (e.key === 'Backspace') {
              setGhostQuery(prev => prev.slice(0, -1));
              return;
          }

          // Capture alphanumeric keys for Ghost Search
          if (e.key.length === 1 && /^[a-zA-Z0-9 ]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
              setGhostQuery(prev => prev + e.key);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, ghostQuery, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      
      {/* Click outside to close */}
      <div className="absolute inset-0 z-0" onClick={onClose}></div>

      {/* The Vault Container - Heavy Parchment & Brass */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.1 }}
        className="relative z-10 w-full max-w-3xl h-[75vh] bg-[#fdfbf7] rounded-xl shadow-2xl border-4 border-[#b5a642] flex flex-col overflow-hidden"
      >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none z-0"></div>

        {/* Brass Header Plate */}
        <div className="bg-[#f0eadd] border-b-2 border-[#b5a642] p-1 flex justify-between items-stretch shrink-0 relative z-10 select-none">
            <div className="flex gap-1 flex-1">
                <button 
                    onClick={() => { setActiveTab('DEBRIS'); setGhostQuery(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-t-lg font-serif font-bold text-sm transition-all border-x border-t ${
                        activeTab === 'DEBRIS' 
                        ? 'bg-[#fdfbf7] text-slate-800 border-[#b5a642] border-b-transparent translate-y-[2px]' 
                        : 'bg-[#e6dfcf] text-slate-500 border-transparent hover:bg-[#ece6d8]'
                    }`}
                >
                    <Trash2 className={`w-4 h-4 ${activeTab === 'DEBRIS' ? 'text-red-600' : 'text-slate-400'}`} />
                    <span>Debris Field</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('SCHEMATICS'); setGhostQuery(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-t-lg font-serif font-bold text-sm transition-all border-x border-t ${
                        activeTab === 'SCHEMATICS' 
                        ? 'bg-[#fdfbf7] text-slate-800 border-[#b5a642] border-b-transparent translate-y-[2px]' 
                        : 'bg-[#e6dfcf] text-slate-500 border-transparent hover:bg-[#ece6d8]'
                    }`}
                >
                    <Lightbulb className={`w-4 h-4 ${activeTab === 'SCHEMATICS' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Future Concepts</span>
                </button>
            </div>
            
            <button 
                onClick={onClose}
                className="w-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg ml-1 transition-colors"
                title="Seal Vault"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-[#fdfbf7]">
           
           {/* Ghost Search Watermark */}
           <AnimatePresence>
               {ghostQuery && (
                   <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed bottom-10 right-10 z-50 pointer-events-none"
                   >
                       <div className="bg-slate-800 text-white px-4 py-2 rounded-lg font-mono text-xl font-bold shadow-2xl border-2 border-slate-600 flex items-center gap-2 opacity-90">
                           <Search className="w-5 h-5 text-emerald-400 animate-pulse" />
                           <span className="uppercase tracking-widest">{ghostQuery}</span>
                           <span className="w-2 h-5 bg-emerald-400 animate-pulse ml-1"></span>
                       </div>
                   </motion.div>
               )}
           </AnimatePresence>

           {/* TAB 1: DEBRIS (Recycle Bin) */}
           {activeTab === 'DEBRIS' && (
               <div className="p-6 space-y-4">
                   <div className="flex justify-between items-end border-b border-stone-200 pb-4 mb-4">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-slate-700">Salvage Operations</h3>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                                {ghostQuery ? `Filtering: "${ghostQuery}"` : 'Recover accidental losses or jettison cargo.'}
                            </p>
                        </div>
                        {deletedAssets && deletedAssets.length > 0 && (
                           <button 
                             onClick={emptyTrash}
                             className="text-xs bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2"
                           >
                             <Trash2 className="w-3 h-3" /> Jettison All
                           </button>
                        )}
                   </div>

                   {!deletedAssets || deletedAssets.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-stone-200 rounded-xl">
                        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                            <Anchor className="w-8 h-8 text-stone-300" />
                        </div>
                        <p className="text-sm font-serif italic">The hull is clean, Captain.</p>
                        <p className="text-xs text-slate-300 mt-1">No debris detected.</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 gap-2">
                         {deletedAssets.map(asset => {
                           const matches = asset.name.toLowerCase().includes(ghostQuery.toLowerCase());
                           
                           return (
                           <div 
                                key={asset.id} 
                                className={`flex items-center justify-between p-4 bg-white border border-stone-200 rounded-lg hover:border-stone-300 shadow-sm transition-all duration-300 group
                                ${matches ? 'opacity-100 scale-100' : 'opacity-20 scale-95 blur-[1px] pointer-events-none'}
                                `}
                           >
                              <div className="flex items-center gap-4 overflow-hidden">
                                 <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center text-slate-500 font-bold uppercase text-xs border border-stone-200">
                                    {asset.type.split('/')[1]?.substring(0,3) || 'FIL'}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate font-serif">{asset.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                       Sunk {new Date(asset.deletedAt!).toLocaleDateString()}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => handleRestore(asset.id!)}
                                   className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold border border-blue-100 hover:border-blue-300 transition-all flex items-center gap-1"
                                   title="Recover"
                                 >
                                    <RefreshCw className="w-3 h-3" /> Recover
                                 </button>
                                 <button 
                                   onClick={() => handleDeepClean(asset.id!)}
                                   className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                   title="Destroy"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                         )})}
                     </div>
                   )}
               </div>
           )}

           {/* TAB 2: SCHEMATICS (Concept Vault) */}
           {activeTab === 'SCHEMATICS' && (
               <div className="p-6">
                   <div className="border-b border-stone-200 pb-4 mb-6 flex justify-between items-end">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-slate-700">Engineering Schematics</h3>
                            <p className="text-xs text-slate-500 font-mono mt-1">Experimental modules and future refits.</p>
                        </div>
                        {/* Hull Sync Indicator (Linked to Global State) */}
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                            {signalMode === 'SYNCING' ? (
                                <>
                                    <CloudLightning className="w-3 h-3 text-emerald-500 animate-pulse" />
                                    <span className="text-emerald-600">Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <Wifi className="w-3 h-3" />
                                    <span>Link: Active</span>
                                </>
                            )}
                        </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {concepts.map((concept) => {
                           const matches = concept.title.toLowerCase().includes(ghostQuery.toLowerCase()) || 
                                           concept.description.toLowerCase().includes(ghostQuery.toLowerCase());
                           
                           return (
                               <ConceptCard 
                                   key={concept.id}
                                   icon={concept.icon}
                                   title={concept.title}
                                   version={concept.version}
                                   status={concept.status}
                                   description={concept.description}
                                   isDimmed={!matches && ghostQuery.length > 0}
                               />
                           );
                       })}
                   </div>
               </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

// Sub-component for consistent Concept Cards on Paper
const ConceptCard: React.FC<{ icon: any, title: string, version: string, status: ConceptStatus, description: string, isDimmed?: boolean }> = ({ icon: Icon, title, version, status, description, isDimmed }) => {
    
    // Status Logic
    let statusColor = 'text-slate-500 border-slate-200';
    let statusBg = 'bg-slate-50';
    
    switch(status) {
        case 'ACHIEVED':
            statusColor = 'text-amber-700 border-amber-200';
            statusBg = 'bg-amber-50';
            break;
        case 'DECOMMISSIONED':
            statusColor = 'text-slate-400 border-slate-200 opacity-70';
            statusBg = 'bg-slate-50';
            break;
        case 'UNDER REVIEW':
            statusColor = 'text-blue-600 border-blue-200';
            statusBg = 'bg-blue-50';
            break;
        case 'ARCHIVED':
            statusColor = 'text-stone-500 border-stone-200 grayscale';
            statusBg = 'bg-[#f5f5f4]';
            break;
    }

    return (
        <div 
            className={`
                bg-white p-5 rounded-lg border-2 border-stone-200 shadow-sm relative overflow-hidden group hover:border-stone-300 transition-all duration-500 ease-out
                ${isDimmed ? 'opacity-20 blur-[2px] scale-95 grayscale' : 'opacity-100 scale-100'}
                ${status === 'DECOMMISSIONED' ? 'opacity-75 grayscale-[0.5]' : ''}
            `}
        >
            {/* Technical Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-md border border-slate-200 text-slate-600">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-serif font-bold text-slate-800 leading-none">{title}</h4>
                        <span className="text-[10px] font-mono text-slate-400">REV: {version}</span>
                    </div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-1 rounded ${statusColor} ${statusBg}`}>
                    {status}
                </span>
            </div>
            
            <p className="text-xs text-slate-600 font-serif leading-relaxed relative z-10">
                {description}
            </p>

            {/* Decorative Corner Marks */}
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-slate-300"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-slate-300"></div>
        </div>
    );
};
