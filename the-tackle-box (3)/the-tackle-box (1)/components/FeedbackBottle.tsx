import React, { useState } from 'react';
import { MessageSquare, X, Send, Bug, Lightbulb, PenTool } from 'lucide-react';
import { db } from '../db';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackBottleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackBottle: React.FC<FeedbackBottleProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'BUG' | 'FEATURE' | 'GENERAL'>('GENERAL');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSending(true);

    const browserInfo = `${navigator.userAgent} | Screen: ${window.screen.width}x${window.screen.height}`;

    await db.feedback.add({
      type,
      content,
      browserInfo,
      timestamp: Date.now()
    });

    setTimeout(() => {
      setIsSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setContent('');
        onClose();
      }, 2000);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex justify-between items-center">
          <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Message in a Bottle
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-full text-blue-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-bold text-slate-800">Message Cast!</h4>
              <p className="text-slate-500 text-sm mt-1">The Captain will review your log.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setType('BUG')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${type === 'BUG' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                >
                  <Bug className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">Tangled Line</span>
                </button>
                <button 
                  onClick={() => setType('FEATURE')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${type === 'FEATURE' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                >
                  <Lightbulb className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">New Lure</span>
                </button>
                <button 
                  onClick={() => setType('GENERAL')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${type === 'GENERAL' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                >
                  <PenTool className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">Captain's Log</span>
                </button>
              </div>

              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-sm"
                placeholder={type === 'BUG' ? "Describe the glitch..." : type === 'FEATURE' ? "What should we build next?" : "Tell us about your voyage..."}
              />

              <button 
                onClick={handleSubmit}
                disabled={isSending || !content.trim()}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? 'Casting...' : 'Cast Into Sea'}
                {!isSending && <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};