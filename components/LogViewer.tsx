
import React, { useEffect, useState, useRef } from 'react';
import { Diagnostics, LogEntry } from '../utils/diagnostics';
import { Activity, Trash2, Copy, X, Terminal, Cpu, Layers, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogViewerProps {
    onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [vitals, setVitals] = useState<any>(null);
    const [fpsHistory, setFpsHistory] = useState<number[]>(new Array(40).fill(60));
    const [isStressing, setIsStressing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const update = () => {
            const currentVitals = Diagnostics.getVitals();
            setLogs([...Diagnostics.getLogs()]);
            setVitals(currentVitals);
            
            // Update Graph Data
            setFpsHistory(prev => {
                const newHistory = [...prev.slice(1), currentVitals.performance.fps];
                return newHistory;
            });
        };

        const interval = setInterval(update, 100); // 10Hz visual update for smoothness
        return () => clearInterval(interval);
    }, []);

    // Stress Test Logic (Dom Node Spam)
    useEffect(() => {
        let interval: number;
        if (isStressing) {
            Diagnostics.warn('System', 'Initiating Stress Protocol...');
            const junk: HTMLDivElement[] = [];
            interval = window.setInterval(() => {
                // Create drag
                for(let i=0; i<500; i++) {
                    const div = document.createElement('div');
                    div.style.display = 'none'; // Don't paint, just overload DOM
                    document.body.appendChild(div);
                    junk.push(div);
                }
                // Cleanup partially to cause GC churn
                if (junk.length > 5000) {
                    for(let i=0; i<2000; i++) {
                        const el = junk.shift();
                        if (el) el.remove();
                    }
                }
            }, 50);
        } else {
            // Cleanup all junk on stop
            const junk = document.querySelectorAll('div[style="display: none;"]');
            junk.forEach(el => el.remove());
        }
        return () => clearInterval(interval);
    }, [isStressing]);

    // Draw Oscilloscope
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear Screen
        ctx.fillStyle = '#0f172a'; // Slate-900
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid lines (Radar Style)
        ctx.strokeStyle = '#1e293b'; // Slate-800
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let x=0; x<canvas.width; x+=20) { ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
        for(let y=0; y<canvas.height; y+=20) { ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
        ctx.stroke();

        // Waveform
        ctx.strokeStyle = '#22c55e'; // Green-500
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#22c55e';
        ctx.beginPath();
        
        const step = canvas.width / (fpsHistory.length - 1);
        
        fpsHistory.forEach((fps, i) => {
            // Map 0-70 fps to canvas height (0 at bottom)
            // Canvas Y=0 is top.
            const normalizedFps = Math.max(0, Math.min(fps, 65));
            const y = canvas.height - ((normalizedFps / 65) * canvas.height * 0.8) - 10; 
            
            if (i===0) ctx.moveTo(0, y);
            else ctx.lineTo(i * step, y);
        });
        ctx.stroke();
        
        // Reset Shadow
        ctx.shadowBlur = 0;

        // Scanline (Retro CRT effect)
        const time = Date.now() / 2000;
        const scanY = (time % 1) * canvas.height;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
        ctx.fillRect(0, scanY, canvas.width, 10);

    }, [fpsHistory]);

    const handleCopy = () => {
        const text = JSON.stringify(Diagnostics.getVitals(), null, 2);
        navigator.clipboard.writeText(text);
        Diagnostics.info('System', 'Vitals exported to clipboard.');
    };

    const handleClear = () => {
        Diagnostics.clearLogs();
        setLogs([]);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            {/* Main Container - Brass & Paper Theme */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.1 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl bg-[#fdfbf7] border-4 border-[#b5a642] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[85vh] relative"
            >
                {/* Brass Header Plate */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#f0eadd] border-b-2 border-[#b5a642] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-800 rounded border border-[#b5a642]">
                            <Terminal className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-700 tracking-widest uppercase font-serif">System Diagnostic HUD</h3>
                            <p className="text-[9px] text-slate-500 font-mono">BLACK BOX RECORDING ACTIVE</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsStressing(!isStressing)}
                            className={`px-3 py-1.5 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${isStressing ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-white border-stone-300 text-slate-600 hover:border-red-400 hover:text-red-500'}`}
                        >
                            <Zap className="w-3 h-3" /> {isStressing ? 'Stressing...' : 'Stress Test'}
                        </button>
                        <div className="w-px h-6 bg-[#b5a642]/30 mx-2"></div>
                        <button onClick={handleCopy} className="p-1.5 hover:bg-white text-slate-500 hover:text-blue-600 rounded transition-colors" title="Export Vitals">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={handleClear} className="p-1.5 hover:bg-white text-slate-500 hover:text-red-600 rounded transition-colors" title="Purge Logs">
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-red-500 hover:text-white text-slate-400 rounded transition-colors ml-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Dashboard Area */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f8f5f2] relative shrink-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 pointer-events-none"></div>

                    {/* Left: The Oscilloscope (Engine Speed) */}
                    <div className="bg-slate-900 rounded-lg border-4 border-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        {/* Digital Screen Header */}
                        <div className="bg-slate-800 px-3 py-1 flex justify-between items-center border-b border-slate-700">
                            <span className="text-[9px] text-green-500 font-mono uppercase tracking-widest">FPS Monitor</span>
                            <div className={`w-2 h-2 rounded-full ${vitals?.performance?.fps > 55 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                        </div>
                        
                        {/* The Canvas Graph */}
                        <div className="relative flex-1 h-32 w-full">
                            <canvas ref={canvasRef} width={400} height={128} className="w-full h-full object-cover opacity-90" />
                            
                            {/* Overlay Big Number */}
                            <div className="absolute top-2 right-4 text-right pointer-events-none">
                                <div className={`text-4xl font-mono font-bold leading-none ${vitals?.performance?.fps < 30 ? 'text-red-500' : 'text-green-400'} drop-shadow-md`}>
                                    {vitals?.performance?.fps}
                                </div>
                                <div className="text-[9px] text-green-600 uppercase">Frames / Sec</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Mechanical Readouts (Paper Style) */}
                    <div className="grid grid-rows-2 gap-4">
                        {/* Memory Load */}
                        <div className="bg-white border-2 border-stone-200 rounded p-3 flex items-center justify-between shadow-sm relative group">
                            {/* Decorative Screw Heads */}
                            <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-stone-300 rounded-full border border-stone-400 flex items-center justify-center"><div className="w-full h-px bg-stone-500 transform rotate-45"></div></div>
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-stone-300 rounded-full border border-stone-400 flex items-center justify-center"><div className="w-full h-px bg-stone-500 transform rotate-45"></div></div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-stone-100 rounded-full border border-stone-200 text-stone-500">
                                    <Cpu className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Memory Load</div>
                                    <div className="text-xl font-serif font-bold text-slate-700">{vitals?.performance?.memory || 'N/A'}</div>
                                </div>
                            </div>
                            {/* Analogue Bar */}
                            <div className="w-16 h-1 bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400" style={{ width: '30%' }}></div>
                            </div>
                        </div>

                        {/* DOM Nodes */}
                        <div className="bg-white border-2 border-stone-200 rounded p-3 flex items-center justify-between shadow-sm relative">
                             {/* Decorative Screw Heads */}
                            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-stone-300 rounded-full border border-stone-400 flex items-center justify-center"><div className="w-full h-px bg-stone-500 transform rotate-45"></div></div>
                            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-stone-300 rounded-full border border-stone-400 flex items-center justify-center"><div className="w-full h-px bg-stone-500 transform rotate-45"></div></div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-stone-100 rounded-full border border-stone-200 text-stone-500">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Hull Structure</div>
                                    <div className="text-xl font-serif font-bold text-slate-700">{vitals?.performance?.nodes || 0} <span className="text-xs text-slate-400 font-normal">Nodes</span></div>
                                </div>
                            </div>
                            
                            {vitals?.performance?.nodes > 1500 && (
                                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom: The Log Feed (Black Box) */}
                <div className="flex-1 bg-slate-950 border-t-4 border-[#b5a642] p-4 overflow-y-auto custom-scrollbar font-mono text-xs relative">
                    {/* Scanline Overlay */}
                    <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-10"></div>
                    
                    {logs.length === 0 ? (
                        <div className="text-green-900/50 text-center mt-10 uppercase tracking-widest">-- No Events Recorded --</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex gap-3 py-1 hover:bg-white/5 border-b border-white/5 relative z-10 group">
                                <span className="text-slate-500 shrink-0 select-none">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                                </span>
                                <span className={`font-bold shrink-0 w-16 text-right ${
                                    log.level === 'ERROR' ? 'text-red-500' : 
                                    log.level === 'WARN' ? 'text-amber-500' : 
                                    'text-blue-500'
                                }`}>
                                    {log.level}
                                </span>
                                <span className="text-slate-400 shrink-0">
                                    [{log.source}]
                                </span>
                                <span className={`flex-1 break-all ${log.level === 'ERROR' ? 'text-red-300' : 'text-slate-300'}`}>
                                    {log.message}
                                    {log.data && (
                                        <span className="ml-2 opacity-50 text-[10px] text-slate-500 group-hover:opacity-100 transition-opacity">
                                            {log.data}
                                        </span>
                                    )}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};
