
import React from 'react';
import { Terminal, Bug, Cpu, Layers } from 'lucide-react';

export const DevJournal: React.FC = () => {
  return (
    <div className="bridge-container-standard">
      <header className="bridge-header-standard">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
            <Terminal className="w-6 h-6 text-slate-600" />
            Developer Journal
          </h2>
          <p className="text-slate-500 font-serif italic text-sm">System blueprints and architectural decisions.</p>
        </div>
        <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest border border-slate-200">Hull Stable</div>
        </div>
      </header>

      <div className="bridge-body-standard overflow-y-auto custom-scrollbar pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-800 mb-2 font-serif">Entry 012: The Communication Bridge</h3>
                <div className="text-xs font-mono text-slate-600 space-y-2">
                    <p><span className="text-blue-600">Challenge:</span> Browsers cannot record phone calls natively for privacy.</p>
                    <p><span className="text-purple-600">Solution:</span> Built a 'Manual Logger' session recorder.</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-sm font-serif font-bold text-slate-800 mb-4 flex items-center"><Layers className="w-4 h-4 mr-2 text-blue-500" />Architecture</h3><ul className="space-y-3 text-xs text-slate-600 font-mono"><li className="flex items-start"><span className="bg-slate-100 px-1.5 py-0.5 rounded mr-2 uppercase">Core</span>React 18 SPA</li><li className="flex items-start"><span className="bg-slate-100 px-1.5 py-0.5 rounded mr-2 uppercase">Data</span>IndexedDB / Dexie</li></ul></div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"><h3 className="text-sm font-serif font-bold text-slate-800 mb-4 flex items-center"><Bug className="w-4 h-4 mr-2 text-red-500" />Tangled Lines</h3><ul className="space-y-4 text-[10px] text-slate-500 font-mono uppercase tracking-tight"><li className="border-l-2 border-red-200 pl-3">Calendar Drag-n-Drop<br/><span className="text-slate-300">Status: Refactoring Layout Engine</span></li></ul></div>
        </div>
      </div>
    </div>
  );
};
