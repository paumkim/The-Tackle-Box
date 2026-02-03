
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { db } from '../db';
import { DepartureReason } from '../types';
import { Clipboard, X, CheckSquare, Anchor, AlertTriangle, Siren, TrendingDown, Mic, MicOff, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';

interface DepartureManifestProps {
  onComplete: () => void;
}

export const DepartureManifest: React.FC<DepartureManifestProps> = ({ onComplete }) => {
  const isDepartureManifestOpen = useAppStore(state => state.isDepartureManifestOpen);
  const setDepartureManifestOpen = useAppStore(state => state.setDepartureManifestOpen);
  
  const [reason, setReason] = useState<DepartureReason | null>(null);
  const [statement, setStatement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-fetch recent drifts for context
  const recentDrifts = useLiveQuery(() => 
    db.auditLogs.where('type').equals('DRIFT').reverse().limit(3).toArray()
  );
  
  // Calculate mock efficiency for audit
  const completedTasks = useLiveQuery(() => db.tasks.where('isCompleted').equals(1).count());
  const totalTasks = useLiveQuery(() => db.tasks.count());
  const cargoHoldItems = useLiveQuery(() => db.assets.where('location').equals('live_well').count());
  
  const efficiency = (totalTasks && totalTasks > 0) ? Math.round(((completedTasks || 0) / totalTasks) * 100) : 0;
  const isUnderperforming = efficiency < 50;

  // Voice Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';
          
          recognitionRef.current.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setStatement(prev => prev + (prev ? ' ' : '') + transcript);
              setIsRecording(false);
          };
          
          recognitionRef.current.onerror = () => {
              setIsRecording(false);
          };
          
          recognitionRef.current.onend = () => {
              setIsRecording(false);
          };
      }
  }, []);

  const toggleVoice = () => {
      if (!recognitionRef.current) {
          alert("Voice logging not supported in this browser.");
          return;
      }
      
      if (isRecording) {
          recognitionRef.current.stop();
      } else {
          setIsRecording(true);
          recognitionRef.current.start();
      }
  };

  const handleSubmit = async () => {
    if ((!reason && !isEmergency) || (!statement.trim() && !isEmergency)) return;
    setIsSubmitting(true);

    const finalReason = isEmergency ? 'EMERGENCY' : reason;
    const finalStatement = isEmergency ? 'EMERGENCY EVACUATION PROTOCOL INITIATED. BYPASSING STANDARD MANIFEST.' : statement;

    // Append Drift Context if relevant
    let fullDetails = finalStatement;
    if (recentDrifts && recentDrifts.length > 0 && !isEmergency) {
        fullDetails += `\n\n[P.A.T.C.O. SYSTEM APPEND]: ${recentDrifts.length} recent drift events detected prior to departure.`;
    }
    
    if (isUnderperforming && !isEmergency) {
        fullDetails += `\n\n[P.A.T.C.O. AUDIT]: Vessel performance rating at ${efficiency}%. Early departure flagged for review.`;
    }
    
    if (cargoHoldItems && cargoHoldItems > 0 && !isEmergency) {
        fullDetails += `\n\n[CARGO AUDIT]: ${cargoHoldItems} items left in The Trawl upon departure.`;
    }

    // Log the early exit for HR
    await db.auditLogs.add({
      type: 'EARLY_EXIT',
      timestamp: Date.now(),
      reasonCode: finalReason as DepartureReason,
      details: fullDetails
    });

    // Also seal it in a bottle automatically
    await db.bottles.add({
        content: `Early Departure (${finalReason}): ${finalStatement}`,
        timestamp: Date.now()
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setDepartureManifestOpen(false); // Close modal
      setReason(null);
      setStatement('');
      setIsEmergency(false);
      onComplete(); // Proceed to Anchor
    }, 1000);
  };

  const cancel = () => {
      setDepartureManifestOpen(false);
      setReason(null);
      setStatement('');
      setIsEmergency(false);
  }

  // Handle ESC key to abort
  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && isDepartureManifestOpen) {
              cancel();
          }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, [isDepartureManifestOpen]);

  if (!isDepartureManifestOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-32 px-4"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Parchment Backdrop */}
        <div className="absolute inset-0 bg-[#f4f1ea]/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply"></div>
        </div>

        <motion.div 
          initial={{ scale: 0.98, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: -10 }}
          className={`relative w-full max-w-lg bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border transition-colors duration-300 flex flex-col z-10 ${isEmergency ? 'border-red-400 ring-4 ring-red-100' : 'border-[#E0E0E0]'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 flex justify-between items-center border-b ${isEmergency ? 'bg-red-50 border-red-200' : 'bg-[#F8F9FA] border-[#E0E0E0]'}`}>
             <div>
                 <h3 className={`font-serif font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${isEmergency ? 'text-red-700' : 'text-slate-800'}`}>
                    {isEmergency ? <Siren className="w-4 h-4 animate-pulse" /> : <Clipboard className="w-4 h-4 text-slate-500" />}
                    {isEmergency ? 'Emergency Evacuation' : 'Departure Manifest'}
                 </h3>
                 <p className="font-mono text-[10px] text-slate-500">FORM HR-004 • EARLY ANCHORAGE</p>
             </div>
             <button 
                onClick={cancel} 
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
                title="Abort & Return to Bridge (ESC)"
             >
                 <X className="w-5 h-5" />
             </button>
          </div>

          <div className="p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
             {/* Emergency Toggle */}
             <div className="flex items-center justify-between bg-white/80 border border-stone-200 p-3 rounded-lg shadow-sm">
                 <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-full ${isEmergency ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                         <AlertTriangle className="w-5 h-5" />
                     </div>
                     <div>
                         <span className="text-xs font-bold text-slate-700 block">Emergency Protocol</span>
                         <span className="text-[10px] text-slate-500">Bypass paperwork for immediate exit.</span>
                     </div>
                 </div>
                 
                 {/* Toggle Switch */}
                 <div 
                    onClick={() => setIsEmergency(!isEmergency)}
                    className={`w-12 h-6 rounded-full flex items-center cursor-pointer transition-colors p-1 ${isEmergency ? 'bg-red-500' : 'bg-slate-200'}`}
                 >
                     <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isEmergency ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </div>
             </div>

             {!isEmergency && (
                 <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6"
                 >
                     <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800 flex items-start gap-2">
                         <Anchor className="w-4 h-4 shrink-0 mt-0.5" />
                         <div>
                             <strong>Watch Incomplete:</strong> You are leaving before the scheduled watch end. This event will be logged for compliance review.
                         </div>
                     </div>
                     
                     {/* P.A.T.C.O. Audit Note */}
                     {isUnderperforming && (
                         <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-800 flex items-start gap-2 font-mono">
                             <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" />
                             <div>
                                 <strong>AUDIT FLAG:</strong> Efficiency is at {efficiency}%. Please provide detailed explanation for low output.
                             </div>
                         </div>
                     )}
                     
                     {/* Cargo Hold Check */}
                     {cargoHoldItems && cargoHoldItems > 0 && (
                         <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800 flex items-start gap-2 font-mono">
                             <Package className="w-4 h-4 shrink-0 mt-0.5" />
                             <div>
                                 <strong>CARGO HOLD:</strong> {cargoHoldItems} crates left in The Trawl. They will be archived to The Depths if not processed.
                             </div>
                         </div>
                     )}

                     {/* Reason Codes */}
                     <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason Code (Mandatory)</label>
                         <div className="grid grid-cols-2 gap-2">
                             {['MEDICAL', 'TECHNICAL', 'PERSONAL', 'COMPLETED_EARLY', 'OTHER'].map((code) => (
                                 <button
                                    key={code}
                                    onClick={() => setReason(code as DepartureReason)}
                                    className={`px-3 py-2 text-xs font-bold border rounded transition-all text-left flex items-center gap-2 ${reason === code ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-stone-200 text-slate-600 hover:border-stone-400'}`}
                                 >
                                     <div className={`w-3 h-3 rounded-full border border-current flex items-center justify-center`}>
                                         {reason === code && <div className="w-1.5 h-1.5 bg-current rounded-full"></div>}
                                     </div>
                                     {code.replace('_', ' ')}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Statement */}
                     <div className="space-y-2 relative">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Captain's Statement</label>
                         <textarea 
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                            className="w-full h-32 p-3 bg-white border border-stone-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-slate-400 text-sm font-serif leading-relaxed placeholder:text-slate-300"
                            placeholder={isUnderperforming ? "Explain performance variance..." : "Explain the reason for early departure..."}
                         />
                         
                         {/* Voice Input Trigger */}
                         <button 
                            onClick={toggleVoice}
                            className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                            title={isRecording ? "Stop Recording" : "Voice Log"}
                         >
                             {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                         </button>
                     </div>
                 </motion.div>
             )}

             <div className="flex justify-end pt-2 gap-3">
                 <button 
                   onClick={cancel}
                   className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider px-4"
                 >
                   Return to Bridge
                 </button>
                 <button 
                   onClick={handleSubmit}
                   disabled={(!reason && !isEmergency) || (!statement.trim() && !isEmergency) || isSubmitting}
                   className={`px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                       isEmergency 
                       ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 shadow-lg' 
                       : 'bg-slate-800 text-white hover:bg-slate-700'
                   }`}
                 >
                   {isSubmitting ? 'Filing...' : (isEmergency ? 'Evacuate Now' : 'Sign & Depart')}
                   {!isSubmitting && <CheckSquare className="w-4 h-4" />}
                 </button>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
