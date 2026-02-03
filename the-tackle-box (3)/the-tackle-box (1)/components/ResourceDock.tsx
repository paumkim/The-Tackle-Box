
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, X, Globe, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ResourceDock: React.FC = () => {
  const resources = useLiveQuery(() => db.resources.toArray());
  const [isDragging, setIsDragging] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

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

    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && (url.startsWith('http') || url.startsWith('www'))) {
        let title = url;
        try {
            const urlObj = new URL(url);
            title = urlObj.hostname.replace('www.', '').split('.')[0];
            title = title.charAt(0).toUpperCase() + title.slice(1);
        } catch(e) {}

        await db.resources.add({
            title: title,
            url: url,
            category: 'DOCS'
        });
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUrl) return;
      
      let title = newTitle;
      if (!title) {
          try {
            const urlObj = new URL(newUrl);
            title = urlObj.hostname.replace('www.', '').split('.')[0];
            title = title.charAt(0).toUpperCase() + title.slice(1);
          } catch (e) {
              title = 'Link';
          }
      }

      await db.resources.add({
          title,
          url: newUrl,
          category: 'DOCS'
      });
      setNewUrl('');
      setNewTitle('');
      setShowAdd(false);
  };

  const deleteResource = async (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      await db.resources.delete(id);
  };

  const getIconUrl = (url: string) => {
      try {
          const urlObj = new URL(url);
          return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
      } catch (e) {
          return null;
      }
  };

  return (
    <div 
        className={`bg-white rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col h-48 ${isDragging ? 'border-blue-400 bg-blue-50 shadow-inner' : 'border-[#E0E0E0] shadow-sm'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-[#F8F9FA] z-10">
            <h3 className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> Resource Dock
            </h3>
            <button onClick={() => setShowAdd(!showAdd)} className="text-slate-400 hover:text-blue-600 transition-colors">
                {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
        </div>

        {/* Add Form Overlay */}
        <AnimatePresence>
            {showAdd && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-50 p-2 border-b border-slate-100"
                >
                    <form onSubmit={handleAddManual} className="flex flex-col gap-2">
                        <input 
                            className="text-xs p-1.5 rounded border border-slate-200" 
                            placeholder="URL (https://...)" 
                            value={newUrl}
                            onChange={e => setNewUrl(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 text-xs p-1.5 rounded border border-slate-200" 
                                placeholder="Title (Optional)" 
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                            />
                            <button type="submit" className="bg-blue-600 text-white text-xs font-bold px-3 rounded">Add</button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Drag Overlay */}
        {isDragging && (
            <div className="absolute inset-0 bg-blue-100/90 flex flex-col items-center justify-center z-20 text-blue-600">
                <LinkIcon className="w-8 h-8 animate-bounce mb-2" />
                <span className="font-bold text-sm">Drop to Dock</span>
            </div>
        )}

        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
            {resources && resources.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                    {resources.map(res => {
                        const iconUrl = getIconUrl(res.url);
                        return (
                            <a 
                                key={res.id} 
                                href={res.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="group flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all relative"
                            >
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-white border border-slate-200 shrink-0">
                                    {iconUrl ? (
                                        <img src={iconUrl} alt="icon" className="w-4 h-4" />
                                    ) : (
                                        <Globe className="w-3 h-3 text-slate-400" />
                                    )}
                                </div>
                                <span className="text-xs font-medium text-slate-700 truncate flex-1">{res.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <button 
                                    onClick={(e) => deleteResource(e, res.id!)}
                                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </a>
                        );
                    })}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center">
                    <LinkIcon className="w-8 h-8 mb-1 opacity-20" />
                    <p className="text-xs">Drag links here to dock.</p>
                </div>
            )}
        </div>
    </div>
  );
};
