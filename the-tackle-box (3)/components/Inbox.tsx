
import React, { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare, Phone, CheckSquare, FileText, Trash2, ArrowRight, Anchor, Filter, Fish, AlertOctagon, UploadCloud, Package, BarChart3, Image as ImageIcon, Box, Music, Video, ArrowUpRight, Radar, Archive, Inbox as InboxIcon } from 'lucide-react';
import { LogEntry, TaskPriority, EffortLevel, Asset, Note } from '../types';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { FlareGun } from './FlareGun';
import { NotificationManager } from '../utils/notifications';

const INITIAL_MOCK_LOGS: LogEntry[] = [
  { id: '1', source: 'Email', sender: 'GitHub', preview: 'Security alert for your repository...', timestamp: '10:42 AM', type: 'tuna' },
  { id: '2', source: 'SMS', sender: 'Mom', preview: 'Are you coming for dinner?', timestamp: '09:15 AM', type: 'tuna' },
  { id: '3', source: 'Phone', sender: 'Unknown', preview: 'Missed Call - Potential Spam', timestamp: 'Yesterday', type: 'bycatch' },
  { id: '4', source: 'Email', sender: 'Vercel', preview: 'Deployment successfully completed.', timestamp: 'Yesterday', type: 'tuna' },
  { id: '5', source: 'Email', sender: 'Newsletter', preview: '50% Off Sailing Gear!', timestamp: 'Yesterday', type: 'bycatch' },
];

export const Inbox: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_MOCK_LOGS);
  const freshNotes = useLiveQuery(() => db.notes.filter(n => !!n.isFresh).toArray()) || [];
  const freshAssets = useLiveQuery(() => db.assets.filter(a => !!a.isFresh).toArray()) || [];
  const liveWellAssets = useLiveQuery(() => 
    db.assets
      .where('location').equals('live_well')
      .filter(a => !a.isFresh)
      .reverse()
      .sortBy('createdAt')
  );
  
  const [meshSize, setMeshSize] = useState<'FINE' | 'COARSE'>('FINE');
  const [bycatchCount, setBycatchCount] = useState(0);
  const [tunaCount, setTunaCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const logBycatch = logs.filter(l => l.type === 'bycatch').length;
    const logTuna = logs.filter(l => l.type === 'tuna').length;
    const assetCount = (liveWellAssets ? liveWellAssets.length : 0) + freshNotes.length + freshAssets.length;
    setBycatchCount(logBycatch);
    setTunaCount(logTuna + assetCount);
  }, [logs, liveWellAssets, freshNotes, freshAssets]);

  const handleHook = async (log: LogEntry) => {
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

  const handleRelease = (log: LogEntry) => removeLog(log.id);
  const removeLog = (id: string) => setLogs(prev => prev.filter(l => l.id !== id));
  const handleArchiveAsset = async (id: number) => await db.assets.update(id, { deletedAt: Date.now(), location: 'aquarium', isFresh: false }); 

  const handleInspectAsset = (asset: Asset) => {
      const url = URL.createObjectURL(asset.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const mountNoteToDeck = async (note: Note) => {
      if (!note.id) return;
      await db.tasks.add({
          title: note.title,
          isCompleted: false,
          priority: TaskPriority.REGULAR,
          effort: EffortLevel.MEDIUM,
          createdAt: Date.now(),
          filePath: note.title
      });
      await db.notes.update(note.id, { isFresh: false });
  };

  const archiveNoteToVault = async (note: Note) => {
      if (!note.id) return;
      await db.notes.update(note.id, { isFresh: false });
  };

  const mountAssetToDeck = async (asset: Asset) => {
      if (!asset.id) return;
      await db.tasks.add({
          title: `Review Catch: ${asset.name}`,
          isCompleted: false,
          priority: TaskPriority.REGULAR,
          effort: EffortLevel.LOW,
          createdAt: Date.now(),
          filePath: asset.name
      });
      await db.assets.update(asset.id, { isFresh: false });
  };

  const archiveAssetToVault = async (asset: Asset) => {
      if (!asset.id) return;
      await db.assets.update(asset.id, { isFresh: false });
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files) as File[];
      if (files.length > 0) {
          for (const file of files) {
              await db.assets.add({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: file,
                  createdAt: Date.now(),
                  location: 'live_well',
                  species: file.type.startsWith('image') ? 'Scales' : 'Shells',
                  isFresh: true
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
    <div className="bridge-container-standard" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <header className="bridge-header-standard">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
            <InboxIcon className="w-6 h-6 text-slate-600" />
            The Trawl
          </h2>
          <p className="text-slate-500 font-serif italic text-sm">Sort the catch. Release the rest.</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="flex bg-stone-100 p-1 rounded-md border border-stone-200">
                <button onClick={() => setMeshSize('FINE')} className={`px-3 py-1 text-xs font-bold rounded-sm transition-all font-serif ${meshSize === 'FINE' ? 'bg-white shadow-sm text-slate-800 border border-stone-200' : 'text-slate-500 hover:text-slate-700'}`}>Fine Mesh</button>
                <button onClick={() => setMeshSize('COARSE')} className={`px-3 py-1 text-xs font-bold rounded-sm transition-all font-serif ${meshSize === 'COARSE' ? 'bg-white shadow-sm text-slate-800 border border-stone-200' : 'text-slate-500 hover:text-slate-700'}`}>Coarse Mesh</button>
            </div>
            <FlareGun />
        </div>
      </header>

      {/* Standard Control Bar for Stats */}
      <div className="px-4 mb-4 flex items-center gap-4">
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs w-full">
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
      </div>

      <div className="bridge-body-standard overflow-y-auto custom-scrollbar">
        <AnimatePresence>
            <div className={`mb-6 border-2 border-dashed rounded-xl p-4 flex items-center justify-center transition-all ${isDragging ? 'bg-blue-50 border-blue-400 h-32 scale-100' : 'bg-white border-stone-300 h-20 hover:border-blue-300'}`}>
                <div className="flex items-center gap-4 text-slate-400 pointer-events-none">
                    <div className={`p-2 rounded-full border-2 ${isDragging ? 'border-blue-400 text-blue-500 bg-white' : 'border-stone-200 bg-white'}`}>
                        {isDragging ? <UploadCloud className="w-6 h-6 animate-bounce" /> : <Package className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${isDragging ? 'text-blue-600' : 'text-slate-600'}`}>Supply Drop</h4>
                        <p className="text-xs text-slate-400 font-serif italic">Drag crates here to load the Live Well.</p>
                    </div>
                </div>
            </div>
        </AnimatePresence>

        {/* Fresh Catch Section */}
        {(freshNotes.length > 0 || freshAssets.length > 0) && (
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 px-2">
                    <Radar className="w-5 h-5 text-blue-500 animate-spin-slow" />
                    <h3 className="font-serif font-bold text-slate-800 text-sm uppercase tracking-widest">Fresh Catch</h3>
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{freshNotes.length + freshAssets.length} Unprocessed</span>
                </div>
                <div className="space-y-3">
                    {freshNotes.map(note => (
                        <div key={note.id} className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 z-10">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-blue-100"><FileText className="w-5 h-5" /></div>
                                <div><h4 className="font-bold text-slate-700 text-sm">{note.title}</h4><div className="text-[10px] text-slate-500 font-mono mt-1">Caught {new Date(note.updatedAt).toLocaleTimeString()} | {note.folder}</div></div>
                            </div>
                            <div className="flex gap-2 z-10">
                                <button onClick={() => mountNoteToDeck(note)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 shadow-sm"><CheckSquare className="w-3 h-3" /> Mount</button>
                                <button onClick={() => archiveNoteToVault(note)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-50 shadow-sm"><Archive className="w-3 h-3" /> Archive</button>
                            </div>
                        </div>
                    ))}
                    {freshAssets.map(asset => (
                        <div key={asset.id} className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 z-10">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">{getFileIcon(asset.type)}</div>
                                <div><h4 className="font-bold text-slate-700 text-sm truncate max-w-[200px]">{asset.name}</h4><div className="text-[10px] text-slate-500 font-mono mt-1">Caught {new Date(asset.createdAt).toLocaleTimeString()} | {(asset.size / 1024).toFixed(1)} KB</div></div>
                            </div>
                            <div className="flex gap-2 z-10">
                                <button onClick={() => mountAssetToDeck(asset)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 shadow-sm"><CheckSquare className="w-3 h-3" /> Mount</button>
                                <button onClick={() => archiveAssetToVault(asset)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-50 shadow-sm"><Archive className="w-3 h-3" /> Archive</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="my-6 border-t border-slate-200"></div>
            </div>
        )}

        {(logs.length === 0 && (!liveWellAssets || liveWellAssets.length === 0) && freshNotes.length === 0 && freshAssets.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden h-64">
                <Fish className="w-12 h-12 text-stone-200 mb-4" />
                <h3 className="font-serif text-slate-400 text-lg mb-2 z-10 italic">Nets are empty, Captain.</h3>
            </div>
        ) : (
            <div className="space-y-3">
                {liveWellAssets?.map((asset) => (
                    <div key={`asset-${asset.id}`} className="group relative flex items-center p-4 rounded-xl border border-stone-200 bg-white hover:border-blue-300 shadow-sm">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 shadow-sm border bg-slate-50 border-slate-200 text-slate-500">{getFileIcon(asset.type)}</div>
                        <div className="flex-1 min-w-0 pr-32">
                            <div className="flex items-center justify-between mb-1"><span className="text-sm font-bold font-serif text-slate-800">{asset.name}</span><span className="text-xs text-stone-400 font-mono">SUPPLY DROP</span></div>
                            <p className="text-sm text-slate-600 truncate font-serif italic">{(asset.size / 1024).toFixed(1)} KB • {asset.type}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all pl-4 bg-white">
                            <button onClick={() => handleInspectAsset(asset)} className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 transition-all"><ArrowUpRight className="w-4 h-4" /></button>
                            <button onClick={() => handleArchiveAsset(asset.id!)} className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-red-500 hover:text-white border border-stone-200 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                {filteredLogs.map((log) => (
                    <div key={log.id} className={`group relative flex items-center p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${log.type === 'bycatch' ? 'bg-stone-50/50 border-stone-200 opacity-70 grayscale' : 'bg-white border-stone-200 hover:border-blue-300'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 shadow-sm border ${log.source === 'Email' ? 'bg-blue-50 text-blue-600' : log.source === 'SMS' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            {log.source === 'Email' && <Mail className="w-5 h-5" />}{log.source === 'SMS' && <MessageSquare className="w-5 h-5" />}{log.source === 'Phone' && <Phone className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-32">
                            <div className="flex items-center justify-between mb-1"><span className={`text-sm font-bold font-serif ${log.type === 'bycatch' ? 'text-slate-500' : 'text-slate-800'}`}>{log.sender}</span><span className="text-xs text-stone-400 font-mono">{log.timestamp}</span></div>
                            <p className="text-sm text-slate-600 truncate font-serif italic">{log.preview}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all pl-4 bg-white">
                            <button onClick={() => handleHook(log)} className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100"><CheckSquare className="w-4 h-4" /></button>
                            <button onClick={() => handleNet(log)} className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border border-purple-100"><FileText className="w-4 h-4" /></button>
                            <button onClick={() => handleRelease(log)} className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-red-500 hover:text-white border border-stone-200"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
