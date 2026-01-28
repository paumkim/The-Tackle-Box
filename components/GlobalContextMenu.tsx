
import React, { useEffect, useRef } from 'react';
import { useAppStore, ContextMenuItem } from '../store';
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
  Radar,
  FolderOpen,
  FolderPlus,
  Upload,
  ExternalLink,
  ArrowUpRight,
  Archive,
  Trash2
} from 'lucide-react';
import { db } from '../db';
import { NotificationManager } from '../utils/notifications';

const IconMap: Record<string, React.FC<any>> = {
    Compass, LayoutDashboard, CheckSquare, FileText, RefreshCw, Search, Copy, Save, LogOut, Terminal, Radar,
    FolderOpen, FolderPlus, Upload, ExternalLink, ArrowUpRight, Archive, Trash2
};

export const GlobalContextMenu: React.FC = () => {
  const contextMenu = useAppStore(state => state.contextMenu);
  const openContextMenu = useAppStore(state => state.openContextMenu);
  const closeContextMenu = useAppStore(state => state.closeContextMenu);
  const requestNavigation = useAppStore(state => state.requestNavigation);
  const isSonarOpen = useAppStore(state => state.isSonarOpen);
  const setSonarOpen = useAppStore(state => state.setSonarOpen);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Global Listener for Default "Bridge" Menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // If defaultPrevented, it means a specific component (like Aquarium) handled it.
      if (e.defaultPrevented) return; 
      e.preventDefault();
      
      const selection = window.getSelection()?.toString() || '';
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 300);

      if (selection) {
          openContextMenu({
              x, y,
              header: 'Text Operations',
              items: [
                  { label: 'Copy Text', action: () => navigator.clipboard.writeText(selection), icon: 'Copy' },
                  { 
                      label: 'Log to Archive', 
                      action: async () => {
                          await db.notes.add({
                              title: `Clipped: ${selection.substring(0, 20)}...`,
                              content: selection,
                              folder: 'Inbox',
                              updatedAt: Date.now(),
                              depth: 'Surface',
                              tags: ['clip']
                          });
                          NotificationManager.send("Log Captured", "Selection saved to Vault.");
                      }, 
                      icon: 'Save' 
                  }
              ]
          });
      } else {
          // Default Bridge Menu - Navigator Terminal Standard
          openContextMenu({
              x, y,
              header: 'Bridge Command',
              items: [
                  { label: 'Go to Bridge', action: () => requestNavigation(ViewState.DASHBOARD), icon: 'LayoutDashboard' },
                  { label: 'Go to Deck', action: () => requestNavigation(ViewState.TASKS), icon: 'CheckSquare' },
                  { label: 'Go to Vault', action: () => requestNavigation(ViewState.NOTES), icon: 'FileText' },
                  { type: 'SEPARATOR', label: '', action: () => {} },
                  { label: 'Toggle Sonar', action: () => setSonarOpen(!isSonarOpen), icon: 'Radar' },
                  { type: 'HEADER', label: 'System', action: () => {} },
                  { label: 'Refresh Vessel', action: () => window.location.reload(), icon: 'RefreshCw' },
                  { label: 'System Status', action: () => console.log('System Status: Nominal'), icon: 'Terminal' }
              ]
          });
      }
    };

    const handleClick = () => closeContextMenu();
    const handleScroll = () => closeContextMenu();

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { capture: true });
    
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    }
  }, [openContextMenu, closeContextMenu, requestNavigation, isSonarOpen, setSonarOpen]);

  if (!contextMenu.isOpen) return null;

  return (
    <div 
      ref={menuRef}
      style={{ top: contextMenu.y, left: contextMenu.x }}
      className="fixed z-[9999] w-60 bg-[#fdfbf7] border border-amber-900/20 rounded-sm shadow-2xl py-1 text-slate-800 font-serif text-sm animate-in fade-in zoom-in-95 duration-75 origin-top-left"
      onClick={(e) => e.stopPropagation()}
    >
        {/* Paper Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
        
        <div className="relative z-10">
            {contextMenu.header && (
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-amber-900/10 mb-1">
                    {contextMenu.header}
                </div>
            )}

            {contextMenu.items.map((item, index) => {
                if (item.type === 'SEPARATOR') {
                    return <div key={index} className="h-px bg-amber-900/10 my-1 mx-2"></div>;
                }
                if (item.type === 'HEADER') {
                    return (
                        <div key={index} className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-b border-amber-900/10 my-1 bg-amber-50/30">
                            {item.label}
                        </div>
                    );
                }

                const Icon = item.icon ? IconMap[item.icon] : undefined;
                return (
                    <button 
                        key={index} 
                        onClick={() => { item.action(); closeContextMenu(); }} 
                        className={`w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-3 font-bold text-xs ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'}`}
                    >
                        {Icon && <Icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : 'text-slate-500'}`} />}
                        {item.label}
                    </button>
                );
            })}
        </div>
    </div>
  );
};
