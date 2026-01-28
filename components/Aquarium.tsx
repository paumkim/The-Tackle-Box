import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  Trash2,
  Box,
  Info,
  ChevronRight,
  Search,
  LayoutGrid,
  List as ListIcon,
  Copy,
  Archive,
  ArrowRight,
  X,
  Layers,
  CheckCircle2,
  Lock,
  PanelLeft,
  PanelRight,
  Upload,
  ExternalLink,
  ArrowUpRight,
  Waves
} from 'lucide-react';
import { Asset, ViewState } from '../types';
import { LightTable } from './LightTable';
import { NotificationManager } from '../utils/notifications';
import { useAppStore } from '../store';

export const Aquarium: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(() => {
    const saved = localStorage.getItem('tackle_aquarium_folder');
    return saved ? parseInt(saved) : null;
  });
  
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [inspectAsset, setInspectAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST'); 
  const [showLeftPanel, setShowLeftPanel] = useState(window.innerWidth >= 768);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 48;
  const OVERSCAN = 5;
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const openContextMenu = useAppStore(state => state.openContextMenu);
  const requestNavigation = useAppStore(state => state.requestNavigation);
  const setSonarOpen = useAppStore(state => state.setSonarOpen);

  useEffect(() => {
    if (currentFolderId === null) localStorage.removeItem('tackle_aquarium_folder');
    else localStorage.setItem('tackle_aquarium_folder', currentFolderId.toString());
  }, [currentFolderId]);

  useEffect(() => {
      if (selection.size > 0 && window.innerWidth >= 1280) setShowRightPanel(true);
      else if (selection.size === 0) setShowRightPanel(false);
  }, [selection]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);
  const folders = useLiveQuery(() => db.folders.toArray());
  const assets = useLiveQuery(() => db.assets.filter(a => !a.deletedAt).toArray());
  const currentFolder = folders?.find(f => f.id === currentFolderId);

  const rowItems = useMemo(() => {
      const visibleFolders = currentFolderId === null ? (folders?.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) || []) : [];
      const visibleAssets = assets?.filter(a => {
        const matchesFolder = currentFolderId === null ? !a.folderId : a.folderId === currentFolderId;
        if (searchQuery) return a.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder;
      }) || [];
      return [...visibleFolders.map(f => ({ ...f, kind: 'folder' as const, key: `f-${f.id}` })), ...visibleAssets.map(a => ({ ...a, kind: 'asset' as const, key: `a-${a.id}` }))];
  }, [folders, assets, currentFolderId, searchQuery]);

  const totalListHeight = rowItems.length * ROW_HEIGHT;
  const viewportHeight = scrollContainerRef.current?.clientHeight || 800;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(rowItems.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleListItems = rowItems.slice(startIndex, endIndex);

  const handleSelection = (e: React.MouseEvent, key: string, index: number) => {
      e.stopPropagation();
      let newSet = new Set(e.ctrlKey || e.metaKey ? selection : []);
      if (e.shiftKey && lastSelectedIndex !== -1) {
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          for (let i = start; i <= end; i++) if (rowItems[i]) newSet.add(rowItems[i].key);
      } else {
          if (e.ctrlKey || e.metaKey) { if (newSet.has(key)) newSet.delete(key); else newSet.add(key); }
          else { if (!newSet.has(key) || newSet.size > 1) { newSet.clear(); newSet.add(key); } }
          setLastSelectedIndex(index);
      }
      setSelection(newSet);
  };

  const clearSelection = () => { setSelection(new Set()); setLastSelectedIndex(-1); };
  const handleCreateFolder = async (e: React.FormEvent) => { e.preventDefault(); if (newFolderName.trim()) { await db.folders.add({ name: newFolderName, createdAt: Date.now() }); setNewFolderName(''); setIsNewFolderOpen(false); } };
  const handleUploadFile = () => document.getElementById('aquarium-upload')?.click();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList) return;
      const files = Array.from(fileList) as File[];
      if (files.length > 0) {
          for (const file of files) {
              const fileType = String(file.type || '');
              await db.assets.add({ 
                  name: file.name, 
                  type: fileType, 
                  size: file.size, 
                  data: file, 
                  createdAt: Date.now(), 
                  location: 'aquarium', 
                  folderId: currentFolderId || undefined, 
                  species: fileType.startsWith('image') ? 'Scales' : 'Shells' 
              });
          }
          NotificationManager.send("Upload Complete", `${files.length} items added to deck.`);
      }
  };

  const getSelectedIds = () => {
      const assetIds: number[] = []; const folderIds: number[] = [];
      selection.forEach(key => { const [type, idStr] = key.split('-'); const id = parseInt(idStr); if (type === 'a') assetIds.push(id); if (type === 'f') folderIds.push(id); });
      return { assetIds, folderIds };
  };

  const executeDelete = async () => {
      const { assetIds, folderIds } = getSelectedIds();
      setIsDeleteModalOpen(false); clearSelection();
      if (assetIds.length > 0) await db.assets.where('id').anyOf(assetIds).modify({ deletedAt: Date.now() });
      if (folderIds.length > 0) for (const fId of folderIds) { await db.assets.where('folderId').equals(fId).modify({ deletedAt: Date.now() }); await db.folders.delete(fId); }
      NotificationManager.send("Command Executed", `${assetIds.length + folderIds.length} items moved to The Depths.`);
  };

  const handleBulkArchive = async () => {
      let archiveFolder = folders?.find(f => f.name === 'Archive');
      let archiveId = archiveFolder?.id || await db.folders.add({ name: 'Archive', createdAt: Date.now() }) as number;
      const { assetIds } = getSelectedIds();
      if (assetIds.length > 0) await db.assets.where('id').anyOf(assetIds).modify({ folderId: archiveId });
      clearSelection();
  };

  const handleBulkDuplicate = async () => {
      const { assetIds } = getSelectedIds();
      const assetsToClone = await db.assets.where('id').anyOf(assetIds).toArray();
      for (const asset of assetsToClone) await db.assets.add({ ...asset, id: undefined, name: `${asset.name} (Copy)`, createdAt: Date.now() });
      clearSelection();
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'EMPTY' | 'FOLDER' | 'ASSET', target?: any) => {
      e.preventDefault(); e.stopPropagation();
      let newSet = new Set(selection);
      if (target && !selection.has(target.key)) { newSet.clear(); newSet.add(target.key); setSelection(newSet); }
      else if (type === 'EMPTY') { newSet.clear(); setSelection(newSet); }
      const finalType = newSet.size > 1 ? 'MULTI' : type;
      const x = Math.min(e.clientX, window.innerWidth - 220);
      const y = Math.min(e.clientY, window.innerHeight - 300);
      if (finalType === 'EMPTY') {
          openContextMenu({ x, y, header: 'Bridge Command', items: [{ label: 'New Folder', action: () => setIsNewFolderOpen(true), icon: 'FolderPlus' }, { label: 'Upload File', action: () => handleUploadFile(), icon: 'Upload' }, { type: 'SEPARATOR', label: '', action: () => {} }, { label: 'Go to Bridge', action: () => requestNavigation(ViewState.DASHBOARD), icon: 'LayoutDashboard' }, { label: 'Go to Deck', action: () => requestNavigation(ViewState.TASKS), icon: 'CheckSquare' }] });
      } else {
          const items = [];
          if (finalType === 'ASSET') items.push({ label: 'Open', action: () => setInspectAsset(target), icon: 'ExternalLink' });
          if (finalType === 'FOLDER') items.push({ label: 'Open Folder', action: () => setCurrentFolderId(target.id), icon: 'FolderOpen' });
          items.push({ type: 'SEPARATOR', label: '', action: () => {} }, { label: 'Move', action: () => setIsMoveModalOpen(true), icon: 'ArrowUpRight' }, { label: 'Duplicate', action: handleBulkDuplicate, icon: 'Copy' }, { label: 'Archive', action: handleBulkArchive, icon: 'Archive' }, { type: 'SEPARATOR', label: '', action: () => {} }, { label: 'Delete', action: () => setIsDeleteModalOpen(true), icon: 'Trash2', danger: true });
          openContextMenu({ x, y, header: finalType === 'MULTI' ? 'Batch Actions' : 'Asset Control', items: items as any });
      }
  };

  const handleDragStart = (e: React.DragEvent, key: string) => { if (!selection.has(key)) setSelection(new Set([key])); e.dataTransfer.setData('application/tackle-bulk', 'true'); };
  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: number | null) => { e.preventDefault(); if (e.dataTransfer.getData('application/tackle-bulk')) { const { assetIds } = getSelectedIds(); if (assetIds.length > 0) await db.assets.where('id').anyOf(assetIds).modify({ folderId: targetFolderId || undefined }); clearSelection(); } };

  const getFileIcon = (type: unknown, className = "w-5 h-5") => {
    const typeStr = String(type || '');
    if (typeStr.startsWith('image/')) return <ImageIcon className={`${className} text-blue-500`} />;
    if (typeStr.startsWith('video/')) return <Video className={`${className} text-purple-500`} />;
    if (typeStr.startsWith('audio/')) return <Music className={`${className} text-pink-500`} />;
    if (typeStr.includes('pdf')) return <Box className={`${className} text-orange-500`} />;
    return <FileText className={`${className} text-slate-400`} />;
  };

  const formatSize = (bytes: number) => { if (bytes === 0) return '0 B'; const k = 1024; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i]; };
  const selectedCount = selection.size;
  
  const singleAsset = useMemo(() => {
    if (selectedCount !== 1) return null;
    const firstKey = Array.from(selection)[0];
    if (typeof firstKey === 'string' && firstKey.startsWith('a-')) {
        return assets?.find(a => `a-${a.id}` === firstKey) || null;
    }
    return null;
  }, [selectedCount, selection, assets]);

  return (
    <div className="bridge-container-standard">
      <header className="bridge-header-standard">
        <div className="flex-1 flex flex-col overflow-hidden">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif truncate">
                <Waves className="w-6 h-6 text-slate-600 shrink-0" />
                The Aquarium
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                <button onClick={() => { setCurrentFolderId(null); clearSelection(); }} className={`hover:text-blue-600 text-sm font-bold uppercase tracking-wider ${currentFolderId === null ? 'text-blue-600' : 'text-slate-400'}`}>Root</button>
                {currentFolder && (
                    <>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wider truncate flex items-center gap-2 bg-slate-100 px-2 py-0.5 rounded"><FolderOpen className="w-3 h-3" />{currentFolder.name}</span>
                    </>
                )}
            </h2>
            <p className="text-slate-500 font-serif italic text-sm mt-1">Cargo & Asset Management Tree</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsNewFolderOpen(true)} className="p-2 hover:bg-slate-100 rounded text-slate-600" title="New Folder"><FolderPlus className="w-5 h-5" /></button>
            <button onClick={handleUploadFile} className="p-2 hover:bg-slate-100 rounded text-slate-600" title="Upload File"><Upload className="w-5 h-5" /></button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded-sm ${viewMode === 'LIST' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}><ListIcon className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded-sm ${viewMode === 'GRID' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
        </div>
      </header>

      <div className="px-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <button onClick={() => setShowLeftPanel(!showLeftPanel)} className={`flex items-center gap-1 text-[10px] font-bold uppercase border px-2 py-1 rounded transition-all ${showLeftPanel ? 'bg-white border-slate-300 text-slate-800' : 'bg-transparent border-transparent text-slate-400'}`}><PanelLeft className="w-3 h-3" /> Tree</button>
              {selectedCount > 0 && <button onClick={() => setShowRightPanel(!showRightPanel)} className={`flex items-center gap-1 text-[10px] font-bold uppercase border px-2 py-1 rounded transition-all ${showRightPanel ? 'bg-white border-slate-300 text-slate-800' : 'bg-transparent border-transparent text-slate-400'}`}><PanelRight className="w-3 h-3" /> Inspector</button>}
          </div>
          <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Filter..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono uppercase focus:outline-none focus:border-blue-400 w-40" />
          </div>
      </div>

      <div className="bridge-body-standard flex-row p-0">
          <LightTable asset={inspectAsset} onClose={() => setInspectAsset(null)} />
          <input type="file" id="aquarium-upload" className="hidden" multiple onChange={handleFileChange} />

          {isDeleteModalOpen && (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20" onClick={() => setIsDeleteModalOpen(false)}><div className="w-96 bg-[#fdfbf7] border-2 border-amber-700/50 shadow-2xl p-6" onClick={e => e.stopPropagation()}><h3 className="font-serif font-bold text-slate-900 uppercase tracking-widest text-xs mb-4 border-b border-amber-900/10 pb-2 flex items-center gap-2"><Lock className="w-3 h-3 text-amber-700" /> Safety Interlock</h3><p className="text-sm font-serif text-slate-700 mb-6 leading-relaxed">Commit {selectedCount} items to The Depths?</p><div className="flex gap-3"><button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 border border-slate-300 text-slate-600 font-bold text-xs uppercase rounded-sm">Abort</button><button onClick={executeDelete} className="flex-1 py-3 bg-slate-900 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 rounded-sm shadow-md"><Trash2 className="w-3 h-3" /> Commit</button></div></div></div>)}
          {isNewFolderOpen && (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20" onClick={() => setIsNewFolderOpen(false)}><div className="bg-[#fdfbf7] p-6 rounded-xl shadow-2xl border border-stone-200 w-80" onClick={e => e.stopPropagation()}><h3 className="text-sm font-serif font-bold text-slate-800 mb-4">New Folder</h3><form onSubmit={handleCreateFolder}><input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="w-full bg-white border border-amber-200/50 rounded p-2 text-sm outline-none" placeholder="Name..." /><div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setIsNewFolderOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase">Cancel</button><button type="submit" className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-sm uppercase">Create</button></div></form></div></div>)}

          {showLeftPanel && (<div className={`bg-slate-50 border-r border-stone-200 flex flex-col shrink-0 w-52 ${window.innerWidth < 768 ? 'absolute left-0 top-0 bottom-0 z-40' : 'relative'}`}><div className="flex-1 overflow-y-auto p-2 space-y-0.5"><div onClick={() => { setCurrentFolderId(null); clearSelection(); if (window.innerWidth < 768) setShowLeftPanel(false); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnFolder(e, null)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-[10px] font-bold uppercase tracking-wider ${currentFolderId === null ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><FolderIcon className="w-3 h-3" />Root</div>{folders?.map(folder => (<div key={folder.id} onClick={() => { setCurrentFolderId(folder.id!); clearSelection(); if (window.innerWidth < 768) setShowLeftPanel(false); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnFolder(e, folder.id!)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-[10px] font-bold uppercase tracking-wider truncate ${currentFolderId === folder.id ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}><FolderIcon className="w-3 h-3" />{folder.name}</div>))}</div></div>)}

          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {viewMode === 'LIST' && rowItems.length > 0 && (<div className="flex items-center bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200 h-8 shrink-0"><div className="w-12 text-center">Type</div><div className="flex-1 px-4">Name</div><div className="w-32 hidden md:block px-4">Modified</div><div className="w-24 text-right hidden sm:block px-4">Size</div></div>)}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar relative" onClick={() => clearSelection()} onContextMenu={(e) => handleContextMenu(e, 'EMPTY')} onScroll={handleScroll}>
                  {rowItems.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-slate-300 font-serif italic"><p className="text-sm">Cargo Hold Empty</p></div>)}
                  {viewMode === 'GRID' && (<div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{rowItems.map((item, index) => { const isSelected = selection.has(item.key); return (<div key={item.key} draggable onDragStart={(e) => handleDragStart(e, item.key)} onDragOver={(e) => item.kind === 'folder' ? e.preventDefault() : undefined} onDrop={(e) => item.kind === 'folder' ? handleDropOnFolder(e, item.id!) : undefined} onClick={(e) => handleSelection(e, item.key, index)} onDoubleClick={() => { if (item.kind === 'folder') { setCurrentFolderId(item.id!); clearSelection(); } else setInspectAsset(item as Asset); }} onContextMenu={(e) => handleContextMenu(e, item.kind === 'folder' ? 'FOLDER' : 'ASSET', item)} className={`group p-4 rounded-xl border flex flex-col items-center text-center gap-3 cursor-pointer relative ${isSelected ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>{isSelected && <div className="absolute top-2 right-2 text-blue-500"><CheckCircle2 className="w-4 h-4 fill-blue-100" /></div>}<div className={`w-12 h-12 flex items-center justify-center rounded-lg ${isSelected ? 'bg-white' : 'bg-slate-50 group-hover:bg-white'}`}>{item.kind === 'folder' ? <FolderIcon className="w-12 h-12 text-blue-300 fill-current" /> : getFileIcon((item as any).type, "w-6 h-6")}</div><div className="w-full"><div className={`text-xs font-medium truncate w-full ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{item.name}</div><div className="text-[10px] text-slate-400 mt-0.5">{item.kind === 'asset' ? formatSize((item as Asset).size) : 'Folder'}</div></div></div>);})}</div>)}
                  {viewMode === 'LIST' && rowItems.length > 0 && (<div className="relative w-full" style={{ height: `${totalListHeight}px` }}>{visibleListItems.map((item, index) => { const actualIndex = startIndex + index; const isSelected = selection.has(item.key); return (<div key={item.key} className={`absolute top-0 left-0 w-full h-[48px] flex items-center text-xs border-b border-slate-50 hover:bg-slate-50 cursor-pointer select-none transition-colors ${isSelected ? 'bg-blue-50 border-blue-100 text-blue-900 font-bold' : 'text-slate-700'}`} style={{ transform: `translateY(${actualIndex * ROW_HEIGHT}px)` }} draggable onDragStart={(e) => handleDragStart(e, item.key)} onDragOver={(e) => item.kind === 'folder' ? e.preventDefault() : undefined} onDrop={(e) => item.kind === 'folder' ? handleDropOnFolder(e, item.id!) : undefined} onClick={(e) => handleSelection(e, item.key, actualIndex)} onDoubleClick={() => { if (item.kind === 'folder') { setCurrentFolderId(item.id!); clearSelection(); } else setInspectAsset(item as Asset); }} onContextMenu={(e) => handleContextMenu(e, item.kind === 'folder' ? 'FOLDER' : 'ASSET', item)}><div className="w-12 flex justify-center shrink-0">{item.kind === 'folder' ? <FolderIcon className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-blue-300'} fill-current`} /> : getFileIcon((item as any).type, "w-4 h-4")}</div><div className="flex-1 px-4 truncate font-medium">{item.name}</div><div className="w-32 px-4 hidden md:block text-slate-400 font-mono text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</div><div className="w-24 px-4 hidden sm:block text-right text-slate-400 font-mono text-[10px]">{item.kind === 'asset' ? formatSize((item as Asset).size) : '--'}</div></div>);})}</div>)}
              </div>
              {selectedCount >= 2 && (<div className="absolute bottom-0 left-0 right-0 bg-[#F8F9FA] border-t border-stone-300 p-3 shadow-lg flex items-center justify-between z-30"><div className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded border border-slate-300 uppercase">{selectedCount} Selection</div><div className="flex items-center gap-2"><button onClick={() => setIsMoveModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-300 rounded text-[10px] font-bold uppercase"><ArrowRight className="w-3 h-3" /> Move</button><button onClick={handleBulkArchive} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-300 rounded text-[10px] font-bold uppercase"><Archive className="w-3 h-3" /> Archive</button><button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-bold uppercase bg-amber-50 border-amber-200 text-amber-900/50"><Lock className="w-3 h-3" /> Purge</button></div></div>)}
          </div>

          {showRightPanel && selectedCount > 0 && (<div className={`bg-white border-l border-stone-200 flex flex-col shrink-0 h-full overflow-y-auto w-64 shadow-xl ${window.innerWidth < 1280 ? 'absolute right-0 top-0 bottom-0 z-30' : 'relative'}`}>{singleAsset ? (<div className="min-w-[240px]"><div className="p-6 border-b border-stone-100 flex flex-col items-center text-center bg-slate-50/50"><div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-4 shadow-sm">{getFileIcon(singleAsset.type, "w-8 h-8")}</div><h3 className="font-serif font-bold text-slate-800 text-sm leading-tight break-words w-full">{singleAsset.name}</h3><span className="text-[9px] text-slate-400 mt-2 uppercase font-mono">{singleAsset.type}</span></div><div className="p-4 space-y-6"><div className="space-y-3"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Info</h4><div className="grid grid-cols-2 gap-y-3 text-[10px]"><div className="text-slate-500 font-serif">Size</div><div className="text-slate-800 font-mono text-right">{formatSize(singleAsset.size)}</div><div className="text-slate-500 font-serif">Location</div><div className="text-slate-800 font-mono text-right truncate pl-2">{currentFolder ? currentFolder.name : 'Root'}</div></div></div><div className="flex flex-col gap-2"><button onClick={() => setInspectAsset(singleAsset)} className="w-full py-2 bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"><Info className="w-3 h-3" /> Open</button></div></div></div>) : (<div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50"><div className="w-16 h-16 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center mb-4"><Layers className="w-6 h-6 text-slate-300" /></div><h3 className="font-serif font-bold text-slate-800 text-sm">{selectedCount} Selection</h3></div>)}</div>)}
      </div>
    </div>
  );
};