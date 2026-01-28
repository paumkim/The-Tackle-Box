
import React from 'react';
import { Terminal, Bug, Cpu, Layers } from 'lucide-react';

export const DevJournal: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto pb-10 px-6 py-6">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
          <Terminal className="w-6 h-6 mr-3 text-slate-600" />
          Developer Journal
        </h2>
        <p className="text-slate-500 mt-2">System blueprints and architectural decisions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Latest Entry */}
        <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6">
           <h3 className="font-bold text-slate-800 mb-2">Entry 012: The Communication Bridge</h3>
           <div className="text-sm font-mono text-slate-600 space-y-2">
             <p><span className="text-blue-600">Challenge:</span> Web browsers cannot 'record' cell phone calls natively for privacy.</p>
             <p><span className="text-purple-600">Solution:</span> We are building a 'Manual Logger.' When the user clicks the Call button, the app starts a 'Note Session' automatically to record the user's manual inputs.</p>
             <p><span className="text-emerald-600">Feature:</span> 'The Buoy' window now pulses during calls, providing a dedicated space for quick logs without leaving the current view.</p>
           </div>
         </div>

         <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6 opacity-75">
           <h3 className="font-bold text-slate-800 mb-2">Entry 008: The Aquarium Shift</h3>
           <div className="text-sm font-mono text-slate-600 space-y-2">
             <p><span className="text-blue-600">Plan:</span> Moving away from "forced" interaction. The user is now a "Quiet Observer" and active worker.</p>
             <p><span className="text-purple-600">Design Goal:</span> Making the file manager feel "fluid." Using AnimatePresence from Framer Motion so when a file is moved, it "swims" to its new folder location.</p>
             <p><span className="text-red-500">Tangled Line:</span> Working on browser memory limits for large video files stored in IndexedDB. Will implement a "Warning Flare" if the database exceeds 2GB.</p>
           </div>
         </div>
         
         <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6 opacity-50">
           <h3 className="font-bold text-slate-800 mb-2">Entry 001: The Launch Sequence</h3>
           <div className="text-sm font-mono text-slate-600 space-y-2">
             <p><span className="text-blue-600">Status:</span> Stable Hull (Database Initialized).</p>
             <p><span className="text-red-500">Tangled Lines (Bugs):</span> Sidebar "ghosting" when snapping on ultra-wide monitors.</p>
             <p><span className="text-emerald-600">Next Milestone:</span> Integrating the "Sonar" search logic for deep note-parsing.</p>
           </div>
         </div>

        {/* Architecture */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-blue-500" />
            Current Architecture
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded mr-2 mt-0.5">Core</span>
              React 18 SPA
            </li>
            <li className="flex items-start">
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded mr-2 mt-0.5">Data</span>
              IndexedDB via Dexie.js (Blob Support Active)
            </li>
            <li className="flex items-start">
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded mr-2 mt-0.5">Vis</span>
              Tailwind CSS + Glassmorphism
            </li>
          </ul>
        </div>

        {/* Known Bugs */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center relative z-10">
            <Bug className="w-5 h-5 mr-2 text-red-500" />
            Tangled Lines (Known Issues)
          </h3>
          <ul className="space-y-4 text-sm text-slate-600 relative z-10">
            <li id="bug-calendar-dnd" className="group border-l-2 border-red-200 pl-3 hover:bg-red-50/50 transition-colors p-2 rounded-r">
              <div className="flex items-center justify-between font-medium text-red-900">
                <span>Calendar Drag-n-Drop</span>
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">High</span>
              </div>
              <p className="mt-1 text-slate-500 text-xs">Dragging tasks between dates causes state desync in grid view. Needs comprehensive refactor of the grid layout engine.</p>
            </li>
            <li id="bug-md-preview" className="group border-l-2 border-blue-200 pl-3 hover:bg-blue-50/50 transition-colors p-2 rounded-r">
              <div className="flex items-center justify-between font-medium text-blue-900">
                <span>Markdown Preview</span>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">Low</span>
              </div>
              <p className="mt-1 text-slate-500 text-xs">Raw text only. Syntax highlighting library was deemed too heavy for the initial 'lite' bundle.</p>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};
