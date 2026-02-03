import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Siren, Anchor, Terminal } from 'lucide-react';
import { useAppStore } from '../store';
import { Diagnostics } from '../utils/diagnostics';

export const SOSModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [diagnosticSnapshot, setDiagnosticSnapshot] = useState<any>(null);
    const holdIntervalRef = useRef<number | null>(null);
    const currentFPS = useAppStore(state => state.currentFPS);
    const HOLD_DURATION = 5000; // 5 seconds for critical safety

    // Immersive Lockdown: Fullscreen, Context Block & Diagnostic Snapshot
    useEffect(() => {
        if (isOpen) {
            document.documentElement.requestFullscreen().catch((err) => console.warn("Fullscreen blocked:", err));

            const blockContext = (e: Event) => e.preventDefault();
            document.addEventListener('contextmenu', blockContext);

            // Capture Forensic Snapshot
            setDiagnosticSnapshot(Diagnostics.getVitals());

            return () => {
                document.removeEventListener('contextmenu', blockContext);
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => { });
                }
            };
        }
    }, [isOpen]);

    const startHold = (e: React.MouseEvent | React.TouchEvent) => {
        if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return;

        setIsHolding(true);
        const start = Date.now();

        if (navigator.vibrate) navigator.vibrate(50); // Initial pulse

        holdIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
            setHoldProgress(progress);

            if (progress >= 100) {
                if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
                if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
                onClose();
            }
        }, 16);
    };

    const endHold = () => {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(0);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-[#f4ecd8] flex flex-col items-center justify-center select-none overflow-hidden cursor-default"
            >
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none"></div>

                {/* Red Wash (Emergency Tint) */}
                <div className="absolute inset-0 bg-red-900/10 mix-blend-multiply pointer-events-none"></div>

                {/* Vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(127,29,29,0.5)] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full p-8">

                    {/* Warning Header */}
                    <div className="mb-8 border-b-4 border-red-800/20 pb-6 w-full flex flex-col items-center">
                        <Siren className="w-16 h-16 text-red-700 animate-pulse mb-4" />
                        <h2 className="text-4xl font-black text-red-900 tracking-[0.2em] uppercase font-serif">
                            S.O.S.
                        </h2>
                        <p className="text-sm text-red-800 font-mono mt-2 tracking-widest font-bold bg-red-100/50 px-4 py-1 rounded">
                            EMERGENCY LOCKDOWN PROTOCOL
                        </p>
                    </div>

                    {/* Forensic Snapshot Panel (Black Box Data) */}
                    {diagnosticSnapshot && (
                        <div className="bg-slate-900/90 border-2 border-red-500/50 rounded-lg p-4 mb-8 w-full max-w-md font-mono text-xs text-red-200 shadow-2xl relative overflow-hidden text-left">
                            {/* Header */}
                            <div className="flex justify-between border-b border-red-500/30 pb-2 mb-2">
                                <span className="font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Terminal className="w-3 h-3" /> System Failure Record
                                </span>
                                <span>{new Date(diagnosticSnapshot.timestamp).toLocaleTimeString()}</span>
                            </div>

                            {/* FPS History Graph (SVG) */}
                            <div className="h-16 w-full bg-slate-950/50 rounded border border-red-900/30 mb-3 relative flex items-end px-1 overflow-hidden">
                                {diagnosticSnapshot.performance.fpsHistory.map((fps: number, i: number) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-red-500/50 mx-px"
                                        style={{ height: `${Math.min(100, (fps / 60) * 100)}%` }}
                                    />
                                ))}
                                <div className="absolute top-1 right-2 text-[9px] text-red-400 font-bold">ENGINE LOAD</div>
                            </div>

                            {/* Logs */}
                            <div className="space-y-1 opacity-80">
                                {diagnosticSnapshot.recentLogs.filter((l: any) => l.level === 'WARN' || l.level === 'ERROR').slice(0, 4).map((log: any) => (
                                    <div key={log.id} className="truncate text-[10px]">
                                        <span className="text-red-500 font-bold">[{log.level}]</span> <span className="text-slate-400">[{log.source}]</span> {log.message}
                                    </div>
                                ))}
                                {diagnosticSnapshot.recentLogs.filter((l: any) => l.level === 'WARN' || l.level === 'ERROR').length === 0 && (
                                    <div className="text-slate-500 italic">No critical errors logged in buffer.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Heartbeat Visualization (Live Fallback) */}
                    {!diagnosticSnapshot && (
                        <div className="w-64 h-24 relative flex items-center justify-center mb-12 opacity-90 bg-red-50/40 rounded-lg border border-red-200/50">
                            <svg className="w-full h-full p-4" viewBox="0 0 200 60" preserveAspectRatio="none">
                                <path d="M0,30 Q 50,28 100,30 T 200,30" fill="none" stroke="#7f1d1d" strokeWidth="1" strokeOpacity="0.2" />
                                <motion.path
                                    d="M0,30 L60,30 L70,10 L80,50 L90,30 L200,30"
                                    fill="none"
                                    stroke={currentFPS < 60 ? "#dc2626" : "#991b1b"}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: [0, 1, 1],
                                        opacity: [0, 1, 0],
                                        pathOffset: [0, 0, 1]
                                    }}
                                    transition={{
                                        duration: 1, // Rapid pulse for emergency
                                        repeat: Infinity,
                                        ease: "linear",
                                        times: [0, 0.8, 1]
                                    }}
                                />
                            </svg>
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-red-800 font-bold">
                                ENGINE: {currentFPS} FPS
                            </div>
                        </div>
                    )}

                    {/* The Red Copper Seal Button */}
                    <div className="relative group scale-125">
                        <div className="absolute -top-12 left-0 right-0 text-center transition-opacity duration-300">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] font-serif ${isHolding ? 'text-red-700' : 'text-red-900/40'}`}>
                                {isHolding ? "DISENGAGING LOCK..." : "HOLD TO CANCEL"}
                            </span>
                        </div>

                        <button
                            onMouseDown={startHold}
                            onMouseUp={endHold}
                            onMouseLeave={endHold}
                            onTouchStart={startHold}
                            onTouchEnd={endHold}
                            className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-[0_15px_35px_rgba(127,29,29,0.4)] active:scale-95 active:shadow-inner transition-transform duration-100"
                            style={{
                                background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #450a0a 100%)', // Red Copper Gradient
                            }}
                        >
                            {/* Inner pressed groove */}
                            <div className="absolute inset-2 rounded-full border-2 border-[#450a0a]/30 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4)]"></div>

                            {/* Ink Fill Progress (Crimson SVG Ring) */}
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="46" fill="none" stroke="#450a0a" strokeWidth="1" opacity="0.3" />
                                <circle
                                    cx="50" cy="50" r="46"
                                    fill="none"
                                    stroke="#000000" // Darkest ink
                                    strokeWidth="8"
                                    strokeDasharray="289"
                                    strokeDashoffset={289 - (289 * holdProgress / 100)}
                                    strokeLinecap="butt"
                                    className="transition-all duration-75 ease-linear"
                                    style={{ mixBlendMode: 'overlay' }}
                                />
                            </svg>

                            {/* Button Face */}
                            <div className="relative z-10 flex flex-col items-center justify-center text-[#fca5a5]">
                                <Anchor className={`w-8 h-8 mb-1 ${isHolding ? 'animate-pulse text-white' : ''}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest font-serif leading-none text-white/90">
                                    ABORT
                                </span>
                            </div>
                        </button>
                    </div>

                </div>

                {/* Footer Disclaimer */}
                <div className="absolute bottom-6 text-[10px] text-red-900/50 font-serif italic opacity-80">
                    Vessel in Distress Mode. Controls locked for safety.
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
