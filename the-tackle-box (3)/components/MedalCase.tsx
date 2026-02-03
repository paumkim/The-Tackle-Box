
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Award, Shield, Anchor, Star, Droplets, Zap } from 'lucide-react';
import { Achievement } from '../types';

const IconMap: Record<string, any> = {
    Badge: Shield,
    Anchor: Anchor,
    Star: Star,
    Droplets: Droplets,
    Zap: Zap
};

export const MedalCase: React.FC = () => {
  const achievements = useLiveQuery(() => db.achievements.toArray());

  const getTierColor = (tier: Achievement['tier']) => {
      switch(tier) {
          case 'BRONZE': return 'text-amber-700 bg-amber-100 border-amber-200';
          case 'SILVER': return 'text-slate-500 bg-slate-100 border-slate-300';
          case 'GOLD': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
          case 'PLATINUM': return 'text-cyan-600 bg-cyan-100 border-cyan-200';
          default: return 'text-slate-500 bg-slate-50';
      }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-[#E0E0E0] h-full overflow-y-auto">
        <header className="mb-6 flex items-center gap-3 border-b border-stone-200 pb-4">
            <div className="p-3 bg-yellow-50 rounded-full text-yellow-600 border border-yellow-100">
                <Award className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-serif font-bold text-slate-800">Admiral's Commendations</h2>
                <p className="text-sm text-slate-500">Service record and honors.</p>
            </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements?.map(medal => {
                const Icon = IconMap[medal.icon] || Award;
                const style = getTierColor(medal.tier);
                
                return (
                    <div key={medal.id} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-transform hover:scale-105 bg-white`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm ${style}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">{medal.title}</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-tight">{medal.description}</p>
                        </div>
                        <span className="text-[9px] uppercase font-mono text-slate-400 mt-auto pt-2">
                            {new Date(medal.unlockedAt).toLocaleDateString()}
                        </span>
                    </div>
                )
            })}
            
            {(!achievements || achievements.length === 0) && (
                <div className="col-span-full py-12 text-center text-slate-400 italic font-serif">
                    No medals awarded yet. Keep sailing.
                </div>
            )}
        </div>
    </div>
  );
};
