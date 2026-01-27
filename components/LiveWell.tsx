
import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  UploadCloud, 
  File, 
  Trash2, 
  X, 
  Clipboard, 
  Link as LinkIcon, 
  Code, 
  ArrowRight,
  Image as ImageIcon,
  FileText,
  AlignLeft,
  FolderOpen,
  CheckSquare,
  BookOpen,
  Anchor,
  Archive,
  Globe
} from 'lucide-react';
import { db } from '../db';
import { Asset, ClipboardItem, TaskPriority, EffortLevel } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationManager } from '../utils/notifications';

export const LiveWell: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'assets' | 'clipboard'>('assets');
  
  // Staged Assets (Live Well Only)
  const liveWellAssets = useLiveQuery(() => 
    db.assets
      .where('location').equals('live_well')
      .reverse()
      .sortBy('createdAt')
  );

  // Top Folders for Reef Selector
  const folders = useLiveQuery(() => db.folders.orderBy('createdAt').limit(3).toArray());
  const clipboardItems = useLiveQuery(() => db.clipboard.orderBy('timestamp').reverse().limit(20).toArray());
  
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const getSpecies = (type: string, name: string): { species: 'Scales' | 'Shells' | 'Plankton', icon: any, color: string, bg: string } => {
    if (type.startsWith('image/') || type.startsWith('video/')) {
      return { species: 'Scales', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
    if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.json') || type.includes('text/')) {
      return { species: 'Plankton', icon: AlignLeft, color: 'text-green-500', bg: 'bg-green-50' };
    }
    return { species: 'Shells', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Main Asset Drop Handler
  const handleDrop = async (e: React.DragEvent, targetFolderId?: number) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    
    if (files.length > 0) {
        for (const file of files) {
        const { species } = getSpecies(file.type, file.name);
        
        await db.assets.add({
            name: file.name,
            type: file.type,
            size: file.size,
            data: file,
            createdAt: Date.now(),
            extractedText: '', 
            location: targetFolderId ? 'aquarium' : 'live_well',
            folderId: targetFolderId, // If dropped on a specific folder
            species: species
        });

        // Simulate Sonar Scan (OCR)
        setTimeout(async () => {
            const mockText = `Scanned content for ${file.name}. Analysis complete.`;
            const latest = await db.assets.where('name').equals(file.name).last();
            if (latest && latest.id) {
            await db.assets.update(latest.id, { extractedText: mockText });
            }
        }, 2000);
        }
        // Switch to assets tab if files are dropped
        setActiveTab('assets');
        NotificationManager.send("Crate Landing", `${files.length} items secured on deck.`);
    }
  };

  // The Net (Text/Link) Drop Handler
  const handleNetDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // If files are dropped here, route them to standard handleDrop
      // "Screenshot Scraps" logic
      if (e.dataTransfer.files.length > 0) {
          handleDrop(e);
          return;
      }

      const text = e.dataTransfer.getData('text/plain');
      const html = e.dataTransfer.getData('text/html');
      const uriList = e.dataTransfer.getData('text/uri-list');

      const isUrl = (s: string) => /^(http|https):\/\/[^ "]+$/.test(s);

      if (uriList || (text && isUrl(text))) {
          const url = uriList || text;
          let title = url;
          let favicon = '';
          
          // Attempt to extract title from HTML anchor
          if (html) {
             const parser = new DOMParser();
             const doc = parser.parseFromString(html, 'text/html');
             const anchor = doc.querySelector('a');
             if (anchor && anchor.textContent) title = anchor.textContent.trim();
          }

          try {
             const urlObj = new URL(url);
             favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`;
             if (title === url) title = urlObj.hostname; // Fallback title
          } catch (e) {}

          await db.clipboard.add({
              content: url,
              type: 'link',
              title: title,
              favicon: favicon,
              timestamp: Date.now()
          });
      } else if (text) {
          await db.clipboard.add({
              content: text,
              type: 'text',
              title: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
              timestamp: Date.now()
          });
      }
  }

  const deleteAsset = (id: number) => {
    db.assets.delete(id);
  };
  
  const deleteClipboardItem = (id: number) => {
      db.clipboard.delete(id);
  };

  const moveToAquarium = (asset: Asset, folderId?: number) => {
    if (asset.id) {
      db.assets.update(asset.id, { 
        location: 'aquarium',
        folderId: folderId
      });
    }
  };

  const handleBulkMove = async (folderId: number) => {
      if (liveWellAssets && liveWellAssets.length > 0) {
          const count = liveWellAssets.length;
          await Promise.all(liveWellAssets.map(a => db.assets.update(a.id!, { location: 'aquarium', folderId })));
          NotificationManager.send("Cargo Sorted", `${count} items moved to designated reef.`);
      }
  };

  const convertToTask = async (asset: Asset) => {
    if (asset.id) {
        await db.tasks.add({
            title: `Review: ${asset.name}`,
            isCompleted: false,
            priority: TaskPriority.REGULAR,
            effort: EffortLevel.LOW,
            createdAt: Date.now(),
            filePath: asset.name
        });
        moveToAquarium(asset); // Archive it to aquarium after converting
    }
  };

  const hookItem = async (item: ClipboardItem) => {
      await db.tasks.add({
          title: item.title || item.content,
          isCompleted: false,
          priority: TaskPriority.REGULAR,
          effort: EffortLevel.LOW,
          createdAt: Date.now()
      });
      // "Moving" the item means consuming it from the net
      if (item.id) await db.clipboard.delete(item.id);
  };

  const safeItem = async (item: ClipboardItem) => {
      await db.notes.add({
          title: item.title || 'Net Catch',
          content: item.content,
          folder: 'Inbox',
          updatedAt: Date.now(),
          depth: 'Surface',
          tags: ['net-catch', item.type]
      });
      if (item.id) await db.clipboard.delete(item.id);
  };

  const convertToNote = async (asset: Asset) => {
      if (asset.id) {
          await db.notes.add({
              title: asset.name,
              content: `Attached File: ${asset.name}\nSize: ${(asset.size / 1024).toFixed(1)} KB`,
              folder: 'Imports',
              updatedAt: Date.now(),
              depth: 'Surface',
              tags: ['import', asset.species?.toLowerCase() || 'file']
          });
          moveToAquarium(asset);
      }
  }

  const downloadAsset = (asset: Asset) => {
    const url = URL.createObjectURL(asset.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className={`fixed inset-x-0 top-0 h-[65vh] bg-[#F8F9FA] border-b border-slate-200 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${
        isOpen ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex gap-4">
           <button 
             onClick={() => setActiveTab('assets')}
             className={`flex items-center text-sm font-bold transition-colors ${activeTab === 'assets' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <UploadCloud className="w-4 h-4 mr-2" />
             Live Well
           </button>
           <div className="w-px h-4 bg-slate-300"></div>
           <button 
             onClick={() => setActiveTab('clipboard')}
             className={`flex items-center text-sm font-bold transition-colors ${activeTab === 'clipboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Clipboard className="w-4 h-4 mr-2" />
             The Net
           </button>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative w-full max-w-5xl mx-auto border-x border-slate-200 bg-white">
        {activeTab === 'assets' && (
          <>
            {/* Drop Zone (Smart Triage) */}
            <div 
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e)}
              className={`p-6 transition-all duration-300 border-b border-slate-100 ${
                isDragging ? 'bg-blue-50/80 shadow-inner' : 'bg-slate-50/30'
              }`}
            >
              <div className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all bg-white group ${isDragging ? 'border-blue-400 scale-[1.02]' : 'border-slate-200 hover:border-slate-300'}`}>
                 <UploadCloud className={`w-10 h-10 mb-3 text-slate-300 transition-colors ${isDragging ? 'text-blue-500' : 'group-hover:text-slate-400'}`} />
                 <p className="text-sm font-medium text-slate-600">Drag items to triage</p>
                 
                 {/* Species Indicators */}
                 <div className="flex gap-4 mt-4 w-full justify-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 border border-blue-100"><ImageIcon className="w-3.5 h-3.5" /></div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Scales</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-400 border border-amber-100"><FileText className="w-3.5 h-3.5" /></div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Shells</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-400 border border-green-100"><AlignLeft className="w-3.5 h-3.5" /></div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Plankton</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Staged Items List */}
            <div className="flex-1 px-6 py-4 space-y-3">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Unprocessed Catch</h4>
               
               {(!liveWellAssets || liveWellAssets.length === 0) && (
                  <p className="text-center text-xs text-slate-300 py-4 italic">No items in the well.</p>
               )}

               <AnimatePresence>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {liveWellAssets?.map(asset => {
                     const speciesConfig = getSpecies(asset.type, asset.name);
                     const SpeciesIcon = speciesConfig.icon;
                     
                     return (
                       <motion.div 
                         key={asset.id} 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 group hover:border-blue-300 transition-all"
                       >
                         <div className="flex items-start gap-3 mb-3">
                            {/* Thumbnail / Icon */}
                            <div 
                              onClick={() => downloadAsset(asset)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer ${speciesConfig.bg} ${speciesConfig.color} border border-slate-100`}
                            >
                              <SpeciesIcon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start">
                                 <p className="text-sm font-medium text-slate-700 truncate cursor-pointer hover:text-blue-600" onClick={() => downloadAsset(asset)}>{asset.name}</p>
                                 <button onClick={() => deleteAsset(asset.id!)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                               </div>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${speciesConfig.bg} ${speciesConfig.color}`}>
                                    {speciesConfig.species}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{(asset.size / 1024).toFixed(0)} KB</span>
                               </div>
                            </div>
                         </div>

                         {/* Quick Actions */}
                         <div className="flex gap-2">
                            <button 
                              onClick={() => moveToAquarium(asset)}
                              className="flex-1 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-100 font-medium transition-colors"
                            >
                              To Aquarium
                            </button>
                            
                            {speciesConfig.species === 'Plankton' && (
                                <button 
                                    onClick={() => convertToTask(asset)}
                                    className="px-2 py-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-100 font-medium transition-colors"
                                    title="Convert to Task"
                                >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                </button>
                            )}
                            
                            {speciesConfig.species === 'Shells' && (
                                <button 
                                    onClick={() => convertToNote(asset)}
                                    className="px-2 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-100 font-medium transition-colors"
                                    title="Send to Vault"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                </button>
                            )}
                         </div>
                       </motion.div>
                     );
                   })}
               </div>
               </AnimatePresence>
            </div>

            {/* Reef Selector (Quick Route) */}
            <div className="mt-auto border-t border-slate-200 bg-white p-4">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Reef Selector (One-Click Sorting)</h4>
               <div className="flex gap-2 overflow-x-auto pb-2">
                  {folders?.map(folder => (
                    <button 
                      key={folder.id}
                      onClick={() => handleBulkMove(folder.id!)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      className={`flex-shrink-0 flex items-center gap-2 p-2 px-3 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm ${isDragging ? 'hover:scale-[1.02]' : ''}`}
                      title={`Move all Live Well items to ${folder.name}`}
                    >
                       <FolderOpen className="w-4 h-4 text-blue-400" />
                       <span className="text-xs font-medium text-slate-600">{folder.name}</span>
                    </button>
                  ))}
                  {(!folders || folders.length === 0) && (
                      <p className="text-xs text-slate-400 italic">No reefs created yet.</p>
                  )}
               </div>
            </div>
          </>
        )}

        {activeTab === 'clipboard' && (
          <div 
            className="flex-1 flex flex-col bg-[#F8F9FA] relative"
            onDragOver={handleDragOver}
            onDrop={handleNetDrop}
          >
            {/* Ink-Line Mesh Grid */}
            <div className="absolute inset-0 opacity-30 pointer-events-none z-0" style={{ 
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}></div>
            
            {/* Drop Zone Indicator */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-blue-50/80 z-20 flex items-center justify-center border-4 border-dashed border-blue-300 m-2 rounded-xl"
                    >
                        <div className="text-center">
                            <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                            <p className="font-bold text-blue-600">Harvest the Net</p>
                            <p className="text-xs text-blue-400">Drop text, links, or screenshots</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-4 space-y-4 relative z-10 flex-1 overflow-y-auto">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center justify-between">
                    <span>Web Catch</span>
                    <span className="bg-slate-200 text-slate-500 px-1.5 rounded-full">{clipboardItems?.length || 0}</span>
                </h4>
                
                {clipboardItems?.length === 0 && (
                <div className="text-center text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-xl m-2 bg-white/50">
                    <Clipboard className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-serif italic text-slate-500">The net is empty.</p>
                    <p className="text-xs text-slate-400 mt-1">Drag text or URLs here.</p>
                </div>
                )}
                
                {clipboardItems?.map(item => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id} 
                    className="group bg-white p-4 rounded-sm border-2 border-slate-600 shadow-[2px_2px_0px_rgba(71,85,105,0.2)] hover:shadow-[4px_4px_0px_rgba(71,85,105,0.2)] hover:-translate-y-0.5 transition-all"
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                            {item.type === 'link' ? (
                                item.favicon ? (
                                    <img src={item.favicon} alt="icon" className="w-4 h-4 rounded-sm" />
                                ) : (
                                    <Globe className="w-4 h-4 text-blue-500" />
                                )
                            ) : (
                                <AlignLeft className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-slate-800 text-sm mb-1 truncate font-serif">
                                {item.title || (item.type === 'link' ? 'Untitled Link' : 'Text Snippet')}
                            </h5>
                            <p className="text-xs text-slate-500 line-clamp-3 break-words leading-relaxed font-mono bg-slate-50 p-1.5 rounded border border-slate-100 mb-2">
                                {item.content}
                            </p>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <span className="text-[9px] text-slate-300 font-sans uppercase tracking-wider">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => hookItem(item)} 
                                        className="text-slate-400 hover:text-blue-600 transition-colors p-1" 
                                        title="Hook (Create Task)"
                                    >
                                        <Anchor className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => safeItem(item)} 
                                        className="text-slate-400 hover:text-amber-600 transition-colors p-1" 
                                        title="Safe (Send to Vault)"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1 self-center"></div>
                                    <button 
                                        onClick={() => deleteClipboardItem(item.id!)} 
                                        className="text-slate-300 hover:text-red-400 transition-colors p-1" 
                                        title="Discard"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
