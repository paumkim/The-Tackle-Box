import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Settings,
  Activity,
  Fish,
  LogOut,
  Waves,
  Users
} from 'lucide-react';
import { ViewState, NavItem, DEFAULT_NAV_ITEMS } from '../types';

interface MastProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const IconMap: Record<string, React.FC<any>> = {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  Calendar,
  FileText,
  Activity,
  Settings,
  Waves, // For Aquarium
  Users // For Reef
};

export const Mast: React.FC<MastProps> = ({ currentView, onChangeView }) => {
  return (
    <aside className="w-[60px] flex-shrink-0 bg-slate-900 h-full flex flex-col items-center py-4 z-30 shadow-xl">
      {/* Brand Icon */}
      <div className="mb-8 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
        <Fish className="w-6 h-6 text-white" />
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col gap-4 w-full px-2">
        {DEFAULT_NAV_ITEMS.map((item) => {
          const Icon = IconMap[item.icon];
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`
                group relative w-full aspect-square flex items-center justify-center rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-white/10 text-blue-400 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }
              `}
              title={item.label}
            >
              {Icon ? <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse-glow' : ''}`} /> : <Fish className="w-5 h-5" />}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                {item.label}
              </div>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-4">
        <div className="w-8 h-[1px] bg-slate-800"></div>
        <button className="text-slate-600 hover:text-red-400 transition-colors" title="Lock Vessel">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};