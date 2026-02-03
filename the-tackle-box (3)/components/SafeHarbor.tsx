
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { db } from '../db';
import { Anchor, CheckCircle2, DollarSign, Clock, Building2, ScrollText, PenTool, Stamp, LogOut, Package, Clipboard, Droplets, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';

export const SafeHarbor: React.FC = () => {
  const safeHarborOpen = useAppStore(state => state.safeHarborOpen);
  const setSafeHarborOpen = useAppStore(state => state.setSafeHarborOpen);
  const lastVoyageStats = useAppStore(state => state.lastVoyageStats);
  const hqName = useAppStore(state => state.hqName);
  const userRole = useAppStore(state => state.userRole);
  const waterCount = useAppStore(state => state.waterCount);
  
  const [efficiency, setEfficiency] = useState(0);
  const [bottleMessage, setBottleMessage] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [signatureTime, setSignatureTime] = useState<string | null>(null);

  // Shore Leave Timer (Decorative)
  const [restTime, setRestTime] = useState(14 * 60 * 60);

  useEffect(() => {
      const interval = setInterval(() => {
          setRestTime(t => Math.max(0, t - 1));
      }, 1000);
      return () => clearInterval(interval);
  }, []);

  // Calculate stats on open
  useEffect(() => {
      if (safeHarborOpen && lastVoyageStats) {
          // Simple efficiency calc: Items / Hours * Multiplier. Cap at 100%.
          const hours = Math.max(0.1, lastVoyageStats.duration / 3600);
          const rawScore = (lastVoyageStats.itemsCaught / hours) * 20; 
          setEfficiency(Math.min(100, Math.round(rawScore)));
          
          setIsSigned(false);
          setBottleMessage('');
          setSignatureTime(null);
      }
  }, [safeHarborOpen, lastVoyageStats]);

  const handleSign = async () => {
      if (!isSigned) {
          setIsSigned(true);
          const now = new Date();
          setSignatureTime(now.toLocaleString());
          
          // Log Final Audit
          await db.auditLogs.add({
              type: 'SECURITY',
              timestamp: Date.now(),
              details: 'VOYAGE_COMPLETE: Captain signed off.'
          });

          // Update Session if we can identify it (usually the last closed one)
          const lastSession = await db.sessions.orderBy('endTime').reverse().first();
          if (lastSession) {
              await db.sessions.update(lastSession.id!, { 
                  signedAt: Date.now(),
                  efficiency: efficiency
              });
          }

          // Save bottle if written
          if (bottleMessage.trim()) {
              await db.bottles.add({
                  content: bottleMessage,
                  timestamp: Date.now()
              });
          }
      }
  };

  const handleDisembark = () => {
      setSafeHarborOpen(false);
      // Here you could redirect to a "Sleep Mode" or just reset the app state visually
  };

  const formatRest = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
  };

  if (!safeHarborOpen || !lastVoyageStats) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop: Warm Paper/Sunset Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#f8f5f2]/95 backdrop-blur-xl"
        >
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-orange-100/30 to-slate-200/50 pointer-events-none"></div>
        </motion.div>

        {/* Arrival Document */}
        <motion.div 
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
           {/* Header */}
           <div className="bg-[#F8F9FA] p-6 border-b border-[#E0E0E0] flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg">
                     <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                      <h2 className="text-xl font-serif font-bold text-slate-800">Arrival Document</h2>
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                          PORT: {hqName.split(',')[0]}
                      </p>
                  </div>
              </div>
              <div className="text-right">
                  <div className="text-3xl font-bold text-slate-800">{efficiency}%</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Efficiency Rating</div>
              </div>
           </div>

           <div className="p-8 space-y-8">
              
              {/* Mission Tally */}
              <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Mission Tally
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-stone-200 text-center">
                          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                          <div className="text-xl font-bold text-slate-700">{(lastVoyageStats.duration / 3600).toFixed(1)}h</div>
                          <div className="text-[10px] text-slate-400 uppercase">Total Focus</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-stone-200 text-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                          <div className="text-xl font-bold text-slate-700">{lastVoyageStats.itemsCaught}</div>
                          <div className="text-[10px] text-slate-400 uppercase">Items Caught</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-stone-200 text-center">
                          <DollarSign className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                          <div className="text-xl font-bold text-slate-700">${lastVoyageStats.earnings.toFixed(0)}</div>
                          <div className="text-[10px] text-slate-400 uppercase">Voyage Value</div>
                      </div>
                  </div>
              </section>

              {/* Cargo Manifest (Daily Summary) */}
              <section className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clipboard className="w-4 h-4" /> Cargo Manifest (Daily Summary)
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                          <span className="text-slate-500 flex items-center gap-2"><Package className="w-3 h-3" /> Tasks Completed</span>
                          <span className="font-bold text-slate-700">{lastVoyageStats.itemsCaught}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                          <span className="text-slate-500 flex items-center gap-2"><Droplets className="w-3 h-3 text-blue-400" /> Hydration</span>
                          <span className="font-bold text-slate-700">{waterCount} Glasses</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                          <span className="text-slate-500 flex items-center gap-2"><Radio className="w-3 h-3" /> Signals</span>
                          <span className="font-bold text-slate-700">All Clear</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                          <span className="text-slate-500 flex items-center gap-2"><Anchor className="w-3 h-3" /> Status</span>
                          <span className="font-bold text-emerald-600">Docked</span>
                      </div>
                  </div>
              </section>

              <div className="w-full h-px bg-stone-200"></div>

              {/* The Bottle */}
              <section className="relative">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ScrollText className="w-4 h-4" /> The Bottle (Reflection)
                  </h3>
                  <div className="relative">
                      <textarea 
                        value={bottleMessage}
                        onChange={(e) => setBottleMessage(e.target.value)}
                        disabled={isSigned}
                        className="w-full h-24 p-4 bg-[#fcfbf9] border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-stone-300 font-serif italic text-slate-600 placeholder:text-slate-300 disabled:opacity-70 disabled:bg-stone-100"
                        placeholder="Leave a message for your future self..."
                      />
                      <PenTool className="absolute bottom-4 right-4 w-4 h-4 text-stone-300 pointer-events-none" />
                  </div>
              </section>

              <div className="w-full h-px bg-stone-200"></div>

              {/* Signature & Audit */}
              <section className="flex flex-col md:flex-row gap-6 items-end justify-between">
                  <div className="flex-1 w-full">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Captain's Signature</h3>
                      <div 
                        onClick={handleSign}
                        className={`
                            h-20 border-b-2 border-stone-400 bg-[#f9f7f2] flex items-center justify-center cursor-pointer transition-all relative group
                            ${isSigned ? 'cursor-default' : 'hover:bg-[#f0ece5]'}
                        `}
                      >
                          {!isSigned && (
                              <span className="text-stone-400 text-sm font-serif italic group-hover:scale-105 transition-transform">
                                  Click to Sign Logbook
                              </span>
                          )}
                          {isSigned && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                className="font-handwriting text-2xl text-blue-900 font-bold font-serif italic"
                              >
                                  {userRole || 'Captain'}
                              </motion.div>
                          )}
                          
                          {/* Stamp Animation */}
                          {isSigned && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 2, rotate: 10 }}
                                animate={{ opacity: 0.2, scale: 1, rotate: -15 }}
                                className="absolute right-4 top-2 text-red-600 border-4 border-red-600 rounded-full p-2 w-24 h-24 flex items-center justify-center"
                              >
                                  <div className="text-xs font-black uppercase text-center leading-tight">
                                      OFFICIAL<br/>HR AUDIT<br/>CLEARED
                                  </div>
                              </motion.div>
                          )}
                      </div>
                      {signatureTime && (
                          <p className="text-[9px] font-mono text-stone-400 mt-1">
                              SIGNED: {signatureTime}
                          </p>
                      )}
                  </div>

                  <div className="shrink-0">
                      <button 
                        onClick={handleDisembark}
                        disabled={!isSigned}
                        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <LogOut className="w-4 h-4" /> Shore Leave
                      </button>
                  </div>
              </section>

           </div>
           
           {/* Footer */}
           <div className="bg-stone-100 p-3 text-center border-t border-stone-200">
               <p className="text-[10px] text-stone-500 font-mono">
                   SYSTEMS POWERING DOWN... ENJOY YOUR REST.
               </p>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
