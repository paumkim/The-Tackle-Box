
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Search, FileText, CheckSquare, X, Radar, Command, ArrowRight, Image as ImageIcon, Terminal, Users, Radio } from 'lucide-react';
import { Task, Note, Asset, ViewState, Contact } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';

interface SonarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
}

export const Sonar: React.FC<SonarProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{tasks: Task[], notes: Note[], assets: Asset[], contacts: Contact[]}>({ tasks: [], notes: [], assets: [], contacts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isCommand, setIsCommand] = useState(false);

  // Focus Lens: Pending Contacts
  const pendingContacts = useLiveQuery(() => db.contacts.where('signalResponse').equals('PENDING').toArray());

  useEffect(() => {
    // Command Mode Check
    if (query.startsWith('/')) {
        setIsCommand(true);
        return;
    } else {
        setIsCommand(false);
    }

    if (query.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        const lowerQ = query.toLowerCase();
        
        const tasks = await db.tasks
          .filter(t => t.title.toLowerCase().includes(lowerQ))
          .toArray();
          
        const notes = await db.notes
          .filter(n => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ))
          .toArray();
          
        // Scan extracted text (OCR)
        const assets = await db.assets
          .filter(a => a.name.toLowerCase().includes(lowerQ) || (a.extractedText || '').toLowerCase().includes(lowerQ))
          .toArray();

        // Search Contacts (Intelligence)
        const contacts = await db.contacts
          .filter(c => c.name.toLowerCase().includes(lowerQ) || c.company.toLowerCase().includes(lowerQ))
          .toArray();

        setResults({ tasks, notes, assets, contacts });
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults({ tasks: [], notes: [], assets: [], contacts: [] });
    }
  }, [query]);

  // Command Palette Logic
  const commands = [
    { id: 'goto-dashboard', label: '/goto bridge', desc: 'Navigate to Dashboard', view: ViewState.DASHBOARD },
    { id: 'goto-inbox', label: '/trawl', desc: 'Navigate to Inbox', view: ViewState.INBOX },
    { id: 'goto-tasks', label: '/goto deck', desc: 'Navigate to Tasks', view: ViewState.TASKS },
    { id: 'goto-notes', label: '/goto vault', desc: 'Navigate to Notes', view: ViewState.NOTES },
    { id: 'goto-settings', label: '/config', desc: 'Open Settings', view: ViewState.SETTINGS },
  ];

  const filteredCommands = isCommand 
    ? commands.filter(c => c.label.startsWith(query.toLowerCase())) 
    : [];

  const handleCommand = (view: ViewState) => {
    onNavigate(view);
    onClose();
    setQuery('');
  };

  const handleGoToReef = () => {
      onNavigate(ViewState.REEF);
      onClose();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          if (isCommand && filteredCommands.length > 0) {
              handleCommand(filteredCommands[0].view);
          }
      }
      if (e.key === 'Escape') onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center pb-6 px-4 animate-in slide-in-from-bottom-10 duration-300">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Priority Feed: Urgent Signals (Focus Lens) */}
        {!query && pendingContacts && pendingContacts.length > 0 && (
            <div className="bg-[#3B4B5F] p-3 border-b border-slate-600">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <Radio className="w-3 h-3 animate-pulse text-amber-400" />
                        Focus Lens: Urgent Signals
                    </h4>
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600 font-mono">
                        {pendingContacts.length} PENDING
                    </span>
                </div>
                <div className="space-y-2">
                    {pendingContacts.map(contact => (
                        <div 
                            key={contact.id} 
                            onClick={handleGoToReef}
                            className="flex items-center justify-between p-2 rounded bg-slate-700/50 border border-slate-600/50 hover:border-slate-400 hover:bg-slate-700 cursor-pointer transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)] animate-pulse"></div>
                                <span className="text-sm font-bold text-slate-100 font-serif">{contact.name}</span>
                                <span className="text-xs text-slate-400 font-mono opacity-70">{contact.role}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Signal Pending</span>
                                <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Results Area (Grows Upwards) */}
        {(results.tasks.length > 0 || results.notes.length > 0 || results.assets.length > 0 || results.contacts.length > 0 || filteredCommands.length > 0) && (
            <div className="max-h-[60vh] overflow-y-auto border-b border-slate-100 p-2 bg-slate-50/50">
                {/* Command Suggestions */}
                {filteredCommands.map(cmd => (
                    <div 
                        key={cmd.id} 
                        onClick={() => handleCommand(cmd.view)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                            <span className="font-mono font-bold text-slate-700">{cmd.label}</span>
                            <span className="text-xs text-slate-400">{cmd.desc}</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100">ENTER</span>
                    </div>
                ))}

                {/* Normal Search Results */}
                {!isCommand && (
                    <div className="space-y-4 pt-2">
                        {results.contacts.map(c => (
                            <div key={c.id} onClick={handleGoToReef} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 hover:border-blue-300 cursor-pointer">
                                <Users className="w-4 h-4 text-blue-500" />
                                <div>
                                    <div className="text-slate-800 font-bold text-sm">{c.name}</div>
                                    <div className="text-xs text-slate-400">{c.role} @ {c.company}</div>
                                </div>
                            </div>
                        ))}
                        {results.tasks.map(t => (
                            <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 hover:border-blue-300 cursor-pointer">
                                <CheckSquare className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-700 text-sm">{t.title}</span>
                            </div>
                        ))}
                        {results.notes.map(n => (
                            <div key={n.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 hover:border-blue-300 cursor-pointer">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <div>
                                    <div className="text-slate-700 font-medium text-sm">{n.title}</div>
                                    <div className="text-xs text-slate-400 truncate max-w-md">{n.content.substring(0, 60)}...</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Input Bar */}
        <div className="p-4 flex items-center gap-3">
          {isCommand ? (
              <Terminal className="w-5 h-5 text-blue-500 animate-pulse" />
          ) : (
              <Radar className={`w-5 h-5 text-slate-400 ${isSearching ? 'animate-spin' : ''}`} />
          )}
          
          <input 
            autoFocus
            type="text" 
            placeholder="Type / for commands or search..." 
            className="flex-1 text-lg outline-none text-slate-800 placeholder:text-slate-400 bg-transparent font-mono"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold">ESC</span>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
