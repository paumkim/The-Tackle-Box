
import React from 'react';
import { Book, Anchor, CheckCircle2, Zap, Layout, Terminal, Radio, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManifestEntry {
    id: string;
    date: string;
    module: string;
    description: string;
    method: 'AI ASSISTED' | 'MANUAL OVERRIDE';
    status: 'DEPLOYED' | 'COMMISSIONED';
    icon: any;
}

const entries: ManifestEntry[] = [
    {
        id: '1.2.0',
        date: '2026-01-28',
        module: 'UI/UX',
        description: 'Vessel Motion Protocol - Ship icon now bobs and sways based on real-time KTS telemetry.',
        method: 'AI ASSISTED',
        status: 'DEPLOYED',
        icon: Anchor
    },
    {
        id: '1.1.5',
        date: '2026-01-28',
        module: 'Performance',
        description: 'High Performance Refit - Removed all background blurs and dimmers to maintain 18.5 kts cruising speed.',
        method: 'AI ASSISTED',
        status: 'DEPLOYED',
        icon: Zap
    },
    {
        id: '1.1.2',
        date: '2026-01-28',
        module: 'Feedback',
        description: 'Signal Lamp - Mechanical telemetry feedback indicator added to bottom rail.',
        method: 'AI ASSISTED',
        status: 'DEPLOYED',
        icon: Radio
    },
    {
        id: '1.0.8',
        date: '2026-01-27',
        module: 'Navigation',
        description: 'Ghost Search Protocol - Zero-UI filtering mechanism commissioned for all deck views.',
        method: 'MANUAL OVERRIDE',
        status: 'COMMISSIONED',
        icon: Search
    },
    {
        id: '1.0.5',
        date: '2026-01-26',
        module: 'Layout',
        description: 'Universal Container Standardization - Fixed horizon alignment across all ship modules.',
        method: 'AI ASSISTED',
        status: 'DEPLOYED',
        icon: Layout
    },
    {
        id: '1.0.0',
        date: '2026-01-25',
        module: 'Core',
        description: 'Initial Vessel Commissioning - User profiles and basic flight systems functional.',
        method: 'MANUAL OVERRIDE',
        status: 'DEPLOYED',
        icon: Terminal
    }
];

export const ShipManifest: React.FC = () => {
    return (
        <div className="bridge-container-standard">
            <header className="bridge-header-standard">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                        <Book className="w-6 h-6 text-slate-600" />
                        Ship's Manifest
                    </h2>
                    <p className="text-slate-500 font-serif italic text-sm">Engineering Log & Build History</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ledger Verified
                    </div>
                </div>
            </header>

            <div className="bridge-body-standard overflow-y-auto custom-scrollbar pt-6">
                <div className="max-w-2xl mx-auto relative pb-20">
                    {/* The Anchor Chain (Timeline) */}
                    <div className="absolute left-6 top-0 bottom-0 w-1 bg-slate-200 z-0"></div>

                    <div className="space-y-8 relative z-10">
                        {entries.map((entry, index) => (
                            <motion.div 
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-8"
                            >
                                {/* Timeline Hub */}
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-full border-4 border-[#fdfbf7] shadow-md flex items-center justify-center relative z-20 ${entry.status === 'DEPLOYED' ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 border-slate-200'}`}>
                                        <entry.icon className="w-5 h-5" />
                                    </div>
                                    {entry.status === 'DEPLOYED' && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Entry Card */}
                                <div className="flex-1 bg-white p-6 rounded-lg border border-stone-200 shadow-sm relative overflow-hidden group">
                                    {/* Paper texture */}
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
                                    
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div>
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{entry.date} • {entry.id}</span>
                                            <h4 className="font-serif font-bold text-slate-800 text-lg leading-tight mt-1">{entry.module} Module</h4>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded border tracking-widest ${entry.method === 'AI ASSISTED' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-stone-50 text-stone-500 border-stone-200'}`}>
                                            {entry.method}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 leading-relaxed font-serif italic relative z-10 pr-10">
                                        "{entry.description}"
                                    </p>

                                    {/* Corner Stamp */}
                                    <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Anchor className="w-20 h-20 rotate-12" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
