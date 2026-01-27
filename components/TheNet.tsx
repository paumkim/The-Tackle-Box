import React, { useState, useEffect } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { db } from '../db';

export const TheNet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  // Global hotkey listener: Ctrl/Cmd + I
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCapture = async () => {
    if (!content.trim()) return;

    await db.notes.add({
      title: `Net Catch ${new Date().toLocaleTimeString()}`,
      content: content,
      folder: 'Inbox',
      updatedAt: Date.now()
    });

    setContent('');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center animate-in fade-in duration-100">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 transform scale-100 animate-in zoom-in-95 duration-100 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            The Net
            <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Quick Capture</span>
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <textarea
          autoFocus
          className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono text-sm"
          placeholder="Paste or type what you've caught..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleCapture();
            }
          }}
        />

        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-slate-400">Press Cmd+Enter to save</span>
          <button 
            onClick={handleCapture}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Secure Catch
          </button>
        </div>
      </div>
    </div>
  );
};