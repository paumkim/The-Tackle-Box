
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Terminal, 
  Settings,
  Fish,
  Bug,
  GripVertical,
  Trash2,
  Waves,
  Users,
  Folder,
  Filter,
  AlertCircle,
  Hash,
  Tag,
  Layers,
  Calendar as CalendarIcon,
  Activity as ActivityIcon,
  MessageSquare, // For Bottle
  Siren,
  Palmtree,
  UploadCloud,
  Link,
  Bell,
  BellOff,
  Anchor,
  Check,
  X as XIcon,
  HelpCircle,
  BarChart3,
  Mail,
  Slack
} from 'lucide-react';
import { ViewState, DEFAULT_NAV_ITEMS, NavItem, UserRole, Contact } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { FeedbackBottle } from './FeedbackBottle';
import { VesselFlag } from './VesselFlag';
import { TheDepths } from './TheDepths';
import { db } from '../db';
import { NotificationManager } from '../utils/notifications';
import { useLiveQuery } from 'dexie-react-hooks';
import { Parrot } from './Parrot';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isDevOverlayActive: boolean;
  onToggleDevOverlay: () => void;
}

const IconMap: Record<string, React.FC<any>> = {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  Calendar,
  FileText,
  Terminal,
  Settings,
  Waves, 
  Users
};

// Knot Meter Component with Signal Translation Protocol
const KnotMeter = () => {
    const isSubmerged = useAppStore(state => state.isSubmerged);
    const isDragDetected = useAppStore(state => state.isDragDetected); // Now driven by App.tsx
    const isDrifting = useAppStore(state => state.isDrifting);
    
    const [speed, setSpeed] = useState(12.4); 
    const targetSpeed = useRef(12.4);
    const idleTimeout = useRef<number | null>(null);
    
    // Boost speed when Full Ahead
    const baseSpeed = isSubmerged ? 16.0 : 12.0;
    const dragPenalty = isDragDetected ? 4.0 : 0;

    useEffect(() => {
        const handleActivity = () => { 
            let baseMax = (baseSpeed + 6.5) - dragPenalty;
            targetSpeed.current = Math.min(targetSpeed.current + 0.3, baseMax);
            if (idleTimeout.current) clearTimeout(idleTimeout.current);
            idleTimeout.current = window.setTimeout(() => {
                 targetSpeed.current = (baseSpeed - dragPenalty) + Math.random(); 
            }, 2000);
        };

        const fluctuate = setInterval(() => {
            let baseMin = (baseSpeed + 1.0) - dragPenalty;
            if (targetSpeed.current <= baseMin) {
                 targetSpeed.current = (baseSpeed - dragPenalty) + (Math.random() * 0.8);
            }
        }, 3000);

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        
        const renderLoop = setInterval(() => {
             setSpeed(prev => {
                const diff = targetSpeed.current - prev;
                if (Math.abs(diff) < 0.05) return prev;
                return prev + diff * 0.05; 
            });
        }, 50);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            clearInterval(fluctuate);
            clearInterval(renderLoop);
            if (idleTimeout.current) clearTimeout(idleTimeout.current);
        }
    }, [dragPenalty, baseSpeed]);

    // Signal Translation Protocol
    let signal = 'HEAVY SEAS';
    let signalColor = 'text-amber-500'; // Warning Amber
    
    if (speed >= 30) {
        signal = 'FULL SAIL';
        signalColor = 'text-emerald-500'; // Vibrant Green
    } else if (speed >= 15) {
        signal = 'CRUISING';
        signalColor = 'text-amber-700'; // Soft Brass
    }

    if (isDrifting) {
        signal = 'DRIFTING';
        signalColor = 'text-red-500';
    }

    // Mechanical Tooltip Calculation
    const fps = Math.round(speed * 1.66);
    const load = Math.max(0, Math.min(100, 100 - (speed * 2.8))).toFixed(0);

    return (
        <div 
            className="flex flex-col items-end group/telemetry cursor-help" 
            title={`${speed.toFixed(1)} kts ≈ ${fps} FPS (Engine Load: ${load}%)`}
        >
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500 select-none">
                 <ActivityIcon className={`w-3 h-3 ${speed > 30 ? 'text-emerald-500 animate-pulse' : (speed > 15 ? 'text-amber-600' : 'text-slate-400')}`} />
                 <span className="font-bold flex items-center gap-2">
                    <span>{isDrifting ? '0.0' : speed.toFixed(1)} kts</span>
                    <span className="text-slate-300 opacity-50">/</span> 
                    <span className={`${signalColor} font-black text-[10px] tracking-wide uppercase`}>
                        {isDrifting ? 'DRIFTING' : signal}
                    </span>
                 </span>
            </div>
            {isDragDetected && !isDrifting && (
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider animate-pulse">
                    RESISTANCE DETECTED
                </span>
            )}
        </div>
    )
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  isDevOverlayActive, 
  onToggleDevOverlay
}) => {
  const sidebarState = useAppStore(state => state.sidebarState);
  const setSidebarState = useAppStore(state => state.setSidebarState);
  const userRole = useAppStore(state => state.userRole);
  const isDepartureManifestOpen = useAppStore(state => state.isDepartureManifestOpen);
  const setSosActive = useAppStore(state => state.setSosActive);
  const sosActive = useAppStore(state => state.sosActive);
  const weatherCondition = useAppStore(state => state.weatherCondition);
  const hookedContactId = useAppStore(state => state.hookedContactId);
  const setHookedContactId = useAppStore(state => state.setHookedContactId);
  const quietMode = useAppStore(state => state.quietMode);
  const toggleQuietMode = useAppStore(state => state.toggleQuietMode);
  const sosLatchEnabled = useAppStore(state => state.sosLatchEnabled);
  const setConfirmingBreak = useAppStore(state => state.setConfirmingBreak);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const isSettingsOpen = useAppStore(state => state.isSettingsOpen);
  
  const isChatOpen = useAppStore(state => state.isChatOpen);
  const setChatOpen = useAppStore(state => state.setChatOpen);
  const isCrewTyping = useAppStore(state => state.isCrewTyping);
  
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  const [draggedItem, setDraggedItem] = useState<NavItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isBottleOpen, setIsBottleOpen] = useState(false);
  const [isDepthsOpen, setIsDepthsOpen] = useState(false);
  const [cargoDragOver, setCargoDragOver] = useState(false);
  const [showHookSelector, setShowHookSelector] = useState(false);
  
  // Queries
  const hookedContact = useLiveQuery(() => hookedContactId ? db.contacts.get(hookedContactId) : Promise.resolve(undefined), [hookedContactId]);
  const contacts = useLiveQuery(() => db.contacts.toArray());

  // Resizing State
  const [isResizing, setIsResizing] = useState(false);
  const [dragWidth, setDragWidth] = useState(260);

  // SOS Hold Logic
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<number | null>(null);
  const HOLD_DURATION = 3000; // 3 seconds

  useEffect(() => {
    if (!isResizing) {
      if (sidebarState === 'full') setDragWidth(260);
      else if (sidebarState === 'mini') setDragWidth(68);
      else setDragWidth(0);
    }
  }, [sidebarState, isResizing]);

  const saveOrder = (items: NavItem[]) => {
    setNavItems(items);
    localStorage.setItem('tackle_nav_order', JSON.stringify(items));
  };

  const handleDragStart = (e: React.DragEvent, item: NavItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    const draggedIndex = navItems.findIndex(i => i.id === draggedItem.id);
    if (draggedIndex === index) return;
    const newItems = [...navItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removed);
    setNavItems(newItems);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      saveOrder(navItems);
      setDraggedItem(null);
    }
  };

  // Cargo Hold Logic
  const handleCargoDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!cargoDragOver) setCargoDragOver(true);
  };

  const handleCargoDragLeave = () => {
      setCargoDragOver(false);
  };

  const handleCargoDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setCargoDragOver(false);
      
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
                  species: file.type.startsWith('image') ? 'Scales' : 'Shells'
              });
          }
          NotificationManager.send("Cargo Secured", `${files.length} items stowed in The Trawl.`);
      }
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = Math.max(0, Math.min(e.clientX, 450));
    setDragWidth(newWidth);
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';

    const finalWidth = Math.max(0, Math.min(e.clientX, 450));
    
    if (finalWidth < 30) {
      setSidebarState('hidden');
    } else if (finalWidth < 150) {
      setSidebarState('mini');
    } else {
      setSidebarState('full');
    }
  };

  const handleDoubleClickHandle = () => {
    if (sidebarState === 'hidden') setSidebarState('mini');
    else if (sidebarState === 'mini') setSidebarState('full');
    else setSidebarState('mini');
  };

  const getRoleLabel = (role: string | null) => {
      switch(role) {
          case 'PLANNER': return 'Navigator';
          case 'STUDENT': return 'Scholar';
          case 'SALES': return 'Merchant';
          default: return 'General';
      }
  }

  const handleSetHook = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); 
      
      if (e.type === 'contextmenu') {
          // Right click releases the hook
          setHookedContactId(null);
      } else {
          // Left click actions
          if (hookedContactId) {
              // The Fold: Toggle chat view
              setChatOpen(!isChatOpen);
          } else {
              // Open Selector
              setShowHookSelector(!showHookSelector);
          }
      }
  };

  const selectContactForHook = (contact: Contact) => {
      setHookedContactId(contact.id!);
      setShowHookSelector(false);
  }

  // --- SOS Button Logic ---
  const startSosHold = (e: React.MouseEvent | React.TouchEvent) => {
      if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return; // Only left click
      if (sosActive) return; // Already active

      if (!sosLatchEnabled) {
          setSosActive(true);
          return;
      }

      setIsHolding(true);
      const startTime = Date.now();
      
      holdIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
          setHoldProgress(progress);

          if (progress >= 100) {
              setSosActive(true);
              endSosHold();
          }
      }, 16);
  };

  const endSosHold = () => {
      if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = null;
      }
      setIsHolding(false);
      setHoldProgress(0);
  };

  const isMini = sidebarState === 'mini';
  const isHidden = sidebarState === 'hidden';
  const [isHoverRevealed, setIsHoverRevealed] = useState(false);
  
  const targetWidth = isResizing 
    ? dragWidth 
    : (isHidden && isHoverRevealed ? 68 : (sidebarState === 'full' ? 260 : (sidebarState === 'mini' ? 68 : 0)));

  const renderMini = targetWidth < 180; 

  const isSevereWeather = weatherCondition === 'STORM';

  return (
    <>
      <FeedbackBottle isOpen={isBottleOpen} onClose={() => setIsBottleOpen(false)} />
      <TheDepths isOpen={isDepthsOpen} onClose={() => setIsDepthsOpen(false)} />

      {isHidden && !isResizing && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-4 z-[60] cursor-e-resize hover:bg-blue-400/20 group/sensor"
          onMouseEnter={() => setIsHoverRevealed(true)}
          title="Reveal Dock"
        >
             <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-400/0 group-hover/sensor:bg-blue-400/50 shadow-[0_0_8px_#3b82f6]"></div>
        </div>
      )}

      <motion.aside 
        initial={false}
        animate={{ 
          width: targetWidth,
          x: isHidden && !isHoverRevealed && !isResizing ? -20 : 0
        }}
        transition={{ duration: 0 }}
        className={`
            flex-shrink-0 bg-[#fdfbf7] border-r border-stone-300 h-full flex flex-col z-[1000] relative group/sidebar 
            shadow-[4px_0_10px_rgba(0,0,0,0.1)] overflow-visible
            ${isHidden && !isHoverRevealed && !isResizing ? 'pointer-events-none opacity-0' : 'opacity-100'}
            ${isDepartureManifestOpen ? 'pointer-events-none' : ''}
        `}
        onMouseLeave={() => isHidden && setIsHoverRevealed(false)}
      >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none z-0"></div>

        <div 
          onMouseDown={startResizing}
          onDoubleClick={handleDoubleClickHandle}
          className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-blue-400/10 z-50 flex items-center justify-center group/handle active:bg-blue-500/20"
          title="Drag to Resize"
        >
          <div className={`w-[2px] rounded-full ${isResizing ? 'bg-blue-50 h-full shadow-[0_0_15px_#3b82f6]' : 'h-8 bg-stone-300 group-hover/handle:bg-blue-400 group-hover/handle:h-16 group-hover/handle:shadow-[0_0_8px_#3b82f6]'}`} />
        </div>

        {/* Header with Vessel Flag */}
        <div className={`h-20 flex items-center ${renderMini ? 'justify-center px-0' : 'px-6'} border-b border-stone-200 bg-[#fdfbf7]/80 backdrop-blur-sm sticky top-0 shrink-0 whitespace-nowrap z-10`}>
          <div className="bob-on-hover cursor-pointer shrink-0" onClick={() => onChangeView(ViewState.DASHBOARD)}>
             {renderMini ? <Fish className="w-6 h-6 text-blue-800" /> : <VesselFlag role={userRole} />}
          </div>
          <motion.div 
            className="overflow-hidden flex flex-col justify-center ml-3"
            initial={false}
            animate={{ opacity: renderMini ? 0 : 1, width: renderMini ? 0 : 'auto' }}
            transition={{ duration: 0 }}
          >
            <h1 className="font-bold text-slate-800 tracking-tight leading-none mb-1 font-serif">
              The Tackle Box
            </h1>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
               {getRoleLabel(userRole)} Class
            </span>
          </motion.div>
        </div>
        
        <nav className="p-4 space-y-2 flex-shrink-0 mt-4 overflow-x-hidden relative z-10">
          {navItems.map((item, index) => {
            const Icon = IconMap[item.icon] || Fish;
            const isActive = currentView === item.id && item.id !== ViewState.SETTINGS;
            const isCargoTarget = item.id === ViewState.INBOX && cargoDragOver;
            
            // Special case for Settings active state
            const isSettingsActive = item.id === ViewState.SETTINGS && isSettingsOpen;
            const effectiveActive = isActive || isSettingsActive;

            // Define styles for active state
            let activeStyle = 'navigator-glass font-serif font-bold text-slate-800'; // Default active
            if (item.id === ViewState.SETTINGS && isSettingsOpen) {
                activeStyle = 'bg-white shadow-[0_0_15px_rgba(59,130,246,0.3)] text-slate-900 border-blue-200 ring-2 ring-blue-50 font-bold'; // High Intensity Focus
            }

            return (
              <div
                key={item.id}
                draggable={!renderMini}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => item.id === ViewState.INBOX ? handleCargoDragOver(e) : handleDragOver(e, index)}
                onDragLeave={() => item.id === ViewState.INBOX ? handleCargoDragLeave() : null}
                onDrop={(e) => item.id === ViewState.INBOX ? handleCargoDrop(e) : handleDrop(e)}
                className={`relative group/item ${effectiveActive ? 'z-10' : ''}`}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => {
                      if (item.id === ViewState.SETTINGS) {
                          setSettingsOpen(true);
                      } else {
                          onChangeView(item.id);
                      }
                  }}
                  className={`w-full flex items-center ${renderMini ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-bold relative bob-on-hover ${
                    effectiveActive 
                      ? activeStyle
                      : (isCargoTarget ? 'bg-blue-100 ring-2 ring-blue-300 text-blue-900' : 'text-slate-500 hover:bg-stone-100 hover:text-slate-800 hover:shadow-inner')
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${!renderMini && 'mr-3'} ${
                    effectiveActive ? 'text-current' : (isCargoTarget ? 'text-blue-800 animate-bounce' : 'text-slate-400 group-hover/item:text-slate-600')
                  }`} />
                  
                  {!renderMini && (
                    <>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0 }}
                        className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        {isCargoTarget ? 'Drop Cargo' : item.label}
                      </motion.span>
                      {item.id === ViewState.INBOX && isCargoTarget && <UploadCloud className="w-4 h-4 animate-pulse mr-2" />}
                      {!isCargoTarget && <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover/item:opacity-100 cursor-grab shrink-0" />}
                    </>
                  )}
                </button>

                {renderMini && hoveredItem === item.id && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg z-[70] whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-slate-800 transform rotate-45 border-l border-b border-slate-700"></div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Tactical Hook */}
          <div className={`mt-4 pt-4 border-t border-stone-200 relative ${renderMini ? 'flex justify-center' : ''}`}>
              {showHookSelector && !renderMini && (
                  <div className="absolute top-0 left-0 w-full transform -translate-y-full pb-2 z-50">
                      <div className="bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                              <span className="text-[10px] font-bold uppercase text-slate-400 font-serif">Crew</span>
                              <button onClick={() => setShowHookSelector(false)}><XIcon className="w-3 h-3 text-slate-400" /></button>
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                              {contacts?.map(c => (
                                  <div 
                                    key={c.id} 
                                    onClick={() => selectContactForHook(c)}
                                    className="p-2 hover:bg-blue-50 cursor-pointer text-xs font-medium text-slate-700 flex items-center gap-2 border-b border-stone-50 last:border-0"
                                  >
                                      <div className={`w-2 h-2 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                      {c.name}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              <button
                onClick={handleSetHook}
                onContextMenu={handleSetHook}
                className={`flex items-center ${renderMini ? 'justify-center w-full px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-bold relative bob-on-hover text-slate-500 hover:bg-stone-50 hover:text-slate-900 group/hook border border-transparent hover:border-stone-200`}
                title={hookedContact ? "Left-Click: Fold/Unfold Chat | Right-Click: Release Hook" : "Set Tactical Hook"}
              >
                  <Anchor className={`w-4 h-4 shrink-0 ${!renderMini && 'mr-3'} ${hookedContact ? 'text-amber-600' : 'text-slate-400'}`} />
                  {!renderMini && (
                      <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-between">
                          <div className="flex flex-col">
                              {hookedContact ? (
                                  <span 
                                    className={`leading-none font-serif transition-all duration-500 ${isCrewTyping ? 'text-emerald-600 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]' : 'text-slate-800'}`}
                                  >
                                      {hookedContact.name}
                                  </span>
                              ) : (
                                  <span className="leading-none font-serif">Set Hook...</span>
                              )}
                              {hookedContact && (
                                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                      {isCrewTyping ? 'TYPING...' : (isChatOpen ? 'CHANNEL OPEN' : 'STANDING BY')}
                                  </span>
                              )}
                          </div>
                          {hookedContact && (
                              <span className="flex items-center gap-1">
                                  {hookedContact.signalResponse === 'AYE' && <Check className="w-3 h-3 text-emerald-600" />}
                                  {hookedContact.signalResponse === 'NAY' && <XIcon className="w-3 h-3 text-red-500" />}
                                  {hookedContact.signalResponse === 'PENDING' && <HelpCircle className="w-3 h-3 text-amber-500 animate-pulse" />}
                              </span>
                          )}
                      </span>
                  )}
              </button>
          </div>
        </nav>

        {/* Clean Deck Policy: No TacklePanel or WaterBarrel rendered here anymore */}
        <div className="flex-1"></div>

        <div className="mt-auto shrink-0 relative z-10">
          {!renderMini && (
            <div className="px-4 pb-4">
               {/* SOS Beacon (Hold to Confirm) */}
               <div className="mb-2 flex gap-2">
                   <button 
                     onMouseDown={startSosHold}
                     onMouseUp={endSosHold}
                     onMouseLeave={endSosHold}
                     onTouchStart={startSosHold}
                     onTouchEnd={endSosHold}
                     className={`flex-1 relative overflow-hidden flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 shadow-sm group select-none ${
                       sosActive || isSevereWeather
                         ? 'bg-red-50 border-red-400 text-red-700 shadow-red-200 animate-pulse' 
                         : 'bg-[#fdfbf7] border-red-100 text-red-600 hover:border-red-300 hover:text-red-700'
                     } ${isHolding ? 'scale-95' : ''}`}
                     title={sosLatchEnabled ? "Hold for 3s to Activate Beacon" : "Emergency Beacon"}
                   >
                     {/* Circular Loading Ring (Visual Latch) */}
                     {isHolding && !sosActive && (
                         <div className="absolute inset-0 bg-red-100/30 flex items-center justify-center">
                             <svg className="w-8 h-8 transform -rotate-90 pointer-events-none">
                                <circle cx="16" cy="16" r="14" stroke="#fca5a5" strokeWidth="2" fill="none" />
                                <circle 
                                    cx="16" cy="16" r="14" stroke="#ef4444" strokeWidth="2" fill="none"
                                    strokeDasharray="88" strokeDashoffset={88 - (88 * holdProgress / 100)}
                                />
                             </svg>
                         </div>
                     )}

                     <Siren className={`w-4 h-4 ${(isSevereWeather || sosActive) ? 'animate-bounce' : 'group-hover:animate-ping'} z-10`} />
                     <span className="text-xs font-black uppercase tracking-wider font-serif z-10">
                         {isHolding ? "HOLD..." : "S.O.S."}
                     </span>
                   </button>
                   <button 
                     onClick={() => setConfirmingBreak(true)}
                     className="flex items-center justify-center w-10 px-3 py-2 bg-[#fdfbf7] hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 hover:border-emerald-200 shadow-sm"
                     title="Shore Leave Protocol (Ask Mascot)"
                   >
                     <Palmtree className="w-4 h-4" />
                   </button>
               </div>

               <div className="border-t border-slate-200/50 pt-4 flex gap-2">
                 <button 
                   onClick={() => setIsDepthsOpen(true)}
                   className="flex-1 flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg cursor-pointer border-2 border-transparent hover:border-dashed hover:border-red-200"
                 >
                   <Trash2 className="w-4 h-4 shrink-0" />
                   <span className="text-sm font-medium whitespace-nowrap overflow-hidden">The Depths</span>
                 </button>
                 <button 
                   onClick={() => setIsBottleOpen(true)}
                   className="flex items-center justify-center w-10 h-10 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer border border-transparent hover:border-blue-100"
                   title="Message in a Bottle (Feedback)"
                 >
                   <MessageSquare className="w-4 h-4" />
                 </button>
               </div>
            </div>
          )}
          
          <div className={`p-4 border-t border-stone-200 bg-[#fdfbf7]/50 ${renderMini ? 'flex justify-center flex-col gap-2 items-center' : ''}`}>
            {renderMini && (
                <>
                    <button 
                       onMouseDown={startSosHold}
                       onMouseUp={endSosHold}
                       onMouseLeave={endSosHold}
                       onTouchStart={startSosHold}
                       onTouchEnd={endSosHold}
                       className={`mb-2 ${(isSevereWeather || sosActive) ? 'text-red-600 animate-pulse' : 'text-red-400 hover:text-red-600'} ${isHolding ? 'scale-90 opacity-80' : ''}`}
                       title="S.O.S."
                     >
                       <Siren className="w-4 h-4" />
                     </button>
                    <button 
                       onClick={() => setIsBottleOpen(true)}
                       className="text-blue-400 hover:text-blue-600 mb-2"
                       title="Feedback"
                     >
                       <MessageSquare className="w-4 h-4" />
                     </button>
                </>
            )}
            
            {!renderMini ? (
              <div className="flex items-center justify-between gap-4">
                <Parrot />
                
                <div className="flex flex-col items-end gap-1 flex-1">
                    {/* The Radio Room (Signal Row) */}
                    <div className="flex items-center gap-2 mb-1 opacity-60 hover:opacity-100 cursor-help" title="Radio Room: Signal Activity">
                        <div className="flex -space-x-1">
                            <div className="relative">
                                <Slack className="w-3 h-3 text-slate-400" />
                                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div>
                            </div>
                            <div className="relative">
                                <Mail className="w-3 h-3 text-slate-400" />
                            </div>
                            <div className="relative">
                                <MessageSquare className="w-3 h-3 text-slate-400" />
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">1 SIGNAL</span>
                    </div>

                    <div className="flex items-center justify-end w-full">
                        <KnotMeter />
                    </div>
                    <div className="w-full border-t border-slate-200 my-1"></div>
                    <button 
                      onClick={onToggleDevOverlay}
                      className={`flex items-center gap-1 shrink-0 text-xs ${isDevOverlayActive ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Toggle Tangled Lines (Dev Overlay)"
                    >
                      <Bug className="w-3 h-3" />
                      v1.9
                    </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={onToggleDevOverlay}
                className={`${isDevOverlayActive ? 'text-red-500' : 'text-slate-400'} hover:text-slate-600`}
                title="Dev Overlay"
              >
                <Bug className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};
