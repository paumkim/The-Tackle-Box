
import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Grid, FileText, Link as LinkIcon, UploadCloud, Folder, ChevronRight, Check, Plus, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationManager } from '../utils/notifications';
import { ThemeMode } from '../types';

interface DeployNetButtonProps {
    onOpenFullNet: () => void;
    themeMode: ThemeMode;
}

export const DeployNetButton: React.FC<DeployNetButtonProps> = ({ onOpenFullNet, themeMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    
    // Live counts
    const liveWellItemCount = useLiveQuery(() => db.assets.where('location').equals('live_well').count()) || 0;
    const folders = useLiveQuery(() => db.folders.orderBy('name').toArray());
    
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Actions ---

    const handleQuickLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteInput.trim()) return;
        
        await db.notes.add({
            title: `Log: ${new Date().toLocaleTimeString()}`,
            content: noteInput,
            folder: selectedFolderId ? folders?.find(f => f.id === selectedFolderId)?.name || 'Inbox' : 'Inbox',
            updatedAt: Date.now(),
            depth: 'Surface',
            tags: ['quick-log'],
            isFresh: true
        });
        setNoteInput('');
        NotificationManager.send("Log Captured", "Entry secured in The Vault (Fresh).");
        setIsOpen(false);
    };

    const handleCastHook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        await db.notes.add({
            title: `Link: ${urlInput}`,
            content: `Anchor Link: ${urlInput}`,
            folder: selectedFolderId ? folders?.find(f => f.id === selectedFolderId)?.name || 'Inbox' : 'Inbox',
            updatedAt: Date.now(),
            depth: 'Surface',
            tags: ['link', 'hook'],
            isFresh: true
        });
        setUrlInput('');
        NotificationManager.send("Hook Cast", "Link secured in The Vault (Fresh).");
        setIsOpen(false);
    };

    // --- Drag & Drop Logic ---

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const fileList = e.dataTransfer.files;
        if (!fileList) return;

        const files = Array.from(fileList) as File[];
        if (files.length > 0) {
            for (const file of files) {
                await db.assets.add({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: file,
                    createdAt: Date.now(),
                    location: selectedFolderId ? 'aquarium' : 'live_well',
                    folderId: selectedFolderId || undefined,
                    species: file.type.startsWith('image') ? 'Scales' : 'Shells',
                    isFresh: true
                });
            }
            NotificationManager.send("Net Deployed", `${files.length} items caught (Fresh).`);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* The Trigger / Drop Target */}
            <motion.button 
                onClick={() => setIsOpen(!isOpen)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={isDragging ? { scale: 1.1, borderColor: '#3b82f6', backgroundColor: '#eff6ff' } : { scale: 1 }}
                className={`
                    relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm border
                    ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white' : 'bg-[#fdfbf7] border-stone-300 text-slate-600 hover:border-slate-400 hover:bg-stone-50 hover:text-slate-900'} 
                    ${liveWellItemCount > 0 ? 'ring-2 ring-slate-200' : ''}
                    ${isDragging ? 'ring-4 ring-blue-300' : ''}
                `}
                title="Deploy Net (Drag files here or click for menu)"
            >
                {isDragging ? (
                    <UploadCloud className="w-3 h-3 text-blue-500 animate-bounce" />
                ) : (
                    <Grid className={`w-3 h-3 ${themeMode === 'MIDNIGHT' ? '' : 'text-[#3B4B5F]'}`} />
                )}
                
                {isDragging ? "Drop to Catch" : "Deploy Net"}
                
                {liveWellItemCount > 0 && !isDragging && (
                    <span className="bg-[#3B4B5F] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">{liveWellItemCount}</span>
                )}

                {/* Sonar Pulse Animation on Drop/Drag */}
                {isDragging && (
                    <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-50"></span>
                )}
            </motion.button>

            {/* The Intake Goodies Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-3 w-72 bg-[#fdfbf7] border border-stone-200 shadow-2xl rounded-xl z-50 overflow-hidden text-slate-700"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-serif">Quick-Intake Hub</h3>
                            <button onClick={onOpenFullNet} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                View Full Net <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Reef Selector (Smart Sorting) */}
                        <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                            <Folder className="w-3 h-3 text-slate-400" />
                            <select 
                                className="bg-transparent text-xs font-bold text-slate-600 outline-none w-full cursor-pointer hover:text-blue-600"
                                value={selectedFolderId || ''}
                                onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Auto-Sort: General (Inbox)</option>
                                {folders?.map(f => (
                                    <option key={f.id} value={f.id}>Reef: {f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="p-4 space-y-4">
                            
                            {/* Capture Log */}
                            <form onSubmit={handleQuickLog} className="relative">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Capture Log</label>
                                <div className="flex items-center gap-2">
                                    <PenTool className="w-4 h-4 text-slate-400 absolute left-3 top-7" />
                                    <input 
                                        type="text" 
                                        autoFocus
                                        value={noteInput}
                                        onChange={e => setNoteInput(e.target.value)}
                                        placeholder="Quick thought..." 
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs shadow-sm focus:ring-1 focus:ring-blue-200 outline-none font-serif"
                                    />
                                </div>
                            </form>

                            {/* Cast Hook */}
                            <form onSubmit={handleCastHook} className="relative">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Cast Hook (URL)</label>
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-7" />
                                    <input 
                                        type="text" 
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        placeholder="Paste link here..." 
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs shadow-sm focus:ring-1 focus:ring-blue-200 outline-none text-blue-600"
                                    />
                                </div>
                            </form>

                            {/* Upload Scraps (Mini Dropzone) */}
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Upload Scraps</label>
                                <div 
                                    className="border-2 border-dashed border-stone-200 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors cursor-pointer text-slate-400 hover:text-slate-600 hover:border-stone-300"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => document.getElementById('hidden-file-input')?.click()}
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    <span className="text-xs font-medium">Drop files or click</span>
                                    <input type="file" id="hidden-file-input" className="hidden" multiple onChange={(e) => {
                                        // reuse drop logic structure roughly
                                        const mockEvent = {
                                            preventDefault: () => {},
                                            stopPropagation: () => {},
                                            dataTransfer: { files: e.target.files }
                                        } as any;
                                        handleDrop(mockEvent);
                                    }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
