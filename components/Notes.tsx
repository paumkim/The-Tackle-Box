
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
  
  // Metadata state
  const [editDepth, setEditDepth] = useState<'Surface' | 'Shallow' | 'Abyssal'>('Surface');
  const [editOwner, setEditOwner] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Load note into editor when selected
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
      title: 'Untitled Note',
      content: '',
      folder: 'General',
      updatedAt: Date.now(),
      depth: 'Surface',
      owner: 'Me',
      tags: []
    });
    setSelectedNoteId(id as number);
    setShowMedals(false);
  };

  const handleSave = async () => {
    if (selectedNoteId) {
      setIsSaving(true);
      await db.notes.update(selectedNoteId, {
        title: editTitle,
        content: editContent,
        updatedAt: Date.now(),
        depth: editDepth,
        owner: editOwner,
        tags: editTags
      });
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
      if (!editTags.includes(tagInput.trim())) {
        setEditTags([...editTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  return (
    <div className="h-full flex gap-6">
      {/* File Explorer (Left) */}
      <div className={`${viewMode === 'grid' ? 'w-full' : 'w-64'} flex flex-col transition-all duration-300 ${viewMode === 'list' ? 'border-r border-slate-100 pr-6' : ''} ${(selectedNoteId || showMedals) && viewMode === 'list' ? 'hidden md:flex' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">The Vault</h2>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
             <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>

        {/* View Toggles */}
        <div className="flex gap-2 mb-4">
            <button 
                onClick={() => { setShowMedals(false); setSelectedNoteId(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${!showMedals ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
            >
                Files
            </button>
            <button 
                onClick={() => { setShowMedals(true); setSelectedNoteId(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${showMedals ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500'}`}
            >
                Medals
            </button>
        </div>

        {viewMode === 'grid' && !showMedals && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-10">
              <button onClick={handleCreate} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                 <Plus className="w-8 h-8 text-slate-300 group-hover:text-blue-500 mb-2" />
                 <span className="text-sm text-slate-400 font-medium">New Entry</span>
              </button>
              {notes?.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => { setSelectedNoteId(note.id!); setViewMode('list'); }}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40 group relative overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <FileText className="w-5 h-5 text-blue-500" />
                       <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                         note.depth === 'Abyssal' ? 'bg-purple-100 text-purple-700' : 
                         note.depth === 'Shallow' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                       }`}>{note.depth}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 line-clamp-2">{note.title}</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    {note.tags && note.tags.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {note.tags.slice(0,3).map(t => <span key={t} className="bg-slate-100 px-1 rounded">#{t}</span>)}
                      </div>
                    ) : (
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  {/* Decorative */}
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gradient-to-br from-transparent to-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
           </div>
        )}
        
        {viewMode === 'list' && !showMedals && (
          <div className="flex-1 flex flex-col">
            <button onClick={handleCreate} className="flex items-center justify-center gap-2 w-full p-2 mb-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" /> New Note
            </button>
            <div className="space-y-1 overflow-y-auto flex-1">
              {notes?.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id!)}
                  className={`w-full text-left p-3 rounded-lg border transition-all group ${
                    selectedNoteId === note.id 
                      ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100' 
                      : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center text-sm font-medium text-slate-700 mb-1">
                    <FileText className={`w-3 h-3 mr-2 ${selectedNoteId === note.id ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="truncate">{note.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`w-1.5 h-1.5 rounded-full ${
                       note.depth === 'Abyssal' ? 'bg-purple-400' : 
                       note.depth === 'Shallow' ? 'bg-blue-400' : 'bg-slate-300'
                     }`}></span>
                     <div className="text-xs text-slate-400 truncate flex-1">
                       {note.owner || 'Unassigned'}
                     </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {showMedals && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Award className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Select a medal from the case to view details.</p>
                <button onClick={() => setShowMedals(false)} className="mt-4 text-xs text-blue-500 hover:underline md:hidden">Back to Files</button>
            </div>
        )}
      </div>

      {/* Content Area (Right) */}
      <div className={`flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${(!selectedNoteId && !showMedals) ? 'hidden md:flex' : ''}`}>
          
          {showMedals ? (
              <MedalCase />
          ) : selectedNoteId ? (
            <>
              {/* Tackle Organizer Metadata */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
                 <input 
                   type="text" 
                   value={editTitle}
                   onChange={(e) => setEditTitle(e.target.value)}
                   className="bg-transparent text-xl font-bold text-slate-800 border-none focus:ring-0 placeholder:text-slate-400 w-full p-0"
                   placeholder="Note Title"
                 />
                 
                 <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* Depth */}
                    <div className="flex items-center gap-2 group relative">
                       <Layers className="w-4 h-4 text-slate-400" />
                       <select 
                         value={editDepth}
                         onChange={(e) => setEditDepth(e.target.value as any)}
                         className="bg-transparent border-none focus:ring-0 text-slate-600 font-medium cursor-pointer p-0 pr-6 hover:text-blue-600"
                       >
                         <option value="Surface">Surface Level</option>
                         <option value="Shallow">Shallow Waters</option>
                         <option value="Abyssal">Abyssal Depth</option>
                       </select>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2">
                       <User className="w-4 h-4 text-slate-400" />
                       <input 
                         type="text" 
                         value={editOwner} 
                         onChange={(e) => setEditOwner(e.target.value)}
                         className="bg-transparent border-none focus:ring-0 text-slate-600 p-0 w-24 placeholder:text-slate-300"
                         placeholder="Owner..."
                       />
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-1">
                       <Tag className="w-4 h-4 text-slate-400" />
                       <div className="flex gap-1 flex-wrap">
                          {editTags.map(tag => (
                            <span key={tag} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-xs text-slate-600 flex items-center">
                              #{tag}
                              <button onClick={() => removeTag(tag)} className="ml-1 text-slate-300 hover:text-red-400"><Search className="w-2 h-2" /></button>
                            </span>
                          ))}
                          <input 
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={addTag}
                            className="bg-transparent border-none focus:ring-0 text-slate-600 p-0 w-20 placeholder:text-slate-300 text-xs"
                            placeholder="+Tag"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Toolbar */}
              <div className="border-b border-slate-100 px-4 py-2 flex items-center justify-between bg-white">
                <div className="flex gap-2 text-slate-400 text-xs">
                  <span>markdown supported</span>
                </div>
                <div className="flex gap-2">
                   <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Copy Anchor Link">
                     <Anchor className="w-4 h-4" />
                   </button>
                   
                   <button 
                     onClick={applyCaptainStamp}
                     className="p-1.5 text-slate-400 hover:text-purple-600 rounded hover:bg-purple-50" 
                     title="Apply Captain's Stamp"
                   >
                     <Stamp className="w-4 h-4" />
                   </button>
                   
                   <button 
                    onClick={handleSave}
                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${isSaving ? 'text-green-600 bg-green-50' : 'text-white bg-slate-800 hover:bg-slate-700'}`}
                  >
                    <Save className="w-3 h-3 mr-2" />
                    {isSaving ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
              
              {/* The Magic Editor */}
              <SlashEditor 
                value={editContent} 
                onChange={setEditContent} 
                className="flex-1"
                placeholder="Type / for commands, or [[ to link tasks..."
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a note from the vault or create a new one.</p>
            </div>
          )}
      </div>
    </div>
  );
};
