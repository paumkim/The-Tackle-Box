
import React from 'react';
import { useAppStore } from '../store';
import { Droplets, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const WaterBarrel: React.FC = () => {
  const waterCount = useAppStore(state => state.waterCount);
  const drinkWater = useAppStore(state => state.drinkWater);

  const MAX_CAPACITY = 8;
  const isFull = waterCount >= MAX_CAPACITY;

  // Fill height based on 8 glasses max
  const fillPercentage = Math.min(100, (waterCount / MAX_CAPACITY) * 100);

  return (
    <div 
        className={`flex flex-col items-center gap-2 group ${isFull ? 'cursor-default' : 'cursor-pointer'}`} 
        onClick={drinkWater} 
        title={isFull ? "Barrel Full" : "Drink Water"}
    >
      {/* Hand-drawn Barrel Look */}
      <div className={`relative w-8 h-10 bg-white rounded-sm border-2 overflow-hidden shadow-sm transition-colors ${isFull ? 'border-blue-500' : 'border-slate-400'}`}>
         
         {/* Texture Lines (Hoops) */}
         <div className="absolute top-2 left-0 right-0 h-px bg-slate-200 z-20"></div>
         <div className="absolute bottom-2 left-0 right-0 h-px bg-slate-200 z-20"></div>

         {/* Water Level (Ink Blue) */}
         <motion.div 
           className={`absolute bottom-0 left-0 right-0 opacity-80 ${isFull ? 'bg-blue-600' : 'bg-blue-100'}`}
           initial={{ height: 0 }}
           animate={{ height: `${fillPercentage}%` }}
           transition={{ type: 'spring', stiffness: 50 }}
         >
             {/* Surface Line */}
             <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 w-full"></div>
         </motion.div>
         
         {/* Hover Icon */}
         {!isFull && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-[1px] z-30">
                <Plus className="w-4 h-4 text-slate-600" />
             </div>
         )}
         
         {/* Full Checkmark */}
         {isFull && (
             <div className="absolute inset-0 flex items-center justify-center z-30">
                <Check className="w-4 h-4 text-white drop-shadow-md" />
             </div>
         )}
      </div>
      
      <div className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${isFull ? 'text-blue-600 font-bold' : 'text-slate-400 group-hover:text-slate-600'}`}>
         <Droplets className="w-3 h-3" />
         <span>{waterCount}/{MAX_CAPACITY}</span>
      </div>
    </div>
  );
};
