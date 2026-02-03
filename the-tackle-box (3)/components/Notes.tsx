
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, Plus, FolderOpen, FileText, Anchor, Tag, Layers, User, LayoutGrid, List, Search, Stamp, Award } from 'lucide-react';
import { db } from '../db';
import { Note } from '../types';
import { SlashEditor } from './SlashEditor';
import { MedalCase } from './MedalCase';

export const Notes: React.FC = () => {
  const notes = useLiveQuery(() => db.notes.toArray());
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showMedals, setShowMedals] = useState(false);
  
  const [editDepth, setEditDepth] = useState<'Surface' | 'Shallow' | 'Abyssal'>('Surface');
  const [editOwner, setEditOwner] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (selectedNoteId && notes) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) {
        setEditTitle(note.title);
        setEditContent(note.content);
        setEditDepth(note.depth || 'Surface');
        setEditOwner(note.owner || '');
        setEditTags(note.tags || []);
      }
    }
  }, [selectedNoteId, notes]);

  const handleCreate = async () => {
    const id = await db.notes.add({
      title: 'Untitled Entry', content: '', folder: 'General', updatedAt: Date.now(),
      depth: 'Surface', owner: 'Me', tags: []
    });
    setSelectedNoteId(id as number);
    setShowMedals(false);
  };

  const handleSave = async () => {
    if (selectedNoteId) {
      setIsSaving(true);
      await db.notes.update(selectedNoteId, { title: editTitle, content: editContent, updatedAt: Date.now(), depth: editDepth, owner: editOwner, tags: editTags });
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const applyCaptainStamp = () => {
      const timestamp = new Date().toLocaleString();
      const stamp = `\n\n---\n**VERIFIED BY CAPTAIN**\n**DATE:** ${timestamp}\n**SIGNATURE:** ⚓ ${editOwner || 'The Captain'}\n---`;
      setEditContent(prev => prev + stamp);
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!editTags.includes(tagInput.trim())) setEditTags([...editTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setEditTags(editTags.filter(t => t !== tag));

  return (
    <div className="bridge-container-standard">
      <header className="bridge-header-standard">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
            <FileText className="w-6 h-6 text-slate-600" />
            The Vault
          </h2>
          <p className="text-slate-500 font-serif italic text-sm">Long-form Intelligence & Logs</p>
        </div>
        <div className="flex gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
            <button onClick={handleCreate} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-sm font-bold text-xs uppercase tracking-wider hover:bg-slate-700 shadow-sm"><Plus className="w-4 h-4" /> New Entry</button>
        </div>
      </header>

      <div className="px-4 mb-4 flex items-center gap-2">
          <button onClick={() => { setShowMedals(false); setSelectedNoteId(null); }} className={`px-4 py-1.5 text-[10px] font-bold rounded-md border uppercase tracking-widest transition-all ${!showMedals ? 'bg-white border-slate-300 text-slate-800 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}>Files</button>
          <button onClick={() => { setShowMedals(true); setSelectedNoteId(null); }} className={`px-4 py-1.5 text-[10px] font-bold rounded-md border uppercase tracking-widest transition-all ${showMedals ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}>Medals</button>
      </div>

      <div className="bridge-body-standard">
        <div className="flex-1 flex gap-6 overflow-hidden">
            {/* File List/Grid */}
            <div className={`flex flex-col transition-all duration-300 overflow-y-auto custom-scrollbar ${viewMode === 'list' ? (selectedNoteId || showMedals ? 'hidden md:flex w-64 border-r border-slate-100 pr-4' : 'w-full') : 'w-full'}`}>
                {viewMode === 'grid' && !showMedals && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                        {notes?.map(note => (
                            <div key={note.id} onClick={() => { setSelectedNoteId(note.id!); setViewMode('list'); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between h-40 group relative overflow-hidden">
                                <div>
                                    <div className="flex justify-between items-start mb-2"><FileText className="w-5 h-5 text-blue-500" /><span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${note.depth === 'Abyssal' ? 'bg-purple-100 text-purple-700' : note.depth === 'Shallow' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{note.depth}</span></div>
                                    <h3 className="font-serif font-bold text-slate-800 line-clamp-2">{note.title}</h3>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 font-mono uppercase">{new Date(note.updatedAt).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                )}
                {viewMode === 'list' && !showMedals && (
                    <div className="space-y-1">
                        {notes?.map(note => (
                            <button key={note.id} onClick={() => setSelectedNoteId(note.id!)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedNoteId === note.id ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100' : 'bg-transparent border-transparent hover:bg-slate-50'}`}>
                                <div className="flex items-center text-sm font-bold text-slate-700 truncate"><FileText className={`w-3 h-3 mr-2 ${selectedNoteId === note.id ? 'text-blue-500' : 'text-slate-400'}`} />{note.title}</div>
                                <div className="flex items-center gap-2 mt-1"><span className={`w-1.5 h-1.5 rounded-full ${note.depth === 'Abyssal' ? 'bg-purple-400' : note.depth === 'Shallow' ? 'bg-blue-400' : 'bg-slate-300'}`}></span><div className="text-[10px] text-slate-400 uppercase font-mono">{note.owner || 'Unassigned'}</div></div>
                            </button>
                        ))}
                    </div>
                )}
                {showMedals && <div className="flex-1"><MedalCase /></div>}
            </div>

            {/* Editor Area */}
            {selectedNoteId && !showMedals && (
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-transparent text-xl font-bold text-slate-800 border-none focus:ring-0 p-0 font-serif" placeholder="Note Title" />
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                            <select value={editDepth} onChange={(e) => setEditDepth(e.target.value as any)} className="bg-transparent border-none focus:ring-0 text-slate-600 font-bold p-0 uppercase"><option value="Surface">Surface</option><option value="Shallow">Shallow</option><option value="Abyssal">Abyssal</option></select>
                            <input type="text" value={editOwner} onChange={(e) => setEditOwner(e.target.value)} className="bg-transparent border-none focus:ring-0 text-slate-600 p-0 w-24 font-bold uppercase" placeholder="OWNER..." />
                        </div>
                    </div>
                    <div className="border-b border-slate-100 px-4 py-2 flex items-center justify-between bg-white">
                        <div className="text-[10px] text-slate-300 font-mono uppercase">Markdown Active</div>
                        <div className="flex gap-2">
                            <button onClick={applyCaptainStamp} className="p-1.5 text-slate-400 hover:text-purple-600 rounded" title="Captain's Stamp"><Stamp className="w-4 h-4" /></button>
                            <button onClick={handleSave} className={`flex items-center px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors ${isSaving ? 'text-emerald-600 bg-emerald-50' : 'text-white bg-slate-800'}`}>{isSaving ? 'Saved' : 'Secure Entry'}</button>
                        </div>
                    </div>
                    <SlashEditor value={editContent} onChange={setEditContent} className="flex-1" />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
