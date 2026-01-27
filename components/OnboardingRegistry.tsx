import React, { useState } from 'react';
import { UserRole } from '../types';
import { useAppStore } from '../store';
import { GraduationCap, Briefcase, Map, CheckCircle2, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

export const OnboardingRegistry: React.FC = () => {
  const setUserRole = useAppStore(state => state.setUserRole);
  const setHasOnboarded = useAppStore(state => state.setHasOnboarded);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleConfirm = () => {
    if (selectedRole) {
      setUserRole(selectedRole);
      setHasOnboarded(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-[200] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Left: Manifesto */}
        <div className="w-full md:w-1/3 bg-slate-100 p-8 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="relative z-10">
             <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Anchor className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Aboard.</h1>
             <p className="text-slate-500 text-sm leading-relaxed">
               The Tackle Box is an adaptive vessel. To outfit your ship correctly, we need to know your mission.
             </p>
           </div>
           <div className="relative z-10 mt-8">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">REGISTRY LOG</p>
             <p className="text-xs font-mono text-slate-500">SESSION ID: {Date.now().toString().slice(-6)}</p>
           </div>
        </div>

        {/* Right: Selection */}
        <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col">
           <h2 className="text-xl font-bold text-slate-800 mb-6">Choose Your Vessel Class</h2>
           
           <div className="space-y-4 flex-1">
             <RoleOption 
               role="STUDENT" 
               icon={GraduationCap} 
               title="The Scholar" 
               description="Prioritizes The Vault (Notes) and Chart Room (Calendar). Includes study reminders."
               selected={selectedRole === 'STUDENT'}
               onSelect={() => setSelectedRole('STUDENT')}
             />
             <RoleOption 
               role="SALES" 
               icon={Briefcase} 
               title="The Merchant" 
               description="Prioritizes The Reef (Contacts) and Bait Shop (Inbox). Fast communication tools."
               selected={selectedRole === 'SALES'}
               onSelect={() => setSelectedRole('SALES')}
             />
             <RoleOption 
               role="PLANNER" 
               icon={Map} 
               title="The Navigator" 
               description="Prioritizes The Bridge (Dashboard) and The Deck (Tasks). Heavy project management focus."
               selected={selectedRole === 'PLANNER'}
               onSelect={() => setSelectedRole('PLANNER')}
             />
           </div>

           <div className="mt-8 flex justify-end">
             <button 
               onClick={handleConfirm}
               disabled={!selectedRole}
               className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl"
             >
               Sign Registry <CheckCircle2 className="w-5 h-5" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const RoleOption: React.FC<{ role: UserRole, icon: any, title: string, description: string, selected: boolean, onSelect: () => void }> = ({ role, icon: Icon, title, description, selected, onSelect }) => (
  <motion.div 
    onClick={onSelect}
    whileHover={{ scale: 1.01 }}
    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${selected ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'}`}
  >
    <div className={`p-3 rounded-full ${selected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h3 className={`font-bold ${selected ? 'text-blue-900' : 'text-slate-700'}`}>{title}</h3>
      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);