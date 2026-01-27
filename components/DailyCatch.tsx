
import React, { useState } from 'react';
import { Fish, CheckCircle2, ArrowRight } from 'lucide-react';

interface DailyCatchProps {
  onComplete: (priorities: string[]) => void;
}

export const DailyCatch: React.FC<DailyCatchProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [priorities, setPriorities] = useState(['', '', '']);

  const handleInput = (index: number, value: string) => {
    const newP = [...priorities];
    newP[index] = value;
    setPriorities(newP);
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else onComplete(priorities);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Parchment Background */}
      <div className="absolute inset-0 bg-[#F8F9FA] opacity-98">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white border-2 border-stone-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
             <Fish className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-slate-800 mb-3">The Daily Catch</h2>
          <p className="text-slate-500 font-serif italic text-lg">Before you sail, what must be caught?</p>
        </div>

        <div className="space-y-8">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`transition-all duration-500 ${
                i === step ? 'opacity-100 translate-x-0' : 
                i < step ? 'opacity-40 -translate-x-4 grayscale' : 'opacity-20 translate-x-4'
              }`}
            >
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Big Fish #{i + 1}
              </label>
              <input
                autoFocus={i === step}
                type="text"
                value={priorities[i]}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                disabled={i !== step}
                className={`w-full bg-transparent border-b-2 text-2xl py-2 px-1 focus:outline-none transition-colors font-serif ${
                  i === step ? 'border-slate-800 text-slate-800 placeholder:text-slate-300' : 'border-slate-200 text-slate-400'
                }`}
                placeholder="Name the objective..."
              />
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-end">
          <button
            onClick={next}
            disabled={!priorities[step].trim()}
            className="group flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {step === 2 ? 'Cast Off' : 'Next Fish'}
            {step === 2 ? <CheckCircle2 className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      </div>
    </div>
  );
};
