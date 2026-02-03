
import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, FileText, Info } from 'lucide-react';
import { Asset } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface LightTableProps {
  asset: Asset | null;
  onClose: () => void;
}

export const LightTable: React.FC<LightTableProps> = ({ asset, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      const url = URL.createObjectURL(asset.data);
      setObjectUrl(url);
      setZoom(1);
      return () => URL.revokeObjectURL(url);
    }
  }, [asset]);

  if (!asset || !objectUrl) return null;

  const isImage = asset.type.startsWith('image/');
  const isVideo = asset.type.startsWith('video/');
  const isPDF = asset.type === 'application/pdf';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = asset.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-[50] flex items-center justify-center p-4">
        {/* Backdrop: Blur + Paper Texture Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-100/80 backdrop-blur-md cursor-pointer rounded-2xl"
        >
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply"></div>
        </motion.div>

        {/* The Table Surface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white w-full h-full rounded-xl shadow-2xl border border-[#E0E0E0] flex flex-col overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] bg-[#F8F9FA]">
            <div className="flex flex-col">
               <h3 className="font-serif text-lg font-bold text-slate-800">{asset.name}</h3>
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                 {(asset.size / 1024).toFixed(1)} KB • {asset.type}
               </span>
            </div>
            
            <div className="flex items-center gap-2">
               {isImage && (
                 <div className="flex bg-slate-100 rounded-lg p-1 mr-4">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 hover:bg-white rounded shadow-sm text-slate-500 transition-all"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 hover:bg-white rounded shadow-sm text-slate-500 transition-all"><ZoomIn className="w-4 h-4" /></button>
                 </div>
               )}
               
               <button onClick={handleDownload} className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors" title="Download">
                 <Download className="w-5 h-5" />
               </button>
               <div className="w-px h-6 bg-slate-200 mx-2"></div>
               <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                 <X className="w-6 h-6" />
               </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-repeat p-8 relative">
             {/* Content Container with Shadow */}
             <div 
               className={`transition-transform duration-200 ease-out origin-center ${!isImage && !isVideo ? 'w-full h-full' : ''}`}
               style={{ transform: `scale(${zoom})` }}
             >
                {isImage ? (
                  <img src={objectUrl} alt={asset.name} className="max-w-full max-h-[70vh] shadow-lg rounded-sm object-contain bg-white p-2 border border-slate-100" />
                ) : isVideo ? (
                  <video src={objectUrl} controls className="max-w-full max-h-[70vh] shadow-lg rounded-lg bg-black" />
                ) : isPDF ? (
                  <iframe src={objectUrl} className="w-full h-full shadow-lg rounded-lg bg-white border border-slate-200" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-20 bg-white shadow-lg rounded-lg border border-slate-100 text-slate-400">
                     <FileText className="w-24 h-24 mb-6 opacity-20" />
                     <p>Preview not available for this species.</p>
                     <button onClick={handleDownload} className="mt-6 text-blue-600 underline text-sm">Download to inspect</button>
                  </div>
                )}
             </div>
          </div>

          {/* Metadata Footer */}
          <div className="bg-[#F8F9FA] border-t border-[#E0E0E0] px-6 py-3 flex justify-between items-center text-xs text-slate-500">
             <div className="flex gap-4">
                <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Species: {asset.type.split('/')[0]}</span>
                <span>Captured: {new Date(asset.createdAt).toLocaleDateString()}</span>
             </div>
             {asset.extractedText && (
               <div className="flex items-center gap-2 text-emerald-600">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 OCR Text Detected
               </div>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
