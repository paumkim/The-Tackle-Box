import React from 'react';
import { UserRole } from '../types';
import { Book, Anchor, Zap, Grid, Circle } from 'lucide-react';

interface VesselFlagProps {
  role: UserRole | null;
}

export const VesselFlag: React.FC<VesselFlagProps> = ({ role }) => {
  const getFlagConfig = () => {
    switch(role) {
      case 'STUDENT':
        return {
          color: '#1e3a8a', // Deep Blue
          accent: '#93c5fd', // Light Blue
          icon: Book,
          label: 'The Scholar'
        };
      case 'SALES':
        return {
          color: '#0f766e', // Teal
          accent: '#2dd4bf', // Cyan
          icon: Zap, // Using Zap for "Closer" energy or Anchor hook
          label: 'The Merchant'
        };
      case 'PLANNER':
        return {
          color: '#1e1b4b', // Navy
          accent: '#a5b4fc', // Indigo
          icon: Grid,
          label: 'The Navigator'
        };
      default:
        return {
          color: '#334155', // Slate
          accent: '#94a3b8',
          icon: Anchor,
          label: 'The Voyager'
        };
    }
  };

  const config = getFlagConfig();
  const Icon = config.icon;

  return (
    <div className="relative w-12 h-10 group cursor-help" title={`Vessel Class: ${config.label}`}>
      {/* Flag Pole */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400 rounded-full"></div>
      
      {/* The Flag SVG with Wave Animation */}
      <svg 
        viewBox="0 0 100 80" 
        className="absolute left-1 top-1 w-full h-full drop-shadow-md"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`grad-${role}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={config.color} />
            <stop offset="100%" stopColor={config.color} stopOpacity="0.8" />
          </linearGradient>
          {/* Mesh Gradient Overlay for Depth */}
          <pattern id="mesh" width="10" height="10" patternUnits="userSpaceOnUse">
             <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        
        {/* Rippling Flag Shape */}
        <path 
          d="M0,0 Q25,5 50,0 T100,0 V60 Q75,65 50,60 T0,60 Z" 
          fill={`url(#grad-${role})`}
          className="animate-wave origin-left"
        >
           <animate 
             attributeName="d" 
             dur="2s" 
             repeatCount="indefinite"
             values="
               M0,0 Q25,5 50,0 T100,0 V60 Q75,65 50,60 T0,60 Z;
               M0,0 Q25,-5 50,0 T100,0 V60 Q75,55 50,60 T0,60 Z;
               M0,0 Q25,5 50,0 T100,0 V60 Q75,65 50,60 T0,60 Z
             "
           />
        </path>
        
        {/* Pattern Overlay */}
        <path d="M0,0 Q25,5 50,0 T100,0 V60 Q75,65 50,60 T0,60 Z" fill="url(#mesh)">
           <animate 
             attributeName="d" 
             dur="2s" 
             repeatCount="indefinite"
             values="
               M0,0 Q25,5 50,0 T100,0 V60 Q75,65 50,60 T0,60 Z;
               M0,0 Q25,-5 50,0 T100,0 V60 Q75,55 50,60 T0,60 Z;
               M0,0 Q25,5 50,0 T100,0 V60 Q75,65 50,60 T0,60 Z
             "
           />
        </path>
      </svg>

      {/* Emblem Overlay */}
      <div className="absolute top-3 left-4 text-white/90 drop-shadow-md transform scale-75">
         <Icon className="w-5 h-5" style={{ color: config.accent }} />
      </div>
    </div>
  );
};