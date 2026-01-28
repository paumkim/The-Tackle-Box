
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Folder as FolderIcon,
  FolderOpen,
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  Plus,
  Trash2,
  Box,
  Edit2
} from 'lucide-react';
import { Asset, Folder } from '../types';
import { LightTable } from './LightTable';
import { AnimatePresence, motion } from 'framer-motion';

export const Aquarium: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(() => {
    const saved = localStorage.getItem('tackle_aquarium_folder');
    return saved ? parseInt(saved) : null;
  });
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Persist folder navigation
  useEffect(() => {
    if (currentFolderId === null) {
      localStorage.removeItem('tackle_aquarium_folder');
    } else {
      localStorage.setItem('tackle_aquarium_folder', currentFolderId.toString());
    }
  }, [currentFolderId]);

  // Fetch Folders
  const folders = useLiveQuery(() => db.folders.toArray());
  
  // Fetch Assets in current folder, excluding deleted ones
  const assets = useLiveQuery(() => {
    // Basic filter logic. Use filter instead of where().equals(undefined) to avoid Dexie error
    return db.assets.filter(a => a.deletedAt === undefined || a.deletedAt === 0).toArray(); 
  });

  const filteredAssets = assets?.filter(a => {
      // In-memory filter for current folder
      if (currentFolderId === null) {
          return !a.folderId; // Root items
      }
      return a.folderId === currentFolderId;
  });

  const currentFolder = folders?.find(f => f.id === currentFolderId);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await db.folders.add({
        name: newFolderName,
        createdAt: Date.now()
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
      e.preventDefault();
      if (renamingFolderId && renameValue.trim()) {
          await db.folders.update(renamingFolderId, { name: renameValue });
          setRenamingFolderId(null);
          setRenameValue('');
      }
  }

  const startRename = (folder: Folder, e: React.MouseEvent) => {
      e.stopPropagation();
      setRenamingFolderId(folder.id!);
      setRenameValue(folder.name);
  }

  const handleDeleteAsset = async (e: React.MouseEvent, assetId: number) => {
      e.stopPropagation();
      await db.assets.update(assetId, { deletedAt: Date.now() });
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, assetId: number) => {
      e.dataTransfer.setData('text/plain', assetId.toString());
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderId: number) => {
      e.preventDefault();
      const assetId = parseInt(e.dataTransfer.getData('text/plain'));
      if (assetId) {
          await db.assets.update(assetId, { folderId });
      }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6 text-pink-500" />;
    if (type.includes('pdf')) return <Box className="w-6 h-6 text-orange-500" />;
    return <FileText className="w-6 h-6 text-slate-400" />;
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden px-6 py-6">
      {/* Contained LightTable */}
      <LightTable asset={selectedAsset} onClose={() => setSelectedAsset(null)} />

      {/* Header / Breadcrumbs */}
      <header className="mb-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          {currentFolderId !== null && (
             <button 
               onClick={() => setCurrentFolderId(null)}
               className="p-1 rounded-full hover:bg-slate-200 text-slate-500 mr-2"
             >
               <ChevronLeft className="w-5 h-5" />
             </button>
          )}
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {currentFolderId === null ? (
                <>
                    <span className="text-3xl">🪸</span>
                    The Aquarium
                </>
            ) : (
                <>
                    <FolderOpen className="w-6 h-6 text-blue-500" />
                    {currentFolder?.name}
                </>
            )}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
           {currentFolderId === null && (
               <button 
                 onClick={() => setIsCreatingFolder(true)}
                 className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
               >
                 <Plus className="w-4 h-4" /> New Reef
               </button>
           )}
        </div>
      </header>

      {/* New Folder Input */}
      <AnimatePresence>
        {isCreatingFolder && (
            <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleCreateFolder}
                className="mb-4 overflow-hidden shrink-0"
            >
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg max-w-md">
                    <FolderIcon className="w-5 h-5 text-slate-400 ml-2" />
                    <input 
                        autoFocus
                        type="text" 
                        value={newFolderName} 
                        onChange={e => setNewFolderName(e.target.value)}
                        placeholder="Name this reef..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                        onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                    />
                    <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold">Create</button>
                </div>
            </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pb-10 pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            
            {/* Folder Grid (Only at root) */}
            {currentFolderId === null && folders?.map(folder => (
                renamingFolderId === folder.id ? (
                    <form 
                        key={folder.id} 
                        onSubmit={handleRenameFolder}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-center h-32"
                    >
                        <input 
                            autoFocus
                            className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-sm text-center"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={handleRenameFolder}
                        />
                    </form>
                ) : (
                    <div 
                        key={folder.id}
                        onClick={() => setCurrentFolderId(folder.id!)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnFolder(e, folder.id!)}
                        className="group bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all relative"
                    >
                        <FolderIcon className="w-10 h-10 text-blue-300 group-hover:text-blue-500 mb-2 transition-colors" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-blue-700 truncate w-full text-center px-2">{folder.name}</span>
                        
                        <button 
                            onClick={(e) => startRename(folder, e)}
                            className="absolute top-2 right-2 p-1.5 bg-white text-slate-400 hover:text-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                    </div>
                )
            ))}

            {/* Asset Grid */}
            {filteredAssets?.map(asset => (
                <div 
                    key={asset.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, asset.id!)}
                    onClick={() => setSelectedAsset(asset)}
                    className="group relative bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-32 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                            {getFileIcon(asset.type)}
                        </div>
                        <button 
                            onClick={(e) => handleDeleteAsset(e, asset.id!)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Send to Depths"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 truncate mb-1">{asset.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{(asset.size / 1024).toFixed(0)} KB</span>
                    </div>

                    {/* Inspect Overlay */}
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-blue-600">
                        <ArrowUpRight className="w-6 h-6 mb-1" />
                        <span className="text-xs font-bold uppercase tracking-wider">Inspect</span>
                    </div>
                </div>
            ))}
        </div>

        {/* Empty State */}
        {(!folders?.length && !filteredAssets?.length && currentFolderId === null) && (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl mt-8">
                <p className="text-sm">The tank is empty.</p>
                <p className="text-xs opacity-50 mt-1">Create a Reef or drag items from the Live Well.</p>
             </div>
        )}
        
        {(currentFolderId !== null && !filteredAssets?.length) && (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl mt-8">
                <FolderOpen className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">This reef is uninhabited.</p>
             </div>
        )}
      </div>
    </div>
  );
};
