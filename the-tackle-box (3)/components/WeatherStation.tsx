
import React, { useEffect, useRef, useState } from 'react';
import { EnergyLevel } from '../types';
import { Anchor, Battery, BatteryCharging, Cloud, Sun } from 'lucide-react';
import { useAppStore } from '../store';

interface WeatherStationProps {
  energy: EnergyLevel;
  setEnergy: (level: EnergyLevel) => void;
}

export const WeatherStation: React.FC<WeatherStationProps> = ({ energy, setEnergy }) => {
  const setPatcoAlert = useAppStore(state => state.setPatcoAlert);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(energy === EnergyLevel.HIGH ? 100 : 0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
      // Sync internal visual state with prop
      setDragX(energy === EnergyLevel.HIGH ? 100 : 0);
  }, [energy]);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      setDragX(x);
  };

  const handleEndDrag = () => {
      if (isDragging) {
          setIsDragging(false);
          // Snap to closest
          if (dragX > 50) {
              setEnergy(EnergyLevel.HIGH);
              setDragX(100);
          } else {
              setEnergy(EnergyLevel.LOW);
              setDragX(0);
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
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      if (x > 50) setEnergy(EnergyLevel.HIGH);
      else setEnergy(EnergyLevel.LOW);
  }

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
  }, [isDragging, dragX]);

  return (
    <div className="flex flex-col items-end">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Response Ballast</div>
        <div 
            ref={sliderRef}
            className="relative w-32 h-8 flex items-center cursor-pointer group"
            onMouseDown={handleStartDrag}
            onTouchStart={handleStartDrag}
            onClick={handleInteraction}
            title="Slide left for Focus (DND), Right for Available"
        >
            {/* The Graphite Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors"></div>
            
            {/* Markers */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-slate-300"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-slate-300"></div>
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-px h-1.5 bg-slate-200"></div>

            {/* The Weight (Lead) */}
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-slate-500 rounded-full shadow-sm flex items-center justify-center text-slate-600 transition-all duration-75 z-10"
                style={{ left: `calc(${dragX}% - 12px)` }}
            >
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
            </div>
            
            {/* Labels */}
            <div className={`absolute -bottom-4 left-0 text-[9px] font-bold transition-colors ${dragX < 50 ? 'text-slate-600' : 'text-slate-300'}`}>BUSY</div>
            <div className={`absolute -bottom-4 right-0 text-[9px] font-bold transition-colors ${dragX > 50 ? 'text-blue-500' : 'text-slate-300'}`}>OPEN</div>
        </div>
    </div>
  );
};
