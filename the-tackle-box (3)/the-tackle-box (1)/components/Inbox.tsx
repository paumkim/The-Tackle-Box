
import React, { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare, Phone, CheckSquare, FileText, Trash2, ArrowRight, Anchor, Filter, Fish, AlertOctagon, UploadCloud, Package, BarChart3, Image as ImageIcon, Box, Music, Video, ArrowUpRight } from 'lucide-react';
import { LogEntry, TaskPriority, EffortLevel, Asset } from '../types';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { FlareGun } from './FlareGun';
import { NotificationManager } from '../utils/notifications';

// Mock logs updated with 'type' for "Tuna" (Good) vs "Bycatch" (Spam)
const INITIAL_MOCK_LOGS: LogEntry[] = [
  { id: '1', source: 'Email', sender: 'GitHub', preview: 'Security alert for your repository...', timestamp: '10:42 AM', type: 'tuna' },
  { id: '2', source: 'SMS', sender: 'Mom', preview: 'Are you coming for dinner?', timestamp: '09:15 AM', type: 'tuna' },
  { id: '3', source: 'Phone', sender: 'Unknown', preview: 'Missed Call - Potential Spam', timestamp: 'Yesterday', type: 'bycatch' },
  { id: '4', source: 'Email', sender: 'Vercel', preview: 'Deployment successfully completed.', timestamp: 'Yesterday', type: 'tuna' },
  { id: '5', source: 'Email', sender: 'Newsletter', preview: '50% Off Sailing Gear!', timestamp: 'Yesterday', type: 'bycatch' },
];

export const Inbox: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_MOCK_LOGS);
  const liveWellAssets = useLiveQuery(() => db.assets.where('location').equals('live_well').reverse().sortBy('createdAt'));
  
  const [meshSize, setMeshSize] = useState<'FINE' | 'COARSE'>('FINE'); // Fine = All, Coarse = Only Tuna
  const [bycatchCount, setBycatchCount] = useState(0);
  const [tunaCount, setTunaCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Recalculate stats including assets
    const logBycatch = logs.filter(l => l.type === 'bycatch').length;
    const logTuna = logs.filter(l => l.type === 'tuna').length;
    const assetCount = liveWellAssets ? liveWellAssets.length : 0;
    
    setBycatchCount(logBycatch);
    setTunaCount(logTuna + assetCount);
  }, [logs, liveWellAssets]);

  const handleHook = async (log: LogEntry) => {
    // Convert to Task
    await db.tasks.add({
      title: `${log.source}: ${log.sender} - ${log.preview}`,
      isCompleted: false,
      priority: TaskPriority.REGULAR,
      effort: EffortLevel.MEDIUM,
      createdAt: Date.now(),
      dueDate: new Date().toISOString().split('T')[0]
    });
    removeLog(log.id);
  };

  const handleNet = async (log: LogEntry) => {
    // Convert to Note
    await db.notes.add({
      title: `Log: ${log.sender}`,
      content: `Source: ${log.source}\nTimestamp: ${log.timestamp}\n\n${log.preview}`,
      folder: 'Inbox',
      updatedAt: Date.now(),
      depth: 'Surface',
      tags: ['log', log.source.toLowerCase()]
    });
    removeLog(log.id);
  };

  const handleRelease = (log: LogEntry) => {
    // Archive/Delete
    removeLog(log.id);
  };

  const removeLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleArchiveAsset = async (id: number) => {
      await db.assets.update(id, { deletedAt: Date.now(), location: 'aquarium' }); // Move out of live well
  }

  const handleInspectAsset = (asset: Asset) => {
      // Just download for now as "inspection"
      const url = URL.createObjectURL(asset.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = () => {
      setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files: File[] = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
          for (const file of files) {
              await db.assets.add({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: file,
                  createdAt: Date.now(),
                  location: 'live_well',
                  species: file.type.startsWith('image') ? 'Scales' : 'Shells'
              });
          }
          NotificationManager.send("Cargo Secured", `${files.length} items stowed in The Trawl.`);
      }
  };

  const filteredLogs = meshSize === 'COARSE' ? logs.filter(l => l.type === 'tuna') : logs;
  const catchRatio = tunaCount > 0 ? Math.round((tunaCount / (tunaCount + bycatchCount)) * 100) : 0;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type.includes('pdf')) return <Box className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div 
        className="max-w-4xl mx-auto h-full flex flex-col relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <header className="mb-4 z-10 relative flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div className="flex justify-between items-end">
            <div>
            <h2 className="text-2xl font-bold text-slate-800 font-serif">The Trawl</h2>
            <p className="text-slate-500 text-sm font-serif italic">Sort the catch. Release the rest.</p>
            </div>
            
            {/* Trawl Controls */}
            <div className="flex gap-4 items-center">
            <FlareGun />
            
            {/* Mesh Selector */}
            <div className="flex bg-stone-100 p-1 rounded-md border border-stone-200">
                <button 
                    onClick={() => setMeshSize('FINE')}
                    className={`px-3 py-1 text-xs font-bold rounded-sm transition-all font-serif ${meshSize === 'FINE' ? 'bg-white shadow-sm text-slate-800 border border-stone-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Fine Mesh
                </button>
                <button 
                    onClick={() => setMeshSize('COARSE')}
                    className={`px-3 py-1 text-xs font-bold rounded-sm transition-all font-serif ${meshSize === 'COARSE' ? 'bg-white shadow-sm text-slate-800 border border-stone-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Coarse Mesh
                </button>
            </div>
            </div>
        </div>

        {/* Trawl Stats Bar */}
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-600">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>Net Efficiency: {catchRatio}%</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-1 text-slate-500">
                <Fish className="w-3 h-3 text-emerald-500" />
                <span>{tunaCount} Catch</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
                <AlertOctagon className="w-3 h-3 text-red-400" />
                <span>{bycatchCount} Bycatch</span>
            </div>
        </div>
      </header>

      {/* Supply Drop Zone */}
      <AnimatePresence>
          <motion.div 
            layout
            className={`mb-6 border-2 border-dashed rounded-xl p-4 flex items-center justify-center transition-all duration-300 ${
                isDragging ? 'bg-blue-50 border-blue-400 h-32 scale-100' : 'bg-white border-stone-300 h-20 hover:border-blue-300'
            }`}
          >
              <div className="flex items-center gap-4 text-slate-400 pointer-events-none">
                  <div className={`p-2 rounded-full border-2 ${isDragging ? 'border-blue-400 text-blue-500 bg-white' : 'border-stone-200 bg-white'}`}>
                      {isDragging ? <UploadCloud className="w-6 h-6 animate-bounce" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div>
                      <h4 className={`font-bold text-sm ${isDragging ? 'text-blue-600' : 'text-slate-600'}`}>Supply Drop</h4>
                      <p className="text-xs text-slate-400 font-serif italic">Drag crates (files) here to load the Live Well.</p>
                  </div>
              </div>
          </motion.div>
      </AnimatePresence>

      {(logs.length === 0 && (!liveWellAssets || liveWellAssets.length === 0)) ? (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
           
           {/* Empty Net Visual */}
           <div className="relative w-32 h-32 flex items-center justify-center mb-8 z-10 opacity-20">
              <div className="absolute inset-0 border-4 border-dashed border-stone-400 rounded-full animate-spin-slow"></div>
              <Fish className="w-12 h-12 text-stone-400" />
           </div>
           
           <h3 className="font-serif text-slate-400 text-lg mb-2 z-10 italic">Nets are empty, Captain.</h3>
           <p className="text-xs text-slate-300">Enjoy the calm waters.</p>
           
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto z-10 relative space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence>
            {/* Live Assets (Supply Drop) */}
            {liveWellAssets?.map((asset) => (
                <motion.div 
                    key={`asset-${asset.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative flex items-center p-4 rounded-xl border border-blue-200 bg-blue-50/30 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-blue-300"
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 shadow-sm border bg-white border-blue-100 text-blue-500">
                        {getFileIcon(asset.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-32">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold font-serif text-slate-800">{asset.name}</span>
                            <span className="text-xs text-stone-400 font-mono">SUPPLY DROP</span>
                        </div>
                        <p className="text-sm text-slate-600 truncate font-serif italic">
                            {(asset.size / 1024).toFixed(1)} KB • {asset.type}
                        </p>
                    </div>
                    
                    {/* Asset Actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pl-4 bg-gradient-to-l from-white via-white to-transparent">
                        <button 
                            onClick={() => handleInspectAsset(asset)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 transition-all"
                            title="Inspect Cargo"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleArchiveAsset(asset.id!)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-red-500 hover:text-white border border-stone-200 transition-all"
                            title="Release to Deep"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            ))}

            {/* Communication Logs */}
            {filteredLogs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`group relative flex items-center p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    log.type === 'bycatch' 
                    ? 'bg-stone-50/50 border-stone-200 opacity-70 hover:opacity-100 grayscale' 
                    : 'bg-white border-stone-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Source Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 shadow-sm border ${
                  log.source === 'Email' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  log.source === 'SMS' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                }`}>
                  {log.source === 'Email' && <Mail className="w-5 h-5" />}
                  {log.source === 'SMS' && <MessageSquare className="w-5 h-5" />}
                  {log.source === 'Phone' && <Phone className="w-5 h-5" />}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pr-32">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold font-serif ${log.type === 'bycatch' ? 'text-slate-500' : 'text-slate-800'}`}>{log.sender}</span>
                    <span className="text-xs text-stone-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-600 truncate font-serif italic">{log.preview}</p>
                </div>

                {/* Triage Actions (Reveal on Hover) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pl-4 bg-gradient-to-l from-white via-white to-transparent">
                  <button 
                    onClick={() => handleHook(log)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 transition-all"
                    title="Hook (Create Task)"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleNet(log)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border border-purple-100 transition-all"
                    title="Net (Create Note)"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRelease(log)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-red-500 hover:text-white border border-stone-200 transition-all"
                    title="Release to Deep (Archive)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="p-4 text-center text-xs text-stone-400 font-mono opacity-50 uppercase tracking-widest">
            End of Line
          </div>
        </div>
      )}
    </div>
  );
};
