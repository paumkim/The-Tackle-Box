import React from 'react';
import { Fish, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeepWaterProps {
  isActive: boolean;
}

export const DeepWater: React.FC<DeepWaterProps> = ({ isActive }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div 
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
           {/* Ambient Texture - Subtle Grain for Focus */}
           <div className="absolute inset-0 bg-slate-50 opacity-90 mix-blend-multiply pointer-events-none"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>

           {/* Vignette for Focus */}
           <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(148,163,184,0.15)] pointer-events-none"></div>
           
           {/* Subtle Moving Elements (Wind/Flow) */}
           <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent animate-flow-h"></div>
              <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent animate-flow-h" style={{ animationDelay: '2s' }}></div>
           </div>
           
           {/* Companion */}
           <div className="absolute bottom-10 right-10 opacity-10 animate-float">
               <Fish className="w-24 h-24 text-slate-400" />
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};