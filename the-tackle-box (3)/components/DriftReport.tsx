
import React from 'react';
import { Activity, Clock, Target, Calendar, DollarSign, Anchor, ShieldCheck, AlertTriangle, Eye, Lock, Feather, Stamp } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useAppStore } from '../store';
import { WaterBarrel } from './WaterBarrel';

export const DriftReport: React.FC = () => {
  const sessions = useLiveQuery(() => db.sessions.orderBy('startTime').reverse().toArray());
  const auditLogs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const hourlyRate = useAppStore(state => state.hourlyRate);

  const groupedSessions: Record<string, typeof sessions> = {};
  sessions?.forEach(session => {
    const date = new Date(session.startTime).toLocaleDateString();
    if (!groupedSessions[date]) groupedSessions[date] = [];
    groupedSessions[date].push(session);
  });

  const calculateDailyStats = (dailySessions: any[]) => {
      const startTime = dailySessions[dailySessions.length - 1].startTime;
      const endTime = dailySessions[0].endTime || Date.now();
      let totalDurationMs = 0;
      dailySessions.forEach(s => { const end = s.endTime || Date.now(); totalDurationMs += (end - s.startTime); });
      const totalHours = totalDurationMs / (1000 * 60 * 60);
      return { startTime, endTime, totalHours };
  };

  const totalEarlyExits = auditLogs?.filter(l => l.type === 'EARLY_EXIT').length || 0;
  const totalOffline = auditLogs?.filter(l => l.type === 'OFFLINE').length || 0;
  const reliabilityScore = Math.max(0, 100 - (totalEarlyExits * 5) - (totalOffline * 2));
  const safetyChecks = auditLogs?.filter(l => l.type === 'SAFETY_CHECK') || [];
  const totalHoursWorked = sessions?.reduce((acc, s) => { const dur = ((s.endTime || Date.now()) - s.startTime) / (1000 * 60 * 60); return acc + dur; }, 0) || 1;
  const oversightRatio = safetyChecks.length / Math.max(1, totalHoursWorked);
  let oversightStatus = "BALANCED"; let oversightColor = "text-emerald-600";
  if (oversightRatio < 0.2) { oversightStatus = "HIGH TRUST"; oversightColor = "text-blue-600"; }
  if (oversightRatio > 3) { oversightStatus = "HIGH OVERSIGHT"; oversightColor = "text-amber-600"; }

  const generateNarrative = () => {
      if (!tasks || !auditLogs) return "Logbook initializing...";
      const completedCount = tasks.filter(t => t.isCompleted).length;
      const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      let mood = "calm seas"; if (reliabilityScore < 80) mood = "choppy waters"; if (reliabilityScore < 50) mood = "heavy storms";
      return `Captain's Log, Stardate ${date}. We sailed through ${mood} today. The crew successfully hauled ${completedCount} tasks through the Trawl. Vessel reliability stands at ${reliabilityScore}%. ${oversightStatus === 'HIGH TRUST' ? 'Crew operated with minimal intervention.' : 'Bridge maintained active oversight.'}`;
  };

  return (
    <div className="bridge-container-standard">
      <header className="bridge-header-standard">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 font-serif flex items-center gap-2">
                <Activity className="w-6 h-6 text-slate-600" />
                The Logbook
            </h2>
            <p className="text-slate-500 font-serif italic text-sm">Official Ship's Manifest & Duty Roster</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white border border-slate-200 rounded p-2 flex items-center gap-3 shadow-sm h-10">
                <div className="p-1 rounded-full bg-slate-50 text-slate-500"><Eye className="w-4 h-4" /></div>
                <div><div className={`text-[10px] font-bold font-mono ${oversightColor}`}>{oversightStatus}</div></div>
            </div>
            <div className="bg-white border border-slate-200 rounded p-2 flex items-center gap-4 shadow-sm h-10">
                <div className={`p-1 rounded-full ${reliabilityScore > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}><ShieldCheck className="w-4 h-4" /></div>
                <div><div className="text-sm font-bold font-mono">{reliabilityScore}%</div></div>
            </div>
        </div>
      </header>

      <div className="bridge-body-standard overflow-y-auto custom-scrollbar pt-4">
          <div className="mb-8 relative">
              <div className="absolute -top-3 left-6 bg-[#F8F9FA] px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Feather className="w-3 h-3" /> Narrative</div>
              <div className="bg-[#fdfbf7] p-6 border-2 border-dashed border-slate-300 rounded-lg font-serif italic text-slate-700 leading-relaxed shadow-sm">"{generateNarrative()}"</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between"><div><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hydration Level</h4><p className="text-xs text-slate-500">Daily Rations</p></div><WaterBarrel /></div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between"><div><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cargo</h4><p className="text-xs text-slate-500">Tasks Hauled</p></div><div className="text-2xl font-bold text-slate-800">{tasks?.filter(t => t.isCompleted).length || 0}</div></div>
          </div>

          <div className="bg-white rounded-sm border border-[#E0E0E0] shadow-sm overflow-hidden mb-8">
            <div className="bg-[#F8F9FA] border-b border-[#E0E0E0] px-6 py-4 flex items-center gap-4"><Anchor className="w-5 h-5 text-slate-300" /><div><h3 className="font-serif font-bold text-slate-800 uppercase tracking-widest text-xs">Time Sheet</h3><p className="font-mono text-[9px] text-slate-500">RATE: ${hourlyRate}/HR</p></div></div>
            <div className="grid grid-cols-12 border-b border-[#E0E0E0] bg-[#F8F9FA] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="col-span-3 px-6 py-3 border-r border-slate-200">Date</div>
                <div className="col-span-3 px-4 py-3 border-r border-slate-200">Watch</div>
                <div className="col-span-3 px-4 py-3 border-r border-slate-200 text-right">Duration</div>
                <div className="col-span-3 px-6 py-3 text-right">Value</div>
            </div>
            <div className="divide-y divide-slate-100">
                {Object.entries(groupedSessions).map(([date, dailySessions]) => {
                    const stats = calculateDailyStats(dailySessions);
                    return (<div key={date} className="grid grid-cols-12 hover:bg-slate-50 transition-colors group font-mono text-xs text-slate-700"><div className="col-span-3 px-6 py-4 border-r border-slate-50 flex items-center font-bold">{date}</div><div className="col-span-3 px-4 py-4 border-r border-slate-50 flex items-center text-slate-500">{new Date(stats.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {dailySessions[0].endTime ? new Date(stats.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}</div><div className="col-span-3 px-4 py-4 border-r border-slate-50 flex items-center justify-end">{stats.totalHours.toFixed(2)}h</div><div className="col-span-3 px-6 py-4 flex items-center justify-end font-bold text-slate-800">${(stats.totalHours * hourlyRate).toFixed(2)}</div></div>);
                })}
            </div>
            <div className="bg-[#F8F9FA] border-t border-[#E0E0E0] px-6 py-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest"><span className="text-slate-500">Grand Total</span><span className="font-mono text-slate-800 text-base">${(sessions?.reduce((acc, s) => acc + (((s.endTime || Date.now()) - s.startTime) / (1000 * 60 * 60) * hourlyRate), 0) || 0).toFixed(2)}</span></div>
          </div>
      </div>
    </div>
  );
};
