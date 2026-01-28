
import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store';
import { ViewState } from '../types';
import { 
  Compass, 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  RefreshCw, 
  Search, 
  Copy, 
  Save,
  LogOut,
  Terminal,
  Radar
} from 'lucide-react';
import { db } from '../db';
import { NotificationManager } from '../utils/notifications';

export const GlobalContextMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const requestNavigation = useAppStore(state => state.requestNavigation);
  const isSonarOpen = useAppStore(state => state.isSonarOpen);
  const setSonarOpen = useAppStore(state => state.setSonarOpen);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // If default is already prevented (e.g. by Aquarium internal menu), respect it and do nothing
      if (e.defaultPrevented) return; 

      e.preventDefault();
      
      const text = window.getSelection()?.toString() || '';
      setSelection(text);
      
      // Calculate position to keep menu on screen
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 300);
      
      setPosition({ x, y });
      setVisible(true);
    };

    const handleClick = () => setVisible(false);
    const handleScroll = () => setVisible(false);

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { capture: true });
    
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    }
  }, []);

  if (!visible) return null;

  const handleCopy = () => {
      navigator.clipboard.writeText(selection);
      setVisible(false);
  }

  const handleLogSelection = async () => {
      await db.notes.add({
          title: `Clipped: ${selection.substring(0, 20)}...`,
          content: selection,
          folder: 'Inbox',
          updatedAt: Date.now(),
          depth: 'Surface',
          tags: ['clip']
      });
      NotificationManager.send("Log Captured", "Selection saved to Vault.");
      setVisible(false);
  }

  return (
    <div 
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className="fixed z-[9999] w-60 bg-[#fdfbf7] border border-amber-900/20 rounded-sm shadow-2xl py-1 text-slate-800 font-serif text-sm animate-in fade-in zoom-in-95 duration-75 origin-top-left"
    >
        {/* Paper Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
        
        <div className="relative z-10">
            {selection ? (
                <>
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-amber-900/10 mb-1">
                        Text Operations
                    </div>
                    <button onClick={handleCopy} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                        <Copy className="w-4 h-4 text-slate-500" /> Copy Text
                    </button>
                    <button onClick={handleLogSelection} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                        <Save className="w-4 h-4 text-slate-500" /> Log to Archive
                    </button>
                    <div className="h-px bg-amber-900/10 my-1 mx-2"></div>
                </>
            ) : (
                <>
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-amber-900/10 mb-1">
                        Bridge Command
                    </div>
                    <button onClick={() => requestNavigation(ViewState.DASHBOARD)} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                        <LayoutDashboard className="w-4 h-4 text-blue-600" /> Go to Bridge
                    </button>
                    <button onClick={() => requestNavigation(ViewState.TASKS)} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                        <CheckSquare className="w-4 h-4 text-emerald-600" /> Go to Deck
                    </button>
                    <button onClick={() => requestNavigation(ViewState.NOTES)} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                        <FileText className="w-4 h-4 text-amber-600" /> Go to Vault
                    </button>
                    
                    <div className="h-px bg-amber-900/10 my-1 mx-2"></div>
                    
                    <button onClick={() => setSonarOpen(!isSonarOpen)} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                        <Radar className="w-4 h-4 text-purple-500" /> Toggle Sonar
                    </button>
                </>
            )}

            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-b border-amber-900/10 my-1 bg-amber-50/30">
                System
            </div>
            <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                <RefreshCw className="w-4 h-4 text-slate-400" /> Refresh Vessel
            </button>
             <button onClick={() => console.log('System Status: Nominal')} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs text-slate-700">
                <Terminal className="w-4 h-4 text-slate-400" /> System Status
            </button>
        </div>
    </div>
  );
};
