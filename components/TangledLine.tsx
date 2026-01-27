import React from 'react';
import { Bug } from 'lucide-react';

interface TangledLineProps {
  children: React.ReactNode;
  isActive: boolean;
  bugId?: string;
  description?: string;
  onInspect: (id: string) => void;
}

export const TangledLine: React.FC<TangledLineProps> = ({ 
  children, 
  isActive, 
  bugId, 
  description,
  onInspect 
}) => {
  if (!isActive) return <>{children}</>;

  return (
    <div className="relative group">
      {/* The component being wrapped */}
      <div className="relative z-0 ring-2 ring-red-400/30 rounded-xl bg-red-50/10">
        {children}
      </div>

      {/* The Tangled Line Indicator */}
      <div className="absolute -top-2 -right-2 z-20">
        <button
          onClick={() => bugId && onInspect(bugId)}
          className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform animate-pulse cursor-pointer"
          title={description || "Known Issue"}
        >
          <Bug className="w-3 h-3" />
        </button>
      </div>

      {/* Hover Description Tooltip */}
      <div className="absolute top-0 right-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-red-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {description || "Feature Tangled"}
        </div>
      </div>
    </div>
  );
};