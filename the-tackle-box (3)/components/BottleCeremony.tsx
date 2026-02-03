
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { db } from '../db';
import { ScrollText, Send, X, Anchor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottleCeremonyProps {
  onComplete: () => void;
}

export const BottleCeremony: React.FC<BottleCeremonyProps> = ({ onComplete }) => {
  const isBottleCeremonyOpen = useAppStore(state => state.isBottleCeremonyOpen);
  const setBottleCeremonyOpen = useAppStore(state => state.setBottleCeremonyOpen);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    // Save bottle to DB
    await db.bottles.add({
      content: message,
      timestamp: Date.now()
    });

    // Simulate tossing animation delay
    setTimeout(() => {
      setIsSending(false);
      setBottleCeremonyOpen(false); // Close modal
      setMessage('');
      onComplete(); // Trigger Drop Anchor
    }, 1200);
  };

  const skip = () => {
    setBottleCeremonyOpen(false);
    onComplete();
  };

  if (!isBottleCeremonyOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Parchment Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#f4f1ea]/90 backdrop-blur-sm"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40 mix-blend-multiply"></div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-[#E0E0E0] relative z-10"
        >
          <div className="p-8 text-center bg-[#F8F9FA] border-b border-[#E0E0E0] relative">
             <div className="w-16 h-16 bg-white border border-stone-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-sm">
               <Anchor className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">Seal the Day</h2>
             <p className="text-slate-500 text-sm max-w-sm mx-auto font-serif italic">
               Before you drop anchor, cast one thought into the deep. Vent your stress or mark a victory.
             </p>
             <button onClick={skip} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500">
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="p-8 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
             <div className="relative">
                <textarea 
                  autoFocus
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 p-4 bg-white border border-stone-200 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-400 font-serif text-slate-700 text-lg leading-relaxed placeholder:text-slate-300 italic shadow-inner"
                  placeholder="Today, I..."
                />
                <ScrollText className="absolute bottom-4 right-4 w-5 h-5 text-slate-200 pointer-events-none" />
             </div>

             <button 
               onClick={handleSubmit}
               disabled={!message.trim() || isSending}
               className="w-full mt-6 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg"
             >
               {isSending ? 'Sealing Bottle...' : 'Cast into the Deep'}
               {!isSending && <Send className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />}
             </button>
             
             <div className="text-center mt-4">
                <button onClick={skip} className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider">
                  Skip Ceremony
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
