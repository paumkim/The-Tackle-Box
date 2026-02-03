import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Flame, X, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlareType } from '../types';

export const FlareGun: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fireFlare = useAppStore(state => state.fireFlare);
  
  // For demo purposes, we'll assume the current user is ID '1' (Navigator John) 
  // In a real app, this would come from auth context
  const currentUserId = '1';

  const handleFire = (type: FlareType) => {
      fireFlare(currentUserId, type);
      setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-3 bg-white border border-stone-200 rounded-xl shadow-lg p-2 min-w-[160px] flex flex-col gap-1"
          >
             <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-stone-100">
                 Signal Type
             </div>
             
             <button onClick={() => handleFire('RED')} className="flex items-center gap-2 p-2 hover:bg-red-50 rounded-lg text-xs font-bold text-red-600 transition-colors text-left">
                 <AlertTriangle className="w-3 h-3" /> Sinking (Help!)
             </button>
             <button onClick={() => handleFire('WHITE')} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors text-left">
                 <Zap className="w-3 h-3" /> Tech Issue
             </button>
             <button onClick={() => handleFire('GREEN')} className="flex items-center gap-2 p-2 hover:bg-emerald-50 rounded-lg text-xs font-bold text-emerald-600 transition-colors text-left">
                 <CheckCircle2 className="w-3 h-3" /> Big Catch
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center w-10 h-10 rounded-full shadow-sm border transition-all ${isOpen ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-stone-200 text-slate-400 hover:text-red-500 hover:border-red-200'}`}
        title="Flare Gun (SOS)"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
      </button>
    </div>
  );
};