
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

  // Group sessions by Date (YYYY-MM-DD)
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
      dailySessions.forEach(s => {
          const end = s.endTime || Date.now();
          totalDurationMs += (end - s.startTime);
      });

      const totalHours = totalDurationMs / (1000 * 60 * 60);
      return { startTime, endTime, totalHours };
  };

  // Reliability Calculation
  const totalEarlyExits = auditLogs?.filter(l => l.type === 'EARLY_EXIT').length || 0;
  const totalOffline = auditLogs?.filter(l => l.type === 'OFFLINE').length || 0;
  const reliabilityScore = Math.max(0, 100 - (totalEarlyExits * 5) - (totalOffline * 2));

  // Command Balance (Safety Watch Stats)
  const safetyChecks = auditLogs?.filter(l => l.type === 'SAFETY_CHECK') || [];
  const totalHoursWorked = sessions?.reduce((acc, s) => {
      const dur = ((s.endTime || Date.now()) - s.startTime) / (1000 * 60 * 60);
      return acc + dur;
  }, 0) || 1;
  
  const oversightRatio = safetyChecks.length / Math.max(1, totalHoursWorked);
  let oversightStatus = "BALANCED";
  let oversightColor = "text-emerald-600";
  if (oversightRatio < 0.2) { oversightStatus = "HIGH TRUST"; oversightColor = "text-blue-600"; }
  if (oversightRatio > 3) { oversightStatus = "HIGH OVERSIGHT"; oversightColor = "text-amber-600"; }

  // Narrative Generator
  const generateNarrative = () => {
      if (!tasks || !auditLogs) return "Logbook initializing...";
      
      const completedCount = tasks.filter(t => t.isCompleted).length;
      const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      
      let mood = "calm seas";
      if (reliabilityScore < 80) mood = "choppy waters";
      if (reliabilityScore < 50) mood = "heavy storms";

      return `Captain's Log, Stardate ${date}. We sailed through ${mood} today. The crew successfully hauled ${completedCount} tasks through the Trawl. Vessel reliability stands at ${reliabilityScore}%. ${totalEarlyExits > 0 ? `Noted ${totalEarlyExits} early departures for review.` : 'No unauthorized shore leave recorded.'} ${oversightStatus === 'HIGH TRUST' ? 'Crew operated with minimal intervention.' : 'Bridge maintained active oversight.'}`;
  };

  return (
    <div className="max-w-5xl mx-auto h-full overflow-y-auto pb-10 custom-scrollbar">
      <header className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 font-serif">The Logbook</h2>
            <p className="text-slate-500">Official Ship's Manifest & Duty Roster.</p>
        </div>
        
        <div className="flex gap-4">
            {/* Command Balance */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div className="p-3 rounded-full bg-slate-50 text-slate-500">
                    <Eye className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Command Balance</div>
                    <div className={`text-sm font-bold font-mono ${oversightColor}`}>{oversightStatus}</div>
                </div>
            </div>

            {/* Vessel Reliability Scorecard with Seal */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 shadow-sm relative overflow-hidden">
                {/* Ink Stamp Seal */}
                <div className="absolute -right-6 -top-4 opacity-10 transform rotate-12 border-4 border-double border-slate-800 rounded-full w-24 h-24 flex items-center justify-center pointer-events-none">
                    <div className="text-[8px] font-black uppercase text-center leading-tight text-slate-800">
                        OFFICIAL<br/>FLEET<br/>AUDIT
                    </div>
                </div>

                <div className={`p-3 rounded-full ${reliabilityScore > 80 ? 'bg-emerald-100 text-emerald-600' : reliabilityScore > 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vessel Reliability</div>
                    <div className="text-2xl font-bold font-mono">{reliabilityScore}%</div>
                </div>
                <div className="h-8 w-px bg-slate-100 mx-2"></div>
                <div className="flex flex-col text-[10px] text-slate-500 font-mono gap-1 relative z-10">
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> {totalEarlyExits} Early Exits</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-orange-400" /> {totalOffline} Signal Drops</span>
                </div>
            </div>
        </div>
      </header>

      {/* Captain's Narrative Log */}
      <div className="mb-8 relative">
          <div className="absolute -top-3 left-6 bg-[#F8F9FA] px-2 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Feather className="w-3 h-3" /> Captain's Narrative
          </div>
          <div className="bg-[#fdfbf7] p-6 border-2 border-dashed border-slate-300 rounded-lg font-serif italic text-slate-700 leading-relaxed shadow-sm">
              "{generateNarrative()}"
          </div>
      </div>

      {/* Cargo Manifest (Daily Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hydration Level</h4>
                  <p className="text-xs text-slate-500">Daily Water Rations</p>
              </div>
              <WaterBarrel />
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cargo</h4>
                  <p className="text-xs text-slate-500">Tasks Hauled</p>
              </div>
              <div className="text-2xl font-bold text-slate-800">{tasks?.filter(t => t.isCompleted).length || 0}</div>
          </div>
      </div>

      {/* Classic Paper Table Container */}
      <div className="bg-white rounded-sm border border-[#E0E0E0] shadow-sm overflow-hidden mb-8">
        {/* Paper Header */}
        <div className="bg-[#F8F9FA] border-b border-[#E0E0E0] px-6 py-4 flex items-center gap-4">
             <Anchor className="w-5 h-5 text-slate-300" />
             <div>
                 <h3 className="font-serif font-bold text-slate-800 uppercase tracking-widest text-sm">Time Sheet</h3>
                 <p className="font-mono text-[10px] text-slate-500">RATE: ${hourlyRate}/HR</p>
             </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 border-b border-[#E0E0E0] bg-[#F8F9FA] text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3 px-6 py-3 border-r border-slate-200">Date</div>
            <div className="col-span-2 px-4 py-3 border-r border-slate-200">First Watch</div>
            <div className="col-span-2 px-4 py-3 border-r border-slate-200">Anchorage</div>
            <div className="col-span-2 px-4 py-3 border-r border-slate-200 text-right">Duration</div>
            <div className="col-span-3 px-6 py-3 text-right">Voyage Value</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-200">
            {Object.entries(groupedSessions).map(([date, dailySessions]) => {
                const stats = calculateDailyStats(dailySessions);
                const value = stats.totalHours * hourlyRate;
                
                return (
                    <div key={date} className="grid grid-cols-12 hover:bg-yellow-50/20 transition-colors group font-mono text-sm text-slate-700">
                        <div className="col-span-3 px-6 py-4 border-r border-slate-100 flex items-center font-bold">
                            {date}
                        </div>
                        <div className="col-span-2 px-4 py-4 border-r border-slate-100 flex items-center text-slate-500">
                            {new Date(stats.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="col-span-2 px-4 py-4 border-r border-slate-100 flex items-center text-slate-500">
                            {dailySessions[0].endTime ? new Date(stats.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : <span className="text-blue-500 animate-pulse">Active</span>}
                        </div>
                        <div className="col-span-2 px-4 py-4 border-r border-slate-100 flex items-center justify-end">
                            {stats.totalHours.toFixed(2)}h
                        </div>
                        <div className="col-span-3 px-6 py-4 flex items-center justify-end font-bold text-slate-800">
                            ${value.toFixed(2)}
                        </div>
                    </div>
                );
            })}
            
            {(!sessions || sessions.length === 0) && (
                <div className="p-12 text-center text-slate-400 font-serif italic">
                    No voyages recorded in the logbook.
                </div>
            )}
        </div>
        
        {/* Footer Sum */}
        <div className="bg-[#F8F9FA] border-t border-[#E0E0E0] px-6 py-4 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-500 uppercase tracking-widest">Grand Total</span>
            <span className="font-mono font-bold text-slate-800 text-lg flex items-center">
                <span className="text-slate-400 text-sm mr-1">$</span>
                {(sessions?.reduce((acc, s) => {
                    const dur = ((s.endTime || Date.now()) - s.startTime) / (1000 * 60 * 60);
                    return acc + (dur * hourlyRate);
                }, 0) || 0).toFixed(2)}
            </span>
        </div>
      </div>

      {/* Audit Log Table (Private) */}
      <div className="bg-white rounded-sm border border-[#E0E0E0] shadow-sm overflow-hidden opacity-80">
          <div className="bg-[#F8F9FA] border-b border-[#E0E0E0] px-6 py-2 flex justify-between items-center">
             <h3 className="font-serif font-bold text-slate-600 uppercase tracking-widest text-xs flex items-center gap-2">
                 <Lock className="w-3 h-3" /> Captain's Private Log
             </h3>
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs font-mono text-left">
                  <tbody className="divide-y divide-slate-100">
                      {auditLogs?.slice(0, 50).map(log => (
                          <tr key={log.id} className="hover:bg-slate-50">
                              <td className="px-6 py-2 text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className={`px-6 py-2 font-bold ${log.type === 'SAFETY_CHECK' ? 'text-red-700 bg-red-50/50 rounded-sm' : 'text-slate-600'}`}>
                                  {log.type}
                              </td>
                              <td className="px-6 py-2 text-slate-500 truncate max-w-xs">{log.details}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
      
      <div className="mt-6 text-center text-[10px] text-slate-400 font-mono">
          OFFICIAL RECORD • DO NOT REMOVE FROM BRIDGE
      </div>
    </div>
  );
};
