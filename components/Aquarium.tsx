
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
  Plus,
  Trash2,
  Box,
  Info,
  HardDrive,
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
  FolderPlus,
  Upload,
  ExternalLink,
  Edit2,
  MoreVertical,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { Asset } from '../types';
import { LightTable } from './LightTable';
import { NotificationManager } from '../utils/notifications';

// Audio Helper (Synthetic Mechanical Click)
const playSafetyClick = (type: 'LIFT' | 'ENGAGE') => {
    try {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'LIFT') {
            // High pitch metallic click (spring release)
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
        } else {
            // Heavy thud (engage)
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        }
    } catch (e) {
        // Audio policy prevention
    }
};

export const Aquarium: React.FC = () => {
  // State
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(() => {
    const saved = localStorage.getItem('tackle_aquarium_folder');
    return saved ? parseInt(saved) : null;
  });
  
  // Selection State
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [inspectAsset, setInspectAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST'); 
  
  // Panel Visibility (Responsive)
  const [showLeftPanel, setShowLeftPanel] = useState(window.innerWidth >= 768);
  const [showRightPanel, setShowRightPanel] = useState(window.innerWidth >= 1280);

  // Modal State
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, type: 'EMPTY' | 'FOLDER' | 'ASSET' | 'MULTI', target?: any} | null>(null);
  const longPressTimer = useRef<number | null>(null);

  // Persist navigation
  useEffect(() => {
    if (currentFolderId === null) {
      localStorage.removeItem('tackle_aquarium_folder');
    } else {
      localStorage.setItem('tackle_aquarium_folder', currentFolderId.toString());
    }
  }, [currentFolderId]);

  // Close context menu on global click
  useEffect(() => {
      const handleClick = () => setContextMenu(null);
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
  }, []);

  // Responsive Handler
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 768) setShowLeftPanel(false);
          if (window.innerWidth < 1280) setShowRightPanel(false);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-show inspector on selection (if screen large enough)
  useEffect(() => {
      if (selection.size === 1 && window.innerWidth >= 1280) {
          setShowRightPanel(true);
      }
  }, [selection]);

  // Data Fetching
  const folders = useLiveQuery(() => db.folders.toArray());
  const assets = useLiveQuery(() => db.assets.filter(a => !a.deletedAt).toArray());

  // Filtering
  const currentFolder = folders?.find(f => f.id === currentFolderId);

  // Flattened List for Rendering & Range Selection
  const rowItems = useMemo(() => {
      const visibleFolders = currentFolderId === null 
        ? (folders?.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) || [])
        : [];
      
      const visibleAssets = assets?.filter(a => {
        const matchesFolder = currentFolderId === null 
            ? !a.folderId 
            : a.folderId === currentFolderId;
        
        if (searchQuery) {
            return a.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return matchesFolder;
      }) || [];

      return [
          ...visibleFolders.map(f => ({ ...f, kind: 'folder' as const, key: `f-${f.id}` })),
          ...visibleAssets.map(a => ({ ...a, kind: 'asset' as const, key: `a-${a.id}` }))
      ];
  }, [folders, assets, currentFolderId, searchQuery]);

  // Selection Logic
  const handleSelection = (e: React.MouseEvent, key: string, index: number) => {
      // If dragging, don't trigger select? (Standard OS behavior handles this, simplifying for web)
      // e.stopPropagation(); // Allow events to bubble if needed for drag, but usually selection stops prop
      
      let newSet = new Set(e.ctrlKey || e.metaKey ? selection : []);
      
      if (e.shiftKey && lastSelectedIndex !== -1) {
          // Range Select
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          for (let i = start; i <= end; i++) {
              if (rowItems[i]) newSet.add(rowItems[i].key);
          }
      } else {
          // Single / Toggle
          if (e.ctrlKey || e.metaKey) {
              if (newSet.has(key)) newSet.delete(key);
              else newSet.add(key);
          } else {
              if (!newSet.has(key) || newSet.size > 1) { // If clicking unselected or multi-group, reset
                  newSet.clear();
                  newSet.add(key);
              }
          }
          setLastSelectedIndex(index);
      }
      
      setSelection(newSet);
  };

  const clearSelection = () => {
      setSelection(new Set());
      setLastSelectedIndex(-1);
  };

  // Actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await db.folders.add({ name: newFolderName, createdAt: Date.now() });
      setNewFolderName('');
      setIsNewFolderOpen(false);
    }
  };

  const handleUploadFile = () => {
      document.getElementById('aquarium-upload')?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length > 0) {
          for (const file of files) {
              await db.assets.add({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: file,
                  createdAt: Date.now(),
                  location: 'aquarium',
                  folderId: currentFolderId || undefined,
                  species: file.type.startsWith('image') ? 'Scales' : 'Shells'
              });
          }
          NotificationManager.send("Upload Complete", `${files.length} items added to deck.`);
      }
  };

  // --- Context Menu Logic ---
  const handleContextMenu = (e: React.MouseEvent, type: 'EMPTY' | 'FOLDER' | 'ASSET', target?: any) => {
      e.preventDefault();
      e.stopPropagation();
      
      let newSet = new Set(selection);

      // Unified Context Protocol: Smart Selection Update
      if (target) {
          // If the item right-clicked is NOT in the current selection, select ONLY it
          if (!selection.has(target.key)) {
              newSet.clear();
              newSet.add(target.key);
              setSelection(newSet);
              // Update Last Selected Index for Shift-Click continuity
              const index = rowItems.findIndex(i => i.key === target.key);
              setLastSelectedIndex(index);
          }
          // If it IS in the selection, do not change selection (allows bulk action on existing selection)
      } else {
          // Right clicking empty space (Desks usually deselect files on background click)
          if (type === 'EMPTY') {
              newSet.clear();
              setSelection(newSet);
          }
      }

      // Hybrid Interaction: Snap-open the Inspector on desktop if we have a valid asset selection
      if ((type === 'ASSET' || type === 'FOLDER') && window.innerWidth >= 1280) {
          setShowRightPanel(true);
      }

      // Determine context menu type based on resulting selection
      const finalType = newSet.size > 1 ? 'MULTI' : type;

      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          type: finalType,
          target
      });
  };

  const handleTouchStart = (type: 'EMPTY' | 'FOLDER' | 'ASSET', target?: any, e?: React.TouchEvent) => {
      longPressTimer.current = window.setTimeout(() => {
          if (e) {
              const touch = e.touches[0];
              setContextMenu({
                  x: touch.clientX,
                  y: touch.clientY,
                  type,
                  target
              });
          }
      }, 600); // 600ms long press
  };

  const handleTouchEnd = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  // --- Bulk Operations ---

  const getSelectedIds = () => {
      const assetIds: number[] = [];
      const folderIds: number[] = [];
      selection.forEach(key => {
          const [type, idStr] = key.split('-');
          const id = parseInt(idStr);
          if (type === 'a') assetIds.push(id);
          if (type === 'f') folderIds.push(id);
      });
      return { assetIds, folderIds };
  };

  const openDeleteModal = () => {
      setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
      const { assetIds, folderIds } = getSelectedIds();
      playSafetyClick('ENGAGE');
      
      // Close modal immediately for snap feel
      setIsDeleteModalOpen(false); 
      clearSelection(); // Clear selection immediately

      // Background process for moving to Depths
      (async () => {
          if (assetIds.length > 0) {
              await db.assets.where('id').anyOf(assetIds).modify({ deletedAt: Date.now() });
          }
          
          if (folderIds.length > 0) {
              for (const fId of folderIds) {
                  // Soft delete contents inside folders
                  await db.assets.where('folderId').equals(fId).modify({ deletedAt: Date.now() });
                  // Folders are hard deleted from structure, but contents persist in Depths
                  await db.folders.delete(fId); 
              }
          }
          NotificationManager.send("Command Executed", `${assetIds.length + folderIds.length} items moved to The Depths.`);
      })();
  };

  const handleBulkArchive = async () => {
      // Find or Create "Archive" folder
      let archiveFolder = folders?.find(f => f.name === 'Archive');
      let archiveId = archiveFolder?.id;
      
      if (!archiveId) {
          archiveId = await db.folders.add({ name: 'Archive', createdAt: Date.now() }) as number;
      }

      const { assetIds } = getSelectedIds();
      if (assetIds.length > 0) {
          await db.assets.where('id').anyOf(assetIds).modify({ folderId: archiveId });
      }
      clearSelection();
  };

  const handleBulkDuplicate = async () => {
      const { assetIds } = getSelectedIds();
      const assetsToClone = await db.assets.where('id').anyOf(assetIds).toArray();
      
      for (const asset of assetsToClone) {
          await db.assets.add({
              ...asset,
              id: undefined, // New ID
              name: `${asset.name} (Copy)`,
              createdAt: Date.now()
          });
      }
      clearSelection();
  };

  const handleBulkMoveConfirm = async (targetFolderId: number | null) => {
      const { assetIds } = getSelectedIds();
      if (assetIds.length > 0) {
          await db.assets.where('id').anyOf(assetIds).modify({ folderId: targetFolderId || undefined });
      }
      setIsMoveModalOpen(false);
      clearSelection();
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, key: string) => {
      // If dragging selection, keep it. If dragging unselected, select it.
      if (!selection.has(key)) {
          setSelection(new Set([key]));
      }
      e.dataTransfer.setData('application/tackle-bulk', 'true');
  };

  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: number | null) => {
      e.preventDefault();
      const isBulk = e.dataTransfer.getData('application/tackle-bulk');
      
      if (isBulk) {
          const { assetIds } = getSelectedIds();
          if (assetIds.length > 0) {
              await db.assets.where('id').anyOf(assetIds).modify({ folderId: targetFolderId || undefined });
          }
          clearSelection();
      }
  };

  // Icons
  const getFileIcon = (type: any, className = "w-5 h-5") => {
    const typeStr = String(type || '');
    if (typeStr.startsWith('image/')) return <ImageIcon className={`${className} text-blue-500`} />;
    if (typeStr.startsWith('video/')) return <Video className={`${className} text-purple-500`} />;
    if (typeStr.startsWith('audio/')) return <Music className={`${className} text-pink-500`} />;
    if (typeStr.includes('pdf')) return <Box className={`${className} text-orange-500`} />;
    return <FileText className={`${className} text-slate-400`} />;
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Derived State for Inspector
  const selectedCount = selection.size;
  const selectionList = Array.from(selection);
  const singleAsset = selectedCount === 1 && typeof selectionList[0] === 'string' && selectionList[0].startsWith('a-') 
      ? assets?.find(a => `a-${a.id}` === selectionList[0]) 
      : null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-white">
      <LightTable asset={inspectAsset} onClose={() => setInspectAsset(null)} />
      
      {/* Hidden File Input */}
      <input type="file" id="aquarium-upload" className="hidden" multiple onChange={handleFileChange} />

      {/* Deletion Modal (The Native Terminal) */}
      {isDeleteModalOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-grayscale-[0.5]" 
            onClick={() => setIsDeleteModalOpen(false)}
          >
              <div 
                className="w-96 bg-[#fdfbf7] border-2 border-amber-700/50 shadow-2xl p-6 relative" 
                onClick={e => e.stopPropagation()}
              >
                  {/* Decorative Screws */}
                  <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-amber-900/20"></div>
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-900/20"></div>
                  <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-amber-900/20"></div>
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-900/20"></div>

                  <h3 className="font-serif font-bold text-slate-900 uppercase tracking-widest text-xs mb-4 border-b border-amber-900/10 pb-2 flex items-center gap-2">
                      <Lock className="w-3 h-3 text-amber-700" />
                      Safety Interlock
                  </h3>
                  
                  <p className="text-sm font-serif text-slate-700 mb-6 leading-relaxed">
                      Commit {selectedCount} item{selectedCount > 1 ? 's' : ''} to The Depths? 
                      <span className="block text-xs text-slate-500 mt-2 italic flex items-center gap-1">
                          <Archive className="w-3 h-3" />
                          Items can be recovered from the Archive.
                      </span>
                  </p>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => setIsDeleteModalOpen(false)}
                          className="flex-1 py-3 border border-slate-300 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors rounded-sm"
                      >
                          Abort
                      </button>
                      <button 
                          onClick={executeDelete}
                          className="flex-1 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 rounded-sm shadow-md"
                      >
                          <Trash2 className="w-3 h-3" /> Commit
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsNewFolderOpen(false)}>
            <div className="bg-[#fdfbf7] p-6 rounded-xl shadow-2xl border border-stone-200 w-80 relative overflow-hidden" onClick={e => e.stopPropagation()}>
               {/* Paper Texture */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
               
               <div className="relative z-10">
                   <h3 className="text-sm font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <FolderPlus className="w-4 h-4 text-blue-500" /> New Folder
                   </h3>
                   <form onSubmit={handleCreateFolder}>
                     <input 
                       autoFocus
                       value={newFolderName}
                       onChange={e => setNewFolderName(e.target.value)}
                       className="w-full bg-white border border-amber-200/50 rounded p-2 text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 placeholder:text-slate-300 font-medium font-serif"
                       placeholder="Name your reef..."
                     />
                     <div className="flex justify-end gap-2 mt-4">
                       <button type="button" onClick={() => setIsNewFolderOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">Cancel</button>
                       <button type="submit" className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-sm hover:bg-slate-700 uppercase tracking-wider">Create</button>
                     </div>
                   </form>
               </div>
            </div>
          </div>
      )}

      {/* Context Menu - Unified Aged Brass Aesthetic */}
      {contextMenu && (
          <div 
            className="fixed z-[100] bg-[#fdfbf7] border border-amber-900/20 rounded-sm shadow-2xl py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-75 overflow-hidden"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 220), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 border-b border-amber-900/10 bg-stone-50/50">
                  {contextMenu.type === 'EMPTY' ? 'Deck Commands' : (contextMenu.type === 'MULTI' ? 'Batch Actions' : 'Asset Control')}
              </div>
              
              {contextMenu.type === 'EMPTY' && (
                  <>
                      <button onClick={() => { setIsNewFolderOpen(true); setContextMenu(null); }} className="w-full px-4 py-2 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center gap-3">
                          <FolderPlus className="w-4 h-4 text-blue-500" /> New Folder
                      </button>
                      <button onClick={() => { handleUploadFile(); setContextMenu(null); }} className="w-full px-4 py-2 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center gap-3">
                          <Upload className="w-4 h-4 text-slate-500" /> Upload File
                      </button>
                  </>
              )}

              {(contextMenu.type === 'FOLDER' || contextMenu.type === 'ASSET' || contextMenu.type === 'MULTI') && (
                  <>
                      {contextMenu.type === 'ASSET' && (
                          <button onClick={() => { setInspectAsset(contextMenu.target); setContextMenu(null); }} className="w-full px-4 py-2 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center gap-3">
                              <ExternalLink className="w-4 h-4 text-slate-500" /> Open
                          </button>
                      )}
                      {contextMenu.type === 'FOLDER' && (
                          <button onClick={() => { setCurrentFolderId(contextMenu.target.id); setContextMenu(null); }} className="w-full px-4 py-2 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center gap-3">
                              <FolderOpen className="w-4 h-4 text-blue-500" /> Open Folder
                          </button>
                      )}
                      
                      <div className="h-px bg-amber-900/10 mx-2 my-1"></div>
                      
                      <button onClick={() => { setIsMoveModalOpen(true); setContextMenu(null); }} className="w-full px-4 py-2 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center gap-3">
                          <ArrowUpRight className="w-4 h-4 text-slate-500" /> Move
                      </button>
                      <button onClick={() => { handleBulkDuplicate(); setContextMenu(null); }} className="w-full px-4 py-2 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center gap-3">
                          <Copy className="w-4 h-4 text-slate-500" /> Duplicate
                      </button>
                      <button onClick={() => { handleBulkArchive(); setContextMenu(null); }} className="w-full px-4 py-2 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 flex items-center gap-3">
                          <Archive className="w-4 h-4 text-amber-500" /> Archive
                      </button>
                      
                      <div className="h-px bg-amber-900/10 mx-2 my-1"></div>
                      
                      <button 
                        onClick={() => { 
                            openDeleteModal();
                            setContextMenu(null); 
                        }} 
                        className="w-full px-4 py-2 hover:bg-red-50 text-left text-xs font-bold text-red-600 flex items-center gap-3"
                      >
                          <Trash2 className="w-4 h-4" /> Delete
                      </button>
                  </>
              )}
          </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
          {/* ... Rest of existing Aquarium UI ... */}
          
          {/* LEFT: Navigation Tree (Adaptive) */}
          {/* Mobile: Absolute Drawer / Desktop: Relative Col */}
          <div className={`
              bg-slate-50 border-r border-stone-200 flex flex-col shrink-0 transition-all duration-300
              ${showLeftPanel ? 'w-60 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-none'}
              ${window.innerWidth < 768 && showLeftPanel ? 'absolute left-0 top-0 bottom-0 z-40 shadow-xl' : 'relative'}
          `}>
              <div className="p-3 border-b border-stone-200 flex items-center justify-between bg-[#f8f9fa] min-w-[240px]">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <HardDrive className="w-3 h-3" /> Storage Tree
                  </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-w-[240px]">
                  <div 
                      onClick={() => { setCurrentFolderId(null); clearSelection(); if (window.innerWidth < 768) setShowLeftPanel(false); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropOnFolder(e, null)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-xs font-bold transition-colors ${currentFolderId === null ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                      <FolderIcon className={`w-3.5 h-3.5 ${currentFolderId === null ? 'fill-current' : 'text-slate-400'}`} />
                      Root
                  </div>
                  {folders?.map(folder => (
                      <div 
                          key={folder.id}
                          onClick={() => { setCurrentFolderId(folder.id!); clearSelection(); if (window.innerWidth < 768) setShowLeftPanel(false); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropOnFolder(e, folder.id!)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-xs font-medium transition-colors ${currentFolderId === folder.id ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                      >
                          <FolderIcon className={`w-3.5 h-3.5 ${currentFolderId === folder.id ? 'fill-current' : 'text-slate-400'}`} />
                          {folder.name}
                      </div>
                  ))}
              </div>
          </div>

          {/* CENTER: Main Explorer */}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative z-0">
              
              {/* Breadcrumb / Toolbar */}
              <div className="h-12 border-b border-stone-200 flex items-center px-4 justify-between shrink-0 bg-white z-10 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 overflow-hidden">
                      <button 
                        onClick={() => setShowLeftPanel(!showLeftPanel)}
                        className={`p-1.5 rounded hover:bg-slate-100 ${showLeftPanel ? 'text-blue-600' : 'text-slate-400'}`}
                        title="Toggle Storage Tree"
                      >
                          <PanelLeft className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-300 mx-1 shrink-0"></div>
                      
                      <button 
                        onClick={() => { setCurrentFolderId(null); clearSelection(); }} 
                        className={`hover:bg-slate-100 p-1 rounded truncate ${currentFolderId === null ? 'font-bold text-slate-900' : 'text-slate-500'}`}
                      >
                          Aquarium
                      </button>
                      {currentFolder && (
                          <>
                              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-2 truncate">
                                  <FolderOpen className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{currentFolder.name}</span>
                              </span>
                          </>
                      )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                      <div className="relative mr-2 hidden sm:block">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                              type="text" 
                              placeholder="Filter..." 
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-400 w-32 md:w-48 transition-all"
                          />
                      </div>
                      <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                          <button 
                            onClick={() => setViewMode('LIST')}
                            className={`p-1.5 rounded-sm ${viewMode === 'LIST' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                          >
                              <ListIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setViewMode('GRID')}
                            className={`p-1.5 rounded-sm ${viewMode === 'GRID' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                          >
                              <LayoutGrid className="w-4 h-4" />
                          </button>
                      </div>
                      
                      {selectedCount > 0 && (
                          <div className="border-l border-slate-200 pl-2 ml-2">
                              <button 
                                onClick={() => setShowRightPanel(!showRightPanel)}
                                className={`p-1.5 rounded hover:bg-slate-100 ${showRightPanel ? 'text-blue-600' : 'text-slate-400'}`}
                                title="Toggle Inspector"
                              >
                                  <PanelRight className="w-4 h-4" />
                              </button>
                          </div>
                      )}
                  </div>
              </div>

              {/* Content Area */}
              <div 
                className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-16 relative" 
                onClick={() => clearSelection()}
                onContextMenu={(e) => handleContextMenu(e, 'EMPTY')}
                onTouchStart={() => handleTouchStart('EMPTY', null)}
                onTouchEnd={handleTouchEnd}
              >
                  {/* Empty State */}
                  {rowItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300">
                          <FolderOpen className="w-16 h-16 mb-4 opacity-10" />
                          <p className="text-sm font-medium text-slate-400">Directory Empty</p>
                          <p className="text-xs text-slate-300 mt-1">Right-click to create new folder</p>
                      </div>
                  )}

                  {/* GRID VIEW */}
                  {viewMode === 'GRID' && (
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {rowItems.map((item, index) => {
                              const isSelected = selection.has(item.key);
                              return (
                                  <div 
                                      key={item.key}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, item.key)}
                                      onDragOver={(e) => item.kind === 'folder' ? e.preventDefault() : undefined}
                                      onDrop={(e) => item.kind === 'folder' ? handleDropOnFolder(e, item.id!) : undefined}
                                      onClick={(e) => handleSelection(e, item.key, index)}
                                      onDoubleClick={() => {
                                          if (item.kind === 'folder') {
                                              setCurrentFolderId(item.id!);
                                              clearSelection();
                                          } else {
                                              setInspectAsset(item as Asset);
                                          }
                                      }}
                                      onContextMenu={(e) => handleContextMenu(e, item.kind === 'folder' ? 'FOLDER' : 'ASSET', item)}
                                      onTouchStart={(e) => handleTouchStart(item.kind === 'folder' ? 'FOLDER' : 'ASSET', item, e)}
                                      onTouchEnd={handleTouchEnd}
                                      className={`group p-4 rounded-xl border flex flex-col items-center text-center gap-3 cursor-pointer relative ${
                                          isSelected
                                          ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm' 
                                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                      }`}
                                  >
                                      {/* Checkmark Overlay */}
                                      {isSelected && <div className="absolute top-2 right-2 text-blue-500"><CheckCircle2 className="w-4 h-4 fill-blue-100" /></div>}
                                      
                                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${item.kind === 'folder' ? 'text-blue-300' : ''} ${isSelected ? 'bg-white' : 'bg-slate-50 group-hover:bg-white'}`}>
                                          {item.kind === 'folder' 
                                            ? <FolderIcon className="w-12 h-12 fill-current" /> 
                                            : getFileIcon((item as any).type, "w-6 h-6")
                                          }
                                      </div>
                                      <div className="w-full">
                                          <div className={`text-xs font-medium truncate w-full ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{item.name}</div>
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                              {item.kind === 'asset' ? formatSize((item as Asset).size) : 'Folder'}
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}

                  {/* LIST VIEW */}
                  {viewMode === 'LIST' && (
                      <table className="w-full text-left border-collapse min-w-[300px]">
                          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200">
                              <tr>
                                  <th className="px-4 py-2 w-8"></th>
                                  <th className="px-4 py-2">Name</th>
                                  <th className="px-4 py-2 w-32 hidden md:table-cell">Date Modified</th>
                                  <th className="px-4 py-2 w-24 hidden lg:table-cell">Type</th>
                                  <th className="px-4 py-2 w-24 text-right hidden sm:table-cell">Size</th>
                              </tr>
                          </thead>
                          <tbody className="text-xs text-slate-700 font-mono divide-y divide-slate-100">
                              {rowItems.map((item, index) => {
                                  const isSelected = selection.has(item.key);
                                  return (
                                      <tr 
                                          key={item.key}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, item.key)}
                                          onDragOver={(e) => item.kind === 'folder' ? e.preventDefault() : undefined}
                                          onDrop={(e) => item.kind === 'folder' ? handleDropOnFolder(e, item.id!) : undefined}
                                          onClick={(e) => handleSelection(e, item.key, index)}
                                          onDoubleClick={() => {
                                              if (item.kind === 'folder') {
                                                  setCurrentFolderId(item.id!);
                                                  clearSelection();
                                              } else {
                                                  setInspectAsset(item as Asset);
                                              }
                                          }}
                                          onContextMenu={(e) => handleContextMenu(e, item.kind === 'folder' ? 'FOLDER' : 'ASSET', item)}
                                          onTouchStart={(e) => handleTouchStart(item.kind === 'folder' ? 'FOLDER' : 'ASSET', item, e)}
                                          onTouchEnd={handleTouchEnd}
                                          className={`cursor-pointer ${
                                              isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                                          }`}
                                      >
                                          <td className="px-4 py-2 text-center">
                                              {item.kind === 'folder' 
                                                ? <FolderIcon className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-blue-300'} fill-current`} /> 
                                                : getFileIcon((item as any).type, "w-4 h-4")
                                              }
                                          </td>
                                          <td className={`px-4 py-2 font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                              <div className="truncate max-w-[200px] md:max-w-xs">{item.name}</div>
                                          </td>
                                          <td className="px-4 py-2 text-slate-500 hidden md:table-cell">{new Date(item.createdAt).toLocaleDateString()}</td>
                                          <td className="px-4 py-2 text-slate-400 truncate max-w-[100px] hidden lg:table-cell">{item.kind === 'asset' ? (item as Asset).type.split('/')[1] : 'Folder'}</td>
                                          <td className="px-4 py-2 text-right text-slate-500 hidden sm:table-cell">{item.kind === 'asset' ? formatSize((item as Asset).size) : '--'}</td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  )}
              </div>

              {/* Batch Action Bar (Snap-in) */}
              {selectedCount >= 2 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#F8F9FA] border-t border-stone-300 p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex items-center justify-between z-30 transition-none animate-none overflow-x-auto">
                      <div className="flex items-center gap-4 pl-2 shrink-0">
                          <div className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded border border-slate-300 whitespace-nowrap">
                              {selectedCount} Items
                          </div>
                          <span className="text-xs text-slate-400 font-serif italic hidden sm:inline">Batch Selection Active</span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setIsMoveModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-300 text-slate-700 rounded shadow-sm hover:border-blue-400 hover:text-blue-600 text-xs font-bold uppercase tracking-wider">
                              <ArrowRight className="w-3 h-3" /> Move
                          </button>
                          <button onClick={handleBulkDuplicate} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-300 text-slate-700 rounded shadow-sm hover:border-blue-400 hover:text-blue-600 text-xs font-bold uppercase tracking-wider">
                              <Copy className="w-3 h-3" /> Duplicate
                          </button>
                          <button onClick={handleBulkArchive} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-300 text-slate-700 rounded shadow-sm hover:border-amber-400 hover:text-amber-600 text-xs font-bold uppercase tracking-wider">
                              <Archive className="w-3 h-3" /> Archive
                          </button>
                          
                          <div className="w-px h-6 bg-stone-300 mx-1"></div>
                          
                          <button 
                            onClick={openDeleteModal}
                            className="relative overflow-hidden flex items-center gap-2 px-3 py-1.5 rounded shadow-sm border text-xs font-bold uppercase tracking-wider transition-all duration-75 select-none bg-amber-50 border-amber-200 text-amber-900/50 hover:border-amber-300"
                            title="SAFETY LOCK ENGAGED"
                          >
                              <Lock className="w-3 h-3" />
                              <span>Purge</span>
                          </button>
                      </div>
                  </div>
              )}

              {/* Move Modal */}
              {isMoveModalOpen && (
                  <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
                      <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-80 overflow-hidden">
                          <div className="px-4 py-3 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Move Selection To...</h3>
                              <button onClick={() => setIsMoveModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                              <button onClick={() => handleBulkMoveConfirm(null)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm flex items-center gap-2 text-slate-600">
                                  <FolderIcon className="w-4 h-4 text-blue-300" /> Root (Aquarium)
                              </button>
                              {folders?.map(f => (
                                  <button key={f.id} onClick={() => handleBulkMoveConfirm(f.id!)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm flex items-center gap-2 text-slate-600">
                                      <FolderIcon className="w-4 h-4 text-slate-400" /> {f.name}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* RIGHT: Inspector (Outrigger - Adaptive) */}
          {/* Mobile/Tablet: Absolute Overlay / Desktop: Relative Col */}
          <div className={`
              bg-white border-l border-stone-200 flex flex-col shrink-0 h-full overflow-y-auto transition-all duration-300 shadow-xl
              ${showRightPanel && selectedCount > 0 ? 'w-72 translate-x-0' : 'w-0 translate-x-full border-none'}
              ${window.innerWidth < 1280 && showRightPanel && selectedCount > 0 ? 'absolute right-0 top-0 bottom-0 z-30' : 'relative'}
          `}>
              <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-slate-100 xl:hidden bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 pl-2">Inspector</span>
                  <button onClick={() => setShowRightPanel(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>

              {/* Single Asset Logic */}
              {singleAsset && (
                  <div className="min-w-[280px]">
                      <div className="p-6 border-b border-stone-100 flex flex-col items-center text-center bg-slate-50/50">
                          <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                              {getFileIcon(singleAsset.type, "w-10 h-10")}
                          </div>
                          <h3 className="font-serif font-bold text-slate-800 text-base leading-tight break-words w-full">{singleAsset.name}</h3>
                          <span className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-mono bg-slate-100 px-2 py-1 rounded">
                              {singleAsset.type}
                          </span>
                      </div>

                      <div className="p-6 space-y-6">
                          <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Info</h4>
                              <div className="grid grid-cols-2 gap-y-3 text-xs">
                                  <div className="text-slate-500">Size</div>
                                  <div className="text-slate-800 font-mono text-right">{formatSize(singleAsset.size)}</div>
                                  
                                  <div className="text-slate-500">Modified</div>
                                  <div className="text-slate-800 font-mono text-right">{new Date(singleAsset.createdAt).toLocaleDateString()}</div>
                                  
                                  <div className="text-slate-500">Location</div>
                                  <div className="text-slate-800 font-mono text-right truncate pl-2">{currentFolder ? currentFolder.name : 'Root'}</div>
                              </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-4">
                              <button 
                                  onClick={() => setInspectAsset(singleAsset)}
                                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
                              >
                                  <Info className="w-3 h-3" /> Open
                              </button>
                              <button 
                                  onClick={openDeleteModal}
                                  className="w-full py-2 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                              >
                                  <Trash2 className="w-3 h-3" /> Delete
                              </button>
                          </div>
                      </div>
                      
                      {singleAsset.extractedText && (
                          <div className="p-6 border-t border-stone-100 bg-slate-50/30 flex-1">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <FileText className="w-3 h-3" /> Content Preview
                              </h4>
                              <p className="text-xs text-slate-600 font-mono leading-relaxed line-clamp-6 bg-white p-2 border border-slate-200 rounded">
                                  {singleAsset.extractedText}
                              </p>
                          </div>
                      )}
                  </div>
              )}

              {/* Bulk Selection Summary */}
              {selectedCount > 1 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 min-w-[280px]">
                      <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center mb-4">
                          <Layers className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="font-serif font-bold text-slate-800 text-lg">{selectedCount} Items Selected</h3>
                      <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                          Batch actions active. Use the toolbar below to manage these items.
                      </p>
                  </div>
              )}

              {/* No Selection */}
              {selectedCount === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 min-w-[280px]">
                      <Info className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-sm">Select an item to view details.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
