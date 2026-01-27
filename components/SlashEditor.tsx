import React, { useState, useRef, useEffect } from 'react';
import { Command, CheckSquare, AlertCircle, Link, Clock } from 'lucide-react';

interface SlashEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SlashEditor: React.FC<SlashEditorProps> = ({ value, onChange, placeholder, className }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newPos = e.target.selectionStart;
    onChange(newValue);

    // Check for slash command
    if (newValue[newPos - 1] === '/') {
       const rect = e.target.getBoundingClientRect();
       // Crude approximation of cursor position for popup
       // In a production app, use a proper textarea caret coordinator
       setCursorPos({ top: rect.top + 40, left: rect.left + 20 }); 
       setShowMenu(true);
    } else {
       setShowMenu(false);
    }
  };

  const insertCommand = (text: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    // Remove the slash
    const before = value.substring(0, start - 1);
    const after = value.substring(end);
    
    onChange(`${before}${text}${after}`);
    setShowMenu(false);
    
    // Refocus
    textareaRef.current.focus();
  };

  // Render linked content [[Link]]
  const renderPreview = () => {
    if (!value) return null;
    
    // Regex for [[Link]]
    const parts = value.split(/(\[\[.*?\]\])/g);
    
    return (
      <div className="absolute inset-0 pointer-events-none p-6 text-sm font-mono leading-relaxed whitespace-pre-wrap text-transparent">
        {parts.map((part, i) => {
          if (part.startsWith('[[') && part.endsWith(']]')) {
            return (
              <span key={i} className="bg-blue-100 text-transparent rounded px-1 border border-blue-200">
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Visual Layer for Links (Underlay) */}
      <div className="absolute inset-0 p-6 pointer-events-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-transparent z-0">
          {/* We mirror text here just to render highlights, but text color is transparent so we see textarea text */}
           {value}
      </div>

      <textarea 
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        className="w-full h-full p-6 resize-none focus:outline-none bg-transparent relative z-10 font-mono text-sm leading-relaxed text-slate-700"
        placeholder={placeholder || "Type / for commands..."}
      />

      {/* Slash Menu */}
      {showMenu && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ top: cursorPos.top, left: cursorPos.left }}
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-2 bg-slate-50">Slash Commands</div>
          <button onClick={() => insertCommand("[[ ]]")} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center text-slate-700">
            <Link className="w-3 h-3 mr-2" /> Link Task
          </button>
          <button onClick={() => insertCommand("- [ ] ")} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center text-slate-700">
             <CheckSquare className="w-3 h-3 mr-2" /> To-do Item
          </button>
          <button onClick={() => insertCommand("URGENT: ")} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center text-red-600">
             <AlertCircle className="w-3 h-3 mr-2" /> Mark Urgent
          </button>
          <button onClick={() => insertCommand(`Time: ${new Date().toLocaleTimeString()} `)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center text-slate-700">
             <Clock className="w-3 h-3 mr-2" /> Stamp Time
          </button>
        </div>
      )}
    </div>
  );
};