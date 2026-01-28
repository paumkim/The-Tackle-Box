import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Activity,
  Settings,
  ChevronRight,
  Waves,
  Users,
  Book
} from 'lucide-react';

interface GhostCatchProps {
  history: ViewState[];
  onNavigate: (view: ViewState) => void;
}

const IconMap: Record<ViewState, any> = {
  [ViewState.DASHBOARD]: LayoutDashboard,
  [ViewState.INBOX]: Inbox,
  [ViewState.TASKS]: CheckSquare,
  [ViewState.CALENDAR]: Calendar,
  [ViewState.NOTES]: FileText,
  [ViewState.DEV_JOURNAL]: Activity,
  [ViewState.SETTINGS]: Settings,
  [ViewState.DRIFT_REPORT]: Activity,
  [ViewState.AQUARIUM]: Waves,
  [ViewState.REEF]: Users,
  [ViewState.SHIP_MANIFEST]: Book
};

export const GhostCatch: React.FC<GhostCatchProps> = ({ history, onNavigate }) => {
  if (history.length <= 1) return null;

  const displayHistory = history.slice(-5);

  return (
    <div className="flex items-center gap-1 bg-slate-50/50 px-2 py-1 rounded-full border border-slate-200/50">
      {displayHistory.map((view, index) => {
        const Icon = IconMap[view];
        const isLast = index === displayHistory.length - 1;
        
        return (
          <React.Fragment key={index}>
            <button
              onClick={() => onNavigate(view)}
              className={`
                p-1 rounded-full transition-all
                ${isLast 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                }
              `}
              title={`Go back to ${view}`}
            >
              <Icon className="w-3 h-3" />
            </button>
            {!isLast && <ChevronRight className="w-2 h-2 text-slate-300" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};