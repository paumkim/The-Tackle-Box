
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inbox } from './components/Inbox';
import { Tasks } from './components/Tasks';
import { Calendar } from './components/Calendar';
import { Notes } from './components/Notes';
import { Aquarium } from './components/Aquarium';
import { TheReef } from './components/TheReef';
import { DevJournal } from './components/DevJournal';
import { Settings } from './components/Settings';
import { LiveWell } from './components/LiveWell';
import { TangledLine } from './components/TangledLine';
import { Sonar } from './components/Sonar';
import { TheNet } from './components/TheNet';
import { TimeLog } from './components/TimeLog';
import { DeepWater } from './components/DeepWater';
import { DailyCatch } from './components/DailyCatch';
import { DriftReport } from './components/DriftReport';
import { MiniPlayer } from './components/MiniPlayer';
import { TheBuoy } from './components/TheBuoy';
import { ScriptLure } from './components/ScriptLure';
import { VoyageBar } from './components/VoyageBar';
import { FishingLine } from './components/FishingLine';
import { BilgeWater } from './components/BilgeWater';
import { AudioBridge } from './components/AudioBridge';
import { SafeHarbor } from './components/SafeHarbor';
import { PatcoMonitor } from './components/PatcoMonitor';
import { ShoreLeave } from './components/ShoreLeave';
import { TheBallast } from './components/TheBallast';
import { ViewState, CrewStatus, FlareType, WeatherCondition } from './types';
import { Search, SplitSquareHorizontal, Minimize2, X, Compass, Users, MapPin, CloudRain, AlertTriangle, Siren, Grid, Clock, Radio, Activity, Waves } from 'lucide-react';
import { useAppStore } from './store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { NotificationManager } from './utils/notifications';
import { motion, AnimatePresence } from 'framer-motion';

const WeatherLayer: React.FC<{ condition: WeatherCondition }> = ({ condition }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
        {/* CLEAR SEAS (Ripple Effect) */}
        {condition === 'CLEAR' && (
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_70%)] animate-[pulse-glow_10s_infinite]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-grain"></div>
            </div>
        )}

        {/* THE MIST (Fog) */}
        {(condition === 'FOG' || condition === 'RAIN') && (
            <div className="absolute inset-0 backdrop-blur-[1px] bg-white/20">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 via-transparent to-slate-100/50 animate-current opacity-50"></div>
                {condition === 'RAIN' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 mix-blend-multiply"></div>}
            </div>
        )}

        {/* STORM SURGE */}
        {condition === 'STORM' && (
            <div className="absolute inset-0 bg-slate-900/40 mix-blend-overlay">
                <div className="absolute inset-0 bg-black/10 animate-pulse"></div>
                {/* Lightning Flashes */}
                <div className="absolute inset-0 bg-white opacity-0 animate-[ping_5s_infinite]"></div>
            </div>
        )}
    </div>
  );
};

// The Current: Predictive Workload Meter
const TheCurrent = () => {
    // Logic: Inflow Velocity vs Outflow Capacity
    // Fix: Use filter() because checking for undefined key in index throws error
    const inboxCount = useLiveQuery(() => db.tasks.filter(t => t.projectId === undefined).count()) || 0;
    const completedToday = useLiveQuery(() => db.tasks.where('isCompleted').equals(1).count()) || 0; // Simplified for demo
    const setShoreLeave = useAppStore(state => state.setShoreLeave);

    // Velocity = Incoming Pressure / (Capacity + Buffer)
    // 0.5 = Calm, 1.0 = Optimal, > 1.5 = Surge
    const velocity = Math.min(2, Math.max(0, (inboxCount / (Math.max(1, completedToday) + 5)))); 
    
    // Rotation: -45deg (Calm) to 45deg (Surge)
    const rotation = (velocity * 90) - 45; 
    
    const isRough = velocity > 1.2;

    return (
        <div 
            className={`hidden md:flex items-center gap-2 px-3 py-1 rounded border shadow-sm transition-colors cursor-help ${isRough ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#E0E0E0]'}`}
            title={`Current Velocity: ${velocity.toFixed(2)}. ${isRough ? 'Rough Seas - Shore Leave Recommended' : 'Conditions Stable'}`}
            onClick={isRough ? () => setShoreLeave(true) : undefined}
        >
            <div className="relative w-8 h-4 overflow-hidden flex items-end justify-center">
                <div className="absolute bottom-0 w-6 h-6 rounded-full border-4 border-slate-200 border-b-transparent border-r-transparent transform rotate-45"></div>
                {/* Needle */}
                <motion.div 
                    className={`absolute bottom-0 w-0.5 h-3 origin-bottom rounded-full ${isRough ? 'bg-amber-500' : 'bg-slate-800'}`}
                    animate={{ rotate: rotation }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">The Current</span>
                <span className={`text-xs font-bold font-mono ${isRough ? 'text-amber-600' : 'text-slate-600'}`}>
                    {isRough ? 'SURGE' : (velocity < 0.3 ? 'SLACK' : 'FLOWING')}
                </span>
            </div>
            {isRough && <Waves className="w-3 h-3 text-amber-500 animate-pulse ml-1" />}
        </div>
    );
};

const SOSModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [ticker, setTicker] = useState("Broadcasting distress signal to Fleet Command...");
  
  // Hold Logic
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);
  const HOLD_DURATION = 3000;

  useEffect(() => {
      if (isOpen) {
          const messages = [
              "Locking GPS coordinates...",
              "Bypassing communication filters...",
              "Priority Channel Open.",
              "Help is en route. Stand by."
          ];
          let i = 0;
          const interval = setInterval(() => {
              if (i < messages.length) {
                  setTicker(messages[i]);
                  i++;
              }
          }, 2000);
          return () => clearInterval(interval);
      }
  }, [isOpen]);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
      setIsHolding(true);
      const start = Date.now();
      holdIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - start;
          const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
          setHoldProgress(progress);
          
          if (progress >= 100) {
              if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
              onClose();
          }
      }, 16);
  };

  const endHold = () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
  };

  if (!isOpen) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-red-900/60 backdrop-blur-sm"
    >
       {/* Background Pulse */}
       <motion.div 
         animate={{ opacity: [0.2, 0.5, 0.2] }}
         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
         className="absolute inset-0 bg-red-600/20 pointer-events-none"
       />

       <div className="bg-[#fdfbf7] p-8 rounded-xl shadow-2xl border-4 border-red-500 max-w-md w-full text-center relative overflow-hidden">
          {/* Paper Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
          
          <div className="relative z-10">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-200 relative">
                 {/* Progress Ring */}
                 {isHolding && (
                     <svg className="absolute inset-0 w-20 h-20 transform -rotate-90">
                         <circle cx="40" cy="40" r="38" stroke="transparent" strokeWidth="4" fill="none" />
                         <circle 
                            cx="40" cy="40" r="38" 
                            stroke="#ef4444" strokeWidth="4" fill="none" 
                            strokeDasharray="239" 
                            strokeDashoffset={239 - (239 * holdProgress / 100)}
                         />
                     </svg>
                 )}
                 <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-red-400"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                 />
                 <Siren className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              
              <h2 className="text-2xl font-black text-red-700 mb-2 uppercase tracking-widest font-serif">Emergency Beacon Active</h2>
              
              <p className="text-sm font-mono text-red-900/70 mb-8 h-6">
                 {ticker}
              </p>
              
              <button 
                 onMouseDown={startHold}
                 onMouseUp={endHold}
                 onMouseLeave={endHold}
                 onTouchStart={startHold}
                 onTouchEnd={endHold}
                 className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase tracking-wider transition-colors shadow-lg hover:shadow-red-500/50 select-none active:scale-95"
              >
                 {isHolding ? "HOLD TO STAND DOWN..." : "STAND DOWN"}
              </button>
          </div>
       </div>
    </motion.div>
  );
};

export const App = () => {
  // Navigation State with Persistence
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('tackle_current_view');
    return (saved as ViewState) || ViewState.DASHBOARD;
  });
  
  const [history, setHistory] = useState<ViewState[]>([currentView]);
  
  // Split View State "The Outrigger"
  const [isSplitView, setIsSplitView] = useState(false);
  const [secondaryView, setSecondaryView] = useState<ViewState>(ViewState.NOTES);

  // Layout State
  const [isLiveWellOpen, setIsLiveWellOpen] = useState(false);
  const [isSonarOpen, setIsSonarOpen] = useState(false);
  const [showDailyCatch, setShowDailyCatch] = useState(false);
  const [isDevOverlayActive, setIsDevOverlayActive] = useState(false);
  
  // Heading State (Dynamic)
  const [heading, setHeading] = useState(340);

  // Store Hooks
  const toggleSidebar = useAppStore(state => state.toggleSidebar);
  const sidebarState = useAppStore(state => state.sidebarState);
  const quietMode = useAppStore(state => state.quietMode);
  const isSubmerged = useAppStore(state => state.isSubmerged);
  const cabinMode = useAppStore(state => state.cabinMode);
  const isOvertime = useAppStore(state => state.isOvertime);
  const notificationSettings = useAppStore(state => state.notificationSettings);
  const isNightWatch = useAppStore(state => state.isNightWatch);
  const checkSunset = useAppStore(state => state.checkSunset);
  const setDragDetected = useAppStore(state => state.setDragDetected);
  const themeMode = useAppStore(state => state.themeMode);
  const highContrastMode = useAppStore(state => state.highContrastMode);
  const shiftDuration = useAppStore(state => state.shiftDuration);
  
  // Crew State
  const crewManifest = useAppStore(state => state.crewManifest);
  const updateCrewStatus = useAppStore(state => state.updateCrewStatus);
  const fireFlare = useAppStore(state => state.fireFlare);

  // Location & Weather
  const locationEnabled = useAppStore(state => state.locationEnabled);
  const currentLocation = useAppStore(state => state.currentLocation);
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);
  const fetchWeather = useAppStore(state => state.fetchWeather);
  const weatherCondition = useAppStore(state => state.weatherCondition);
  const setWeatherCondition = useAppStore(state => state.setWeatherCondition);
  const [showLocationRequest, setShowLocationRequest] = useState(false);

  // SOS
  const sosActive = useAppStore(state => state.sosActive);
  const setSosActive = useAppStore(state => state.setSosActive);

  // Top Task for Heading Compass
  const topTask = useLiveQuery(() => db.tasks.where('isCompleted').equals(0).first());
  
  // Live Well Counter
  const liveWellItemCount = useLiveQuery(() => db.assets.where('location').equals('live_well').count()) || 0;

  // Pending Signals Count (Sonar Focus Lens)
  const pendingSignalCount = useLiveQuery(() => db.contacts.where('signalResponse').equals('PENDING').count()) || 0;
  
  // Logic: Inflow for Fog
  const inboxCount = useLiveQuery(() => db.tasks.filter(t => t.projectId === undefined).count()) || 0;

  // Active Session for ETA
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());

  useEffect(() => {
    // Check if morning cast is enabled
    const morningCast = localStorage.getItem('tackle_morning_cast');
    if (morningCast === 'true') {
      setShowDailyCatch(true);
    }
    // Initial Sunset Check
    checkSunset();
  }, [checkSunset]);

  // Atmospheric Controller (Live Weather Logic)
  useEffect(() => {
      // 1. SOS -> STORM
      if (sosActive) {
          setWeatherCondition('STORM');
          return;
      }
      // 2. High Inbox -> FOG (The Mist)
      if (inboxCount > 5) {
          setWeatherCondition('FOG');
          return;
      }
      // 3. Pending Signals -> FOG
      if (pendingSignalCount > 5) {
          setWeatherCondition('FOG');
          return;
      }
      
      // Default -> CLEAR (Ripple)
      setWeatherCondition('CLEAR');

  }, [sosActive, inboxCount, pendingSignalCount, setWeatherCondition]);

  // Global Drag Watch
  useEffect(() => {
    let dragCounter = 0;
    
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        setDragDetected(true);
      }
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setDragDetected(false);
      }
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setDragDetected(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [setDragDetected]);

  // Location / Weather Sync (Data Only)
  useEffect(() => {
      if (locationEnabled && !currentLocation) {
          if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                  (pos) => {
                      setCurrentLocation({
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude
                      });
                  },
                  (err) => {
                      console.warn("Sextant Error:", err);
                  }
              );
          }
      }
  }, [locationEnabled, currentLocation, setCurrentLocation]);

  useEffect(() => {
      if (currentLocation) {
          fetchWeather();
          // Poll weather every 30 mins
          const interval = setInterval(fetchWeather, 30 * 60 * 1000);
          return () => clearInterval(interval);
      }
  }, [currentLocation, fetchWeather]);

  // Anchor Guard (Safe-Exit Protection)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useAppStore.getState().isSubmerged) {
        e.preventDefault();
        e.returnValue = ''; // Trigger browser confirmation dialog
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Heading Oscillation Effect
  useEffect(() => {
    const interval = setInterval(() => {
        // Drifts between 338 and 342
        setHeading(prev => {
            const drift = (Math.random() - 0.5) * 0.4;
            return Math.max(338, Math.min(342, prev + drift));
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulation: Crew Activity Loop
  useEffect(() => {
      const interval = setInterval(() => {
          // 5% chance every 10s for an event
          if (Math.random() > 0.95) {
              const target = crewManifest[Math.floor(Math.random() * crewManifest.length)];
              // Don't disturb if already in trouble
              if (target.status === 'AT_OARS' && !target.activeFlare) {
                  const eventType = Math.random() > 0.5 ? 'DRIFT' : 'FLARE';
                  
                  if (eventType === 'DRIFT') {
                      updateCrewStatus(target.id, 'DRIFTING');
                      NotificationManager.send("Bridge Alert", `${target.name} is drifting.`);
                  } else {
                      const flareType: FlareType = Math.random() > 0.6 ? 'RED' : (Math.random() > 0.5 ? 'WHITE' : 'GREEN');
                      fireFlare(target.id, flareType);
                      NotificationManager.send("SOS Signal", `${target.name} fired a ${flareType} flare!`);
                  }
              }
          }
      }, 10000);
      return () => clearInterval(interval);
  }, [crewManifest, updateCrewStatus, fireFlare]);

  // Notification Check Loop (Simulating push backend)
  useEffect(() => {
    if (!notificationSettings.enabled) return;

    const checkInterval = setInterval(async () => {
      if (Math.random() > 0.999) { // Very rare
         NotificationManager.send("Incoming Signal", "The Bait Shop has activity.");
      }
    }, 30000); // Check every 30s

    return () => clearInterval(checkInterval);
  }, [notificationSettings.enabled]);

  const handleNavigate = (view: ViewState) => {
    if (view !== currentView) {
      setHistory(prev => [...prev, view]);
    }
    setCurrentView(view);
    localStorage.setItem('tackle_current_view', view);
  };

  const handleDailyCatchComplete = () => {
    setShowDailyCatch(false);
  };

  // Hydration Script (Weekly Backup)
  useEffect(() => {
    const lastBackup = localStorage.getItem('tackle_last_backup');
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (!lastBackup || now - parseInt(lastBackup) > oneWeek) {
      console.log("Running Hydration Script: Backing up DB...");
      localStorage.setItem('tackle_last_backup', now.toString());
    }
  }, []);

  // Global Hotkeys & Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + S for Sonar
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setIsSonarOpen(prev => !prev);
      }
    };

    // Listen for internal copies
    document.addEventListener('copy', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          await db.clipboard.add({
            content: text,
            type: text.startsWith('http') ? 'link' : 'text',
            timestamp: Date.now()
          });
        }
      } catch (err) {
        // Permission likely denied or not focused
      }
    });

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ETA Calculation
  const getETA = () => {
      if (!activeSession) return 'DOCKED';
      const endTime = activeSession.startTime + (shiftDuration * 60 * 60 * 1000);
      return `ETA ${new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderViewContent = (view: ViewState) => {
    switch (view) {
      case ViewState.DASHBOARD: return <Dashboard />;
      case ViewState.INBOX: return <Inbox />;
      case ViewState.TASKS: return <Tasks />;
      case ViewState.CALENDAR: return <Calendar />;
      case ViewState.NOTES: return <Notes />;
      case ViewState.AQUARIUM: return <Aquarium />;
      case ViewState.REEF: return <TheReef />;
      case ViewState.DEV_JOURNAL: return <DevJournal />;
      case ViewState.SETTINGS: return <Settings />;
      case ViewState.DRIFT_REPORT: return <DriftReport />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`deep-water-transition flex h-screen w-screen overflow-hidden relative ${themeMode === 'MIDNIGHT' ? 'bg-slate-900 text-slate-200' : 'bg-[#F8F9FA] text-slate-800'} ${isNightWatch && themeMode === 'PAPER' ? 'sepia-[.2]' : ''} ${highContrastMode ? 'contrast-125 font-semibold' : ''}`}>
      
      {/* Weather Layer */}
      <WeatherLayer condition={weatherCondition} />

      {/* P.A.T.C.O. Monitoring System (Logic) */}
      <PatcoMonitor />

      {/* Soundscape Engine */}
      <AudioBridge />

      {/* Victory Modal */}
      <SafeHarbor />

      {/* Shore Leave Overlay */}
      <ShoreLeave />

      {/* SOS Modal */}
      <SOSModal isOpen={sosActive} onClose={() => setSosActive(false)} />

      {/* Zone 3: The Deep Water Background & Companion (Overlays only when active) */}
      <DeepWater isActive={isSubmerged} />

      {/* The Bilge Meter (Water Level) */}
      <BilgeWater />

      {/* The Anchorage (Session Control) */}
      <TimeLog />

      {/* The Ballast (Focus Timer) - Right Side */}
      <TheBallast />

      {/* Cabin Mode Vignette */}
      {cabinMode && isSubmerged && (
          <div className="fixed inset-0 pointer-events-none z-[60] shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] transition-all duration-1000 mix-blend-multiply"></div>
      )}

      {/* Lantern Mode (Midnight Oil) - Warm Glow Overlay */}
      {isOvertime && (
          <div className="fixed inset-0 pointer-events-none z-[55] bg-orange-500/5 mix-blend-overlay shadow-[inset_0_0_100px_rgba(255,165,0,0.2)] transition-opacity duration-[2000ms]"></div>
      )}

      {/* Modal: The Daily Catch */}
      {showDailyCatch && <DailyCatch onComplete={handleDailyCatchComplete} />}
      
      {/* The Buoy (Floating Call Overlay) */}
      <TheBuoy />
      
      {/* Script Lure (Slide-out) */}
      <ScriptLure />

      {/* Layout Grid: [Sidebar] [Workspace] [LiveWell] */}
      
      {/* 1. The Dock (Sidebar) */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={handleNavigate} 
        isDevOverlayActive={isDevOverlayActive}
        onToggleDevOverlay={() => setIsDevOverlayActive(!isDevOverlayActive)}
      />
      
      {/* 2. The Main Deck (Workspace) */}
      <main className={`flex-1 h-full overflow-hidden flex flex-col deep-water-transition z-10 relative opacity-100 ${cabinMode && isSubmerged ? 'brightness-90 contrast-110' : ''}`}>
        
        {/* Horizon View (Voyage Bar) - Always visible when underway or not */}
        <VoyageBar />

        {/* Fishing Line (Focus Tool) */}
        <FishingLine />

        {/* Top Bar (The Bridge) */}
        <header className={`h-16 flex items-center justify-between px-6 border-b z-20 shrink-0 transition-colors ${themeMode === 'MIDNIGHT' ? 'bg-slate-900/80 border-slate-700' : 'bg-[#F8F9FA]/80 border-[#E0E0E0]'} backdrop-blur-sm`}>
            {/* Left: Ghost Catch */}
            <div className="flex items-center gap-4">
               {isSubmerged ? (
                 <div className="flex items-center gap-3 animate-pulse">
                   <div className="w-2 h-2 rounded-full bg-[#3B4B5F]"></div>
                   <span className="font-mono text-[#3B4B5F] text-sm tracking-widest uppercase">Underway</span>
                 </div>
               ) : (
                 <>
                   <h1 className="font-bold tracking-tight hidden md:block">
                     {currentView.charAt(0) + currentView.slice(1).toLowerCase().replace('_', ' ')}
                   </h1>
                   
                   {/* Heading Compass */}
                   <div className={`hidden lg:flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded border ml-4 animate-in fade-in slide-in-from-left-2 shadow-sm ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-[#E0E0E0] text-slate-500'}`}>
                     <Compass className="w-3 h-3 text-blue-600" />
                     <span className="font-bold tabular-nums">HDG {heading.toFixed(0)}°</span>
                     <span className="opacity-30">|</span>
                     <span className="truncate max-w-[150px] uppercase font-bold opacity-80">{topTask ? topTask.title : currentView}</span>
                   </div>
                 </>
               )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
               
               {/* ETA Indicator */}
               <div className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded border shadow-sm ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-[#E0E0E0] text-slate-600'}`} title="Estimated Arrival">
                   <Clock className="w-3.5 h-3.5 opacity-60" />
                   <span className={`text-xs font-mono font-bold ${activeSession ? 'text-[#3B4B5F]' : 'text-slate-400'}`}>{getETA()}</span>
               </div>

               {/* The Current (Predictive Workload Meter) */}
               <TheCurrent />

               <div className="w-px h-4 bg-current opacity-20 mx-1"></div>
               
               {!isSubmerged && (
                 <>
                   <button 
                     onClick={() => setIsSplitView(!isSplitView)}
                     className={`p-2 rounded-lg transition-colors ${isSplitView ? 'bg-blue-100 text-blue-600' : (themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200' : 'bg-white border border-[#E0E0E0] text-slate-500 hover:text-slate-800')}`}
                     title="The Outrigger (Split View)"
                   >
                     <SplitSquareHorizontal className="w-5 h-5" />
                   </button>
                 </>
               )}

               <button 
                 onClick={() => setIsLiveWellOpen(!isLiveWellOpen)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'} ${liveWellItemCount > 0 ? 'ring-2 ring-slate-200' : ''}`}
                 title="Deploy Net (Live Well)"
               >
                 <Grid className={`w-3 h-3 ${themeMode === 'MIDNIGHT' ? '' : 'text-[#3B4B5F]'}`} />
                 Deploy Net
                 {liveWellItemCount > 0 && (
                     <span className="bg-[#3B4B5F] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">{liveWellItemCount}</span>
                 )}
               </button>

               <button 
                 onClick={() => setIsSonarOpen(true)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white' : 'bg-white border border-[#E0E0E0] text-slate-500 hover:border-blue-300 hover:text-blue-600'} ${pendingSignalCount > 0 ? 'ring-2 ring-[#3B4B5F]/20' : ''}`}
                 title={pendingSignalCount > 0 ? `${pendingSignalCount} Pending Signals` : "Sonar Scan (Alt + S)"}
               >
                 <Search className="w-3 h-3" />
                 Sonar
                 {pendingSignalCount > 0 && (
                     <span className="bg-[#3B4B5F] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 animate-pulse">{pendingSignalCount} PENDING</span>
                 )}
               </button>
            </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 overflow-hidden flex relative">
           {/* Primary View */}
           <div className={`flex-1 overflow-y-auto p-6 md:p-8 h-full min-w-[300px] border-r ${themeMode === 'MIDNIGHT' ? 'border-slate-700' : 'border-[#E0E0E0]'}`}>
              {renderViewContent(currentView)}
           </div>

           {/* The Outrigger (Secondary View) */}
           {isSplitView && !isSubmerged && (
             <div className={`flex-1 overflow-y-auto p-6 md:p-8 h-full min-w-[300px] relative border-l ${themeMode === 'MIDNIGHT' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50/50 border-[#E0E0E0]'}`}>
               <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <select 
                   value={secondaryView} 
                   onChange={(e) => setSecondaryView(e.target.value as ViewState)}
                   className="bg-white border border-[#E0E0E0] text-xs rounded shadow-sm px-2 py-1 outline-none focus:ring-1 focus:ring-blue-300 text-slate-800"
                 >
                   {Object.values(ViewState).map(v => (
                     <option key={v} value={v}>{v}</option>
                   ))}
                 </select>
                 <button onClick={() => setIsSplitView(false)} className="p-1 bg-white border border-[#E0E0E0] rounded hover:text-red-500 text-slate-500">
                   <X className="w-4 h-4" />
                 </button>
               </div>
               {renderViewContent(secondaryView)}
             </div>
           )}
        </div>
      </main>

      {/* Overlays */}
      <LiveWell isOpen={isLiveWellOpen} onClose={() => setIsLiveWellOpen(false)} />
      <Sonar isOpen={isSonarOpen} onClose={() => setIsSonarOpen(false)} onNavigate={handleNavigate} />
      <TheNet />

    </div>
  );
};
