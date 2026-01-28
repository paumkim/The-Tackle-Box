
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Trash2, RefreshCw, X, AlertTriangle, Lightbulb, Zap, ToggleLeft, Layers, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface TheDepthsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheDepths: React.FC<TheDepthsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'DEBRIS' | 'SCHEMATICS'>('DEBRIS');
  
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('DEBRIS')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'DEBRIS' ? 'bg-red-50 text-red-600 border-b-2 border-red-500' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
                <Trash2 className="w-4 h-4" /> Debris Field
            </button>
            <button 
                onClick={() => setActiveTab('SCHEMATICS')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'SCHEMATICS' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
                <Lightbulb className="w-4 h-4" /> Future Concepts
            </button>
            <button onClick={onClose} className="px-4 border-l border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
               <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
           
           {/* TAB 1: DEBRIS (Trash) */}
           {activeTab === 'DEBRIS' && (
               <div className="p-4 space-y-2">
                   {deletedAssets && deletedAssets.length > 0 && (
                       <div className="flex justify-end mb-4">
                           <button 
                             onClick={emptyTrash}
                             className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 font-bold uppercase transition-colors shadow-sm"
                           >
                             Deep Clean All
                           </button>
                       </div>
                   )}

                   {!deletedAssets || deletedAssets.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Trash2 className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">The depths are clear.</p>
                     </div>
                   ) : (
                     deletedAssets.map(asset => (
                       <div key={asset.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all group">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                                {asset.type.split('/')[1] || 'FILE'}
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{asset.name}</p>
                                <p className="text-[10px] text-slate-400">
                                   Sunk {new Date(asset.deletedAt!).toLocaleDateString()}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleRestore(asset.id!)}
                               className="p-1.5 text-blue-500 hover:bg-blue-50 rounded tooltip-trigger"
                               title="Re-surface"
                             >
                                <RefreshCw className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDeepClean(asset.id!)}
                               className="p-1.5 text-red-500 hover:bg-red-50 rounded tooltip-trigger"
                               title="Delete Permanently"
                             >
                                <X className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                     ))
                   )}
               </div>
           )}

           {/* TAB 2: SCHEMATICS (Concept Vault) */}
           {activeTab === 'SCHEMATICS' && (
               <div className="p-6 grid grid-cols-1 gap-6">
                   <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-600 shadow-xl relative overflow-hidden group">
                       {/* Blueprint Grid Background */}
                       <div className="absolute inset-0 opacity-20" style={{ 
                           backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
                           backgroundSize: '20px 20px' 
                       }}></div>
                       
                       <div className="relative z-10">
                           <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 border border-blue-400/50 rounded-lg text-blue-400">
                                       <Zap className="w-6 h-6" />
                                   </div>
                                   <div>
                                       <h3 className="font-mono text-lg font-bold text-blue-200">MASTER BREAKER</h3>
                                       <span className="text-[10px] text-blue-400/60 uppercase tracking-widest border border-blue-400/30 px-1 rounded">Prototype v0.1</span>
                                   </div>
                               </div>
                               <ToggleLeft className="w-8 h-8 text-slate-500 opacity-50" />
                           </div>
                           <p className="text-sm font-mono text-slate-400 mb-4 leading-relaxed">
                               Global kill-switch mechanism. Designed to physically sever all incoming notifications and lock the UI into 'Lantern Mode' for extreme focus. Requires hardware integration study.
                           </p>
                           <div className="h-px w-full bg-slate-700 mb-2"></div>
                           <div className="text-[10px] text-slate-500 font-mono uppercase text-right">Status: Archived for Review</div>
                       </div>
                   </div>

                   <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-600 shadow-xl relative overflow-hidden group">
                       {/* Blueprint Grid Background */}
                       <div className="absolute inset-0 opacity-20" style={{ 
                           backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
                           backgroundSize: '20px 20px' 
                       }}></div>
                       
                       <div className="relative z-10">
                           <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 border border-blue-400/50 rounded-lg text-blue-400">
                                       <Layers className="w-6 h-6" />
                                   </div>
                                   <div>
                                       <h3 className="font-mono text-lg font-bold text-blue-200">APP EXTENSIONS</h3>
                                       <span className="text-[10px] text-blue-400/60 uppercase tracking-widest border border-blue-400/30 px-1 rounded">Prototype v0.4</span>
                                   </div>
                               </div>
                               <div className="w-8 h-8 border border-dashed border-slate-500 rounded flex items-center justify-center opacity-50">
                                   <Plus className="w-4 h-4 text-slate-500" />
                               </div>
                           </div>
                           <p className="text-sm font-mono text-slate-400 mb-4 leading-relaxed">
                               Modular plugin architecture allowing 3rd party tools to dock in The Reef. Security implications of open ports in the hull deemed too high for current class.
                           </p>
                           <div className="h-px w-full bg-slate-700 mb-2"></div>
                           <div className="text-[10px] text-slate-500 font-mono uppercase text-right">Status: Archived for Review</div>
                       </div>
                   </div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
