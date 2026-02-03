import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store';
import { db } from '../db';
import { Copy, FileText, MessageSquare, ChevronRight, X } from 'lucide-react';

export const ScriptLure: React.FC = () => {
  const isScriptDrawerOpen = useAppStore(state => state.isScriptDrawerOpen);
  const toggleScriptDrawer = useAppStore(state => state.toggleScriptDrawer);
  const scripts = useLiveQuery(() => db.scripts.toArray());
  const [activeTab, setActiveTab] = useState<'scripts' | 'bait'>('scripts');

  if (!isScriptDrawerOpen) return null;

  const templates = scripts?.filter(s => s.type === 'template');
  const teleprompters = scripts?.filter(s => s.type === 'script');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed top-20 right-4 bottom-20 w-80 bg-white shadow-2xl rounded-2xl border border-slate-200 z-[90] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
           <FileText className="w-4 h-4 text-blue-500" />
           The Script Lure
        </h3>
        <button onClick={toggleScriptDrawer} className="text-slate-400 hover:text-slate-600">
           <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-2 border-b border-slate-100">
         <button 
           onClick={() => setActiveTab('scripts')}
           className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'scripts' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
         >
           Call Scripts
         </button>
         <button 
           onClick={() => setActiveTab('bait')}
           className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'bait' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
         >
           SMS Bait
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
         {activeTab === 'scripts' && (
           <div className="space-y-4">
              {teleprompters?.map(script => (
                <div key={script.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <h4 className="font-bold text-slate-700 text-sm mb-2">{script.title}</h4>
                   <p className="text-sm text-slate-600 leading-relaxed font-serif whitespace-pre-wrap">{script.content}</p>
                </div>
              ))}
              {teleprompters?.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">No scripts prepared.</p>}
           </div>
         )}

         {activeTab === 'bait' && (
           <div className="space-y-3">
              {templates?.map(temp => (
                <div key={temp.id} className="group bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => copyToClipboard(temp.content)}>
                   <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-700 text-xs">{temp.title}</h4>
                      <Copy className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
                   </div>
                   <p className="text-xs text-slate-500 line-clamp-2">{temp.content}</p>
                </div>
              ))}
              {templates?.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">No bait prepared.</p>}
           </div>
         )}
      </div>
      
      <div className="p-3 bg-slate-50 rounded-b-2xl border-t border-slate-100 text-center">
         <p className="text-[10px] text-slate-400">Click Bait to Copy</p>
      </div>
    </div>
  );
};