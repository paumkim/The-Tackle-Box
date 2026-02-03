
import React, { useEffect, useRef, useState } from 'react';
import { EnergyLevel } from '../types';
import { useAppStore } from '../store';

export const ResponseBallast: React.FC = () => {
  const energy = useAppStore(state => state.energyLevel);
  const setEnergy = useAppStore(state => state.setEnergyLevel);
  const setPatcoAlert = useAppStore(state => state.setPatcoAlert);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(energy === EnergyLevel.HIGH ? 0 : 100);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
      // Sync internal visual state with prop (0% is Top/High, 100% is Bottom/Low)
      setDragY(energy === EnergyLevel.HIGH ? 0 : 100);
  }, [energy]);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      // Calculate percentage from top
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setDragY(y);
  };

  const handleEndDrag = () => {
      if (isDragging) {
          setIsDragging(false);
          // Snap to closest: Top (0-50%) = HIGH, Bottom (50-100%) = LOW
          if (dragY < 50) {
              setEnergy(EnergyLevel.HIGH);
              setDragY(0);
          } else {
              setEnergy(EnergyLevel.LOW);
              setDragY(100);
              // Trigger P.A.T.C.O. suggestion
              setTimeout(() => {
                  setPatcoAlert("Ballast heavy. Signals muted. Shore Leave recommended.");
              }, 1000);
          }
      }
  };

  const handleStartDrag = () => {
      setIsDragging(true);
  };

  const handleInteraction = (e: React.MouseEvent) => {
      // Click jump
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      if (y < 50) setEnergy(EnergyLevel.HIGH);
      else setEnergy(EnergyLevel.LOW);
  }

  // Effect listeners for global mouse up
  useEffect(() => {
      if (isDragging) {
          window.addEventListener('mouseup', handleEndDrag);
          window.addEventListener('touchend', handleEndDrag);
          window.addEventListener('mousemove', handleDrag as any);
          window.addEventListener('touchmove', handleDrag as any);
      }
      return () => {
          window.removeEventListener('mouseup', handleEndDrag);
          window.removeEventListener('touchend', handleEndDrag);
          window.removeEventListener('mousemove', handleDrag as any);
          window.removeEventListener('touchmove', handleDrag as any);
      }
  }, [isDragging, dragY]);

  return (
    <div className="flex flex-col items-center gap-3 group h-56 justify-between py-2 w-full">
        <div className={`text-[10px] font-black uppercase tracking-widest transition-colors font-serif ${dragY < 50 ? 'text-blue-800' : 'text-slate-400 opacity-50'}`}>
            OPEN
        </div>

        {/* The Mounting Plate */}
        <div className="relative flex-1 w-12 bg-stone-200 rounded-lg border border-stone-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] flex justify-center items-center py-2">
            
            {/* Screws */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-stone-400 shadow-sm border border-stone-500"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-stone-400 shadow-sm border border-stone-500"></div>

            {/* The Recessed Track */}
            <div 
                ref={sliderRef}
                className="relative w-3 h-full bg-slate-800 rounded-full overflow-visible cursor-pointer shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] border border-slate-700"
                onMouseDown={handleStartDrag}
                onTouchStart={handleStartDrag}
                onClick={handleInteraction}
                title="Response Ballast: Slide UP for Open, DOWN for Busy"
            >
                {/* Mechanical Slot Marks */}
                <div className="absolute top-[10%] right-full mr-2 w-2 h-px bg-stone-400"></div>
                <div className="absolute top-[30%] right-full mr-2 w-2 h-px bg-stone-300"></div>
                <div className="absolute top-[50%] right-full mr-3 w-3 h-px bg-stone-400"></div>
                <div className="absolute top-[70%] right-full mr-2 w-2 h-px bg-stone-300"></div>
                <div className="absolute top-[90%] right-full mr-2 w-2 h-px bg-stone-400"></div>

                {/* The Brass Lever Handle */}
                <div 
                    className="absolute left-1/2 -translate-x-1/2 w-10 h-16 rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-100 z-10 active:scale-95 group-active:cursor-grabbing border-t border-amber-200"
                    style={{ 
                        top: `calc(${dragY}% - 32px)`,
                        background: 'linear-gradient(135deg, #fcd34d 0%, #b45309 50%, #78350f 100%)', // Rich Brass
                        boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.4)'
                    }}
                >
                    {/* Brass Texture / Grip */}
                    <div className="w-8 h-10 border-x border-amber-900/30 flex flex-col justify-between py-1 px-1 bg-gradient-to-b from-amber-100/10 to-transparent">
                        <div className="w-full h-px bg-amber-900/40 shadow-sm"></div>
                        <div className="w-full h-px bg-amber-900/40 shadow-sm"></div>
                        <div className="w-full h-px bg-amber-900/40 shadow-sm"></div>
                        <div className="w-full h-px bg-amber-900/40 shadow-sm"></div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Label */}
        <div className={`text-[9px] font-black uppercase tracking-widest transition-colors font-serif ${dragY > 50 ? 'text-slate-700' : 'text-slate-400 opacity-50'}`}>
            BUSY
        </div>
    </div>
  );
};
