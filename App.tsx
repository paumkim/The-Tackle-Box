
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
import { RightControlRail } from './components/RightControlRail';
import { CaptainInteractionLayer } from './components/CaptainInteractionLayer';
import { DeployNetButton } from './components/DeployNetButton';
import { HookDeck } from './components/HookDeck';
import { GlobalContextMenu } from './components/GlobalContextMenu';
import { TheDepths } from './components/TheDepths'; 
import { ShipManifest } from './components/ShipManifest';
import { ViewState, CrewStatus, FlareType, WeatherCondition } from './types';
import { Search, SplitSquareHorizontal, Minimize2, X, Compass, Users, MapPin, CloudRain, AlertTriangle, Siren, Grid, Clock, Radio, Activity, Waves } from 'lucide-react';
import { useAppStore } from './store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { NotificationManager } from './utils/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { Diagnostics } from './utils/diagnostics';

const WeatherLayer: React.FC<{ condition: WeatherCondition }> = React.memo(({ condition }) => {
  if (condition === 'CLEAR') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden will-change-transform">
        {/* THE MIST (Fog) - Updated for Transparent Hull Protocol: removed blur */}
        {(condition === 'FOG' || condition === 'RAIN') && (
            <div className="absolute inset-0 bg-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/20 via-transparent to-slate-100/20 animate-current opacity-30 will-change-transform"></div>
                {condition === 'RAIN' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-5 mix-blend-multiply will-change-transform"></div>}
            </div>
        )}

        {/* STORM SURGE */}
        {condition === 'STORM' && (
            <div className="absolute inset-0 bg-slate-900/20 mix-blend-overlay">
                <div className="absolute inset-0 bg-black/5 animate-pulse"></div>
                {/* Lightning Flashes */}
                <div className="absolute inset-0 bg-white opacity-0 animate-[ping_5s_infinite]"></div>
            </div>
        )}
    </div>
  );
});

// The Current: Predictive Workload Meter
const TheCurrent = () => {
    const inboxCount = useLiveQuery(() => db.tasks.filter(t => t.projectId === undefined).count()) || 0;
    const completedToday = useLiveQuery(() => db.tasks.where('isCompleted').equals(1).count()) || 0; 
    const setShoreLeave = useAppStore(state => state.setShoreLeave);

    const velocity = Math.min(2, Math.max(0, (inboxCount / (Math.max(1, completedToday) + 5)))); 
    const rotation = (velocity * 90) - 45; 
    const isRough = velocity > 1.2;

    return (
        <div 
            className={`hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border shadow-sm transition-all cursor-help ${isRough ? 'bg-amber-50 border-amber-200' : 'bg-[#fdfbf7] border-stone-300 hover:border-stone-400'}`}
            title={`Current Velocity: ${velocity.toFixed(2)}. ${isRough ? 'Rough Seas - Shore Leave Recommended' : 'Conditions Stable'}`}
            onClick={isRough ? () => setShoreLeave(true) : undefined}
        >
            <div className="relative w-5 h-2.5 overflow-hidden flex items-end justify-center shrink-0">
                <div className="absolute bottom-0 w-4 h-4 rounded-full border-2 border-stone-400 border-b-transparent border-r-transparent transform rotate-45"></div>
                <motion.div 
                    className={`absolute bottom-0 w-0.5 h-2 origin-bottom rounded-full ${isRough ? 'bg-amber-600' : 'bg-slate-800'}`}
                    animate={{ rotate: rotation }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                />
            </div>
            <div className="flex items-baseline gap-2 leading-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline font-serif">Current</span>
                <span className={`text-xs font-bold font-mono ${isRough ? 'text-amber-700' : 'text-slate-600'}`}>
                    {isRough ? 'SURGE' : (velocity < 0.3 ? 'SLACK' : 'FLOW')}
                </span>
            </div>
            {isRough && <Waves className="w-3 h-3 text-amber-500 animate-pulse ml-1" />}
        </div>
    );
};

const SOSModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [ticker, setTicker] = useState("Broadcasting distress signal to Fleet Command...");
  
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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-red-900/20"
    >
       <motion.div 
         animate={{ opacity: [0.1, 0.2, 0.1] }}
         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
         className="absolute inset-0 bg-red-600/5 pointer-events-none"
       />

       <div className="bg-[#fdfbf7] p-8 rounded-xl shadow-2xl border-4 border-red-500 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none"></div>
          
          <div className="relative z-10">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-200 relative">
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
              <p className="text-sm font-mono text-red-900/70 mb-8 h-6">{ticker}</p>
              
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
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('tackle_current_view');
    return (saved as ViewState) || ViewState.DASHBOARD;
  });
  
  const [history, setHistory] = useState<ViewState[]>([currentView]);
  const [isSplitView, setIsSplitView] = useState(false);
  const [secondaryView, setSecondaryView] = useState<ViewState>(ViewState.NOTES);

  const [isLiveWellOpen, setIsLiveWellOpen] = useState(false);
  const isSonarOpen = useAppStore(state => state.isSonarOpen);
  const setSonarOpen = useAppStore(state => state.setSonarOpen);
  const [showDailyCatch, setShowDailyCatch] = useState(false);
  const [isDevOverlayActive, setIsDevOverlayActive] = useState(false);
  const isDepthsOpen = useAppStore(state => state.isDepthsOpen);
  const setDepthsOpen = useAppStore(state => state.setDepthsOpen);
  const [heading, setHeading] = useState(340);

  const sidebarState = useAppStore(state => state.sidebarState);
  const isSubmerged = useAppStore(state => state.isSubmerged);
  const cabinMode = useAppStore(state => state.cabinMode);
  const isOvertime = useAppStore(state => state.isOvertime);
  const isNightWatch = useAppStore(state => state.isNightWatch);
  const checkSunset = useAppStore(state => state.checkSunset);
  const themeMode = useAppStore(state => state.themeMode);
  const highContrastMode = useAppStore(state => state.highContrastMode);
  const shiftDuration = useAppStore(state => state.shiftDuration);
  const bilgePumpEnabled = useAppStore(state => state.bilgePumpEnabled);
  const layoutMode = useAppStore(state => state.layoutMode);
  const wakeLockEnabled = useAppStore(state => state.wakeLockEnabled);
  
  const navigationRequest = useAppStore(state => state.navigationRequest);
  const resolveNavigation = useAppStore(state => state.resolveNavigation);

  const crewManifest = useAppStore(state => state.crewManifest);
  const locationEnabled = useAppStore(state => state.locationEnabled);
  const currentLocation = useAppStore(state => state.currentLocation);
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);
  const fetchWeather = useAppStore(state => state.fetchWeather);
  const weatherCondition = useAppStore(state => state.weatherCondition);
  const setWeatherCondition = useAppStore(state => state.setWeatherCondition);

  const sosActive = useAppStore(state => state.sosActive);
  const setSosActive = useAppStore(state => state.setSosActive);
  const setCurrentSpeed = useAppStore(state => state.setCurrentSpeed);
  const setDragDetected = useAppStore(state => state.setDragDetected);

  const topTask = useLiveQuery(() => db.tasks.where('isCompleted').equals(0).first());
  const pendingSignalCount = useLiveQuery(() => db.contacts.where('signalResponse').equals('PENDING').count()) || 0;
  const inboxCount = useLiveQuery(() => db.tasks.filter(t => t.projectId === undefined).count()) || 0;
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());

  useEffect(() => {
    checkSunset();
  }, [checkSunset]);

  // --- DIAGNOSTIC ENGINE START ---
  useEffect(() => {
    Diagnostics.startHeartbeat((fps) => {
      // Logic: 60fps = 18.5kts (Optimal)
      // < 45fps = Drag detected (Yellow/Red)
      const baseSpeed = (fps / 60) * 18.5;
      
      // Add mechanical noise to the gauge for realism
      const noise = (Math.random() - 0.5) * 0.2;
      const knots = Math.max(0, Math.min(25, baseSpeed + noise));
      
      setCurrentSpeed(knots);
      
      if (fps < 45) {
        setDragDetected(true);
        if (Math.random() > 0.95) { // Throttle logs
            Diagnostics.log('WARN', 'Engine', `Performance Drag: ${fps} FPS`);
        }
      } else {
        setDragDetected(false);
      }
    });
    
    Diagnostics.log('INFO', 'Bridge', 'Vessel systems initialized. Diagnostic engine running.');
  }, [setCurrentSpeed, setDragDetected]);
  // --- DIAGNOSTIC ENGINE END ---

  const handleNavigate = (view: ViewState) => {
      if (view === currentView) return;
      setCurrentView(view);
      setHistory(prev => [...prev, view]);
      localStorage.setItem('tackle_current_view', view);
  };

  useEffect(() => {
      if (navigationRequest) {
          handleNavigate(navigationRequest);
          resolveNavigation();
      }
  }, [navigationRequest, resolveNavigation]);

  useEffect(() => {
      if (sosActive) {
          setWeatherCondition('STORM');
          return;
      }
      if (inboxCount > 5 || pendingSignalCount > 5) {
          setWeatherCondition('FOG');
          return;
      }
      setWeatherCondition('CLEAR');
  }, [sosActive, inboxCount, pendingSignalCount, setWeatherCondition]);

  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    };
    const releaseWakeLock = async () => {
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    };
    if (wakeLockEnabled) {
      requestWakeLock();
      const handleVisibilityChange = () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
          requestWakeLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        releaseWakeLock();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      releaseWakeLock();
    }
  }, [wakeLockEnabled]);

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
          const interval = setInterval(fetchWeather, 30 * 60 * 1000);
          return () => clearInterval(interval);
      }
  }, [currentLocation, fetchWeather]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useAppStore.getState().isSubmerged) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
        setHeading(prev => {
            const drift = (Math.random() - 0.5) * 0.4;
            return Math.max(338, Math.min(342, prev + drift));
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      case ViewState.SHIP_MANIFEST: return <ShipManifest />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`deep-water-transition h-screen w-screen overflow-hidden flex justify-center relative ${themeMode === 'MIDNIGHT' ? 'bg-slate-900 text-slate-200' : 'bg-[#f4f1ea] text-slate-800'} ${isNightWatch && themeMode === 'PAPER' ? 'sepia-[.2]' : ''} ${highContrastMode ? 'contrast-125 font-semibold' : ''}`}>
      
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none z-0"></div>

      <CaptainInteractionLayer />
      <GlobalContextMenu />
      
      <WeatherLayer condition={weatherCondition} />
      <DeepWater isActive={isSubmerged} />
      {bilgePumpEnabled && <BilgeWater />}

      <PatcoMonitor />
      <AudioBridge />
      <SafeHarbor />
      <ShoreLeave />
      <HookDeck />
      <SOSModal isOpen={sosActive} onClose={() => setSosActive(false)} />
      {showDailyCatch && <DailyCatch onComplete={() => setShowDailyCatch(false)} />}
      <TheBuoy />
      <ScriptLure />
      
      <TheDepths isOpen={isDepthsOpen} onClose={() => setDepthsOpen(false)} />

      <div className={`flex w-full h-full shadow-2xl relative bridge-hull bg-transparent z-10 ${layoutMode === 'FULL_HULL' ? 'max-w-[1440px] mx-auto border-x border-stone-300' : 'w-full'}`}>
          
          <Sidebar 
            currentView={currentView} 
            onChangeView={handleNavigate} 
            isDevOverlayActive={isDevOverlayActive}
            onToggleDevOverlay={() => setIsDevOverlayActive(!isDevOverlayActive)}
          />

          <main className={`flex-1 flex flex-col min-w-0 relative z-10 transition-colors border-r border-stone-300 ${themeMode === 'MIDNIGHT' ? 'bg-slate-900/95 border-slate-700' : 'bg-[#fdfbf7]/95'} ${cabinMode && isSubmerged ? 'brightness-90 contrast-110' : ''}`}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none z-0"></div>

              <VoyageBar />
              <FishingLine />

              <header className={`h-16 flex items-center justify-between px-6 border-b z-50 shrink-0 transition-colors ${themeMode === 'MIDNIGHT' ? 'bg-slate-900/80 border-slate-700' : 'bg-[#fdfbf7]/80 border-stone-300'} relative z-20`}>
                  <div className="flex items-center gap-4">
                  {isSubmerged ? (
                      <div className="flex items-center gap-3 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-[#3B4B5F]"></div>
                      <span className="font-mono text-[#3B4B5F] text-sm tracking-widest uppercase">Underway</span>
                      </div>
                  ) : (
                      <>
                      <h1 className="font-bold tracking-tight hidden md:block font-serif text-slate-800">
                          {currentView.charAt(0) + currentView.slice(1).toLowerCase().replace('_', ' ')}
                      </h1>
                      
                      <div className={`hidden lg:flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded border ml-4 animate-in fade-in slide-in-from-left-2 shadow-sm ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-[#fdfbf7] border-stone-300 text-slate-500'}`}>
                          <Compass className="w-3 h-3 text-blue-700" />
                          <span className="font-bold tabular-nums">HDG {heading.toFixed(0)}°</span>
                          <span className="opacity-30">|</span>
                          <span className="truncate max-w-[150px] uppercase font-bold opacity-80">{topTask ? topTask.title : currentView}</span>
                      </div>
                      </>
                  )}
                  </div>

                  <div className="flex items-center gap-3">
                  <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-[#fdfbf7] border-stone-300 text-stone-600 hover:border-stone-400'}`} title="Estimated Arrival">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      <span className={`text-xs font-mono font-bold ${activeSession ? 'text-[#3B4B5F]' : 'text-slate-500'}`}>{getETA()}</span>
                  </div>

                  <TheCurrent />

                  <div className="w-px h-4 bg-stone-300 mx-1"></div>
                  
                  {!isSubmerged && (
                      <>
                      <button 
                          onClick={() => setIsSplitView(!isSplitView)}
                          className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${isSplitView ? 'navigator-glass text-slate-800' : (themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200' : 'bg-[#fdfbf7] border-stone-300 text-slate-600 hover:text-slate-800 hover:border-slate-400 hover:bg-stone-50')}`}
                          title="The Outrigger (Split View)"
                      >
                          <SplitSquareHorizontal className="w-4 h-4" />
                          <span className="text-xs font-medium hidden xl:inline font-serif">Outrigger</span>
                      </button>
                      </>
                  )}

                  <DeployNetButton 
                      onOpenFullNet={() => setIsLiveWellOpen(true)}
                      themeMode={themeMode}
                  />

                  <button 
                      onClick={() => setSonarOpen(true)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${themeMode === 'MIDNIGHT' ? 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white' : 'bg-[#fdfbf7] border-stone-300 text-slate-600 hover:border-slate-400 hover:bg-stone-50 hover:text-slate-900'} ${pendingSignalCount > 0 ? 'ring-2 ring-[#3B4B5F]/20' : ''}`}
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

              <div className="flex-1 overflow-hidden flex relative z-10">
                  <div className={`flex-1 overflow-hidden h-full min-w-[300px] border-r ${themeMode === 'MIDNIGHT' ? 'border-slate-700' : 'border-stone-300'}`}>
                      {renderViewContent(currentView)}
                  </div>

                  {isSplitView && !isSubmerged && (
                      <div className={`flex-1 overflow-hidden h-full min-w-[300px] relative border-l ${themeMode === 'MIDNIGHT' ? 'bg-slate-900 border-slate-700' : 'bg-[#fdfbf7] border-stone-300'}`}>
                      <div className="absolute top-4 right-4 z-10 flex gap-2">
                          <select 
                          value={secondaryView} 
                          onChange={(e) => setSecondaryView(e.target.value as ViewState)}
                          className="bg-white border border-stone-300 text-xs rounded shadow-sm px-2 py-1 outline-none focus:ring-1 focus:ring-blue-300 text-slate-800 font-serif"
                          >
                          {Object.values(ViewState).map(v => (
                              <option key={v} value={v}>{v}</option>
                          ))}
                          </select>
                          <button onClick={() => setIsSplitView(false)} className="p-1 bg-white border border-stone-300 rounded hover:text-red-500 text-slate-500">
                          <X className="w-4 h-4" />
                          </button>
                      </div>
                      {renderViewContent(secondaryView)}
                      </div>
                  )}
              </div>
          </main>

          <RightControlRail />
      
      </div>

      <LiveWell isOpen={isLiveWellOpen} onClose={() => setIsLiveWellOpen(false)} />
      <Sonar isOpen={isSonarOpen} onClose={() => setSonarOpen(false)} onNavigate={handleNavigate} />
      <TheNet />

      {cabinMode && isSubmerged && (
          <div className="fixed inset-0 pointer-events-none z-[60] shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] transition-all duration-1000 mix-blend-multiply"></div>
      )}

      {isOvertime && (
          <div className="fixed inset-0 pointer-events-none z-[55] bg-orange-500/5 mix-blend-overlay shadow-[inset_0_0_100px_rgba(255,165,0,0.2)] transition-opacity duration-[2000ms]"></div>
      )}

    </div>
  );
};
