import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Trash2, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TheDepthsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheDepths: React.FC<TheDepthsProps> = ({ isOpen, onClose }) => {
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
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <Trash2 className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-slate-800">The Depths</h3>
                <p className="text-xs text-slate-500">Items drift here before fading away.</p>
             </div>
          </div>
          <div className="flex gap-2">
             {deletedAssets && deletedAssets.length > 0 && (
                 <button 
                   onClick={emptyTrash}
                   className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 font-bold uppercase transition-colors"
                 >
                   Deep Clean
                 </button>
             )}
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
           {!deletedAssets || deletedAssets.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-slate-400">
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
      </motion.div>
    </div>
  );
};