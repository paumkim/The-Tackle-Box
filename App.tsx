
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
import { LogViewer } from './components/LogViewer';
import { ViewState, CrewStatus, FlareType, WeatherCondition } from './types';
import { Search, SplitSquareHorizontal, Minimize2, X, Compass, Users, MapPin, CloudRain, AlertTriangle, Siren, Grid, Clock, Radio, Activity, Waves, Anchor, Terminal } from 'lucide-react';
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
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [diagnosticSnapshot, setDiagnosticSnapshot] = useState<any>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const currentFPS = useAppStore(state => state.currentFPS);
  const HOLD_DURATION = 5000; // 5 seconds for critical safety

  // Immersive Lockdown: Fullscreen, Context Block & Diagnostic Snapshot
  useEffect(() => {
      if (isOpen) {
          document.documentElement.requestFullscreen().catch((err) => console.warn("Fullscreen blocked:", err));
          
          const blockContext = (e: Event) => e.preventDefault();
          document.addEventListener('contextmenu', blockContext);
          
          // Capture Forensic Snapshot
          setDiagnosticSnapshot(Diagnostics.getVitals());

          return () => {
              document.removeEventListener('contextmenu', blockContext);
              if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
              }
          };
      }
  }, [isOpen]);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
      if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return;
      
      setIsHolding(true);
      const start = Date.now();
      
      if (navigator.vibrate) navigator.vibrate(50); // Initial pulse

      holdIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - start;
          const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
          setHoldProgress(progress);
          
          if (progress >= 100) {
              if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
              if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
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
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#f4ecd8] flex flex-col items-center justify-center select-none overflow-hidden cursor-default"
      >
         {/* Paper Texture Overlay */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none"></div>
         
         {/* Red Wash (Emergency Tint) */}
         <div className="absolute inset-0 bg-red-900/10 mix-blend-multiply pointer-events-none"></div>
         
         {/* Vignette */}
         <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(127,29,29,0.5)] pointer-events-none"></div>

         <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full p-8">
            
            {/* Warning Header */}
            <div className="mb-8 border-b-4 border-red-800/20 pb-6 w-full flex flex-col items-center">
                <Siren className="w-16 h-16 text-red-700 animate-pulse mb-4" />
                <h2 className="text-4xl font-black text-red-900 tracking-[0.2em] uppercase font-serif">
                    S.O.S.
                </h2>
                <p className="text-sm text-red-800 font-mono mt-2 tracking-widest font-bold bg-red-100/50 px-4 py-1 rounded">
                    EMERGENCY LOCKDOWN PROTOCOL
                </p>
            </div>

            {/* Forensic Snapshot Panel (Black Box Data) */}
            {diagnosticSnapshot && (
              <div className="bg-slate-900/90 border-2 border-red-500/50 rounded-lg p-4 mb-8 w-full max-w-md font-mono text-xs text-red-200 shadow-2xl relative overflow-hidden text-left">
                 {/* Header */}
                 <div className="flex justify-between border-b border-red-500/30 pb-2 mb-2">
                    <span className="font-bold uppercase tracking-widest flex items-center gap-2">
                       <Terminal className="w-3 h-3" /> System Failure Record
                    </span>
                    <span>{new Date(diagnosticSnapshot.timestamp).toLocaleTimeString()}</span>
                 </div>

                 {/* FPS History Graph (SVG) */}
                 <div className="h-16 w-full bg-slate-950/50 rounded border border-red-900/30 mb-3 relative flex items-end px-1 overflow-hidden">
                    {diagnosticSnapshot.performance.fpsHistory.map((fps: number, i: number) => (
                       <div 
                         key={i} 
                         className="flex-1 bg-red-500/50 mx-px"
                         style={{ height: `${Math.min(100, (fps / 60) * 100)}%` }}
                       />
                    ))}
                    <div className="absolute top-1 right-2 text-[9px] text-red-400 font-bold">ENGINE LOAD</div>
                 </div>

                 {/* Logs */}
                 <div className="space-y-1 opacity-80">
                    {diagnosticSnapshot.recentLogs.filter((l: any) => l.level === 'WARN' || l.level === 'ERROR').slice(0, 4).map((log: any) => (
                       <div key={log.id} className="truncate text-[10px]">
                          <span className="text-red-500 font-bold">[{log.level}]</span> <span className="text-slate-400">[{log.source}]</span> {log.message}
                       </div>
                    ))}
                    {diagnosticSnapshot.recentLogs.filter((l: any) => l.level === 'WARN' || l.level === 'ERROR').length === 0 && (
                        <div className="text-slate-500 italic">No critical errors logged in buffer.</div>
                    )}
                 </div>
              </div>
            )}

            {/* Heartbeat Visualization (Live Fallback) */}
            {!diagnosticSnapshot && (
                <div className="w-64 h-24 relative flex items-center justify-center mb-12 opacity-90 bg-red-50/40 rounded-lg border border-red-200/50">
                    <svg className="w-full h-full p-4" viewBox="0 0 200 60" preserveAspectRatio="none">
                        <path d="M0,30 Q 50,28 100,30 T 200,30" fill="none" stroke="#7f1d1d" strokeWidth="1" strokeOpacity="0.2" />
                        <motion.path 
                            d="M0,30 L60,30 L70,10 L80,50 L90,30 L200,30" 
                            fill="none" 
                            stroke={currentFPS < 60 ? "#dc2626" : "#991b1b"} 
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ 
                                pathLength: [0, 1, 1], 
                                opacity: [0, 1, 0],
                                pathOffset: [0, 0, 1]
                            }}
                            transition={{ 
                                duration: 1, // Rapid pulse for emergency
                                repeat: Infinity, 
                                ease: "linear",
                                times: [0, 0.8, 1]
                            }}
                        />
                    </svg>
                    <div className="absolute top-2 right-2 text-[10px] font-mono text-red-800 font-bold">
                        ENGINE: {currentFPS} FPS
                    </div>
                </div>
            )}

            {/* The Red Copper Seal Button */}
            <div className="relative group scale-125">
                <div className="absolute -top-12 left-0 right-0 text-center transition-opacity duration-300">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] font-serif ${isHolding ? 'text-red-700' : 'text-red-900/40'}`}>
                        {isHolding ? "DISENGAGING LOCK..." : "HOLD TO CANCEL"}
                    </span>
                </div>

                <button 
                    onMouseDown={startHold}
                    onMouseUp={endHold}
                    onMouseLeave={endHold}
                    onTouchStart={startHold}
                    onTouchEnd={endHold}
                    className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-[0_15px_35px_rgba(127,29,29,0.4)] active:scale-95 active:shadow-inner transition-transform duration-100"
                    style={{
                        background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #450a0a 100%)', // Red Copper Gradient
                    }}
                >
                    {/* Inner pressed groove */}
                    <div className="absolute inset-2 rounded-full border-2 border-[#450a0a]/30 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4)]"></div>
                    
                    {/* Ink Fill Progress (Crimson SVG Ring) */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#450a0a" strokeWidth="1" opacity="0.3" />
                        <circle 
                            cx="50" cy="50" r="46" 
                            fill="none" 
                            stroke="#000000" // Darkest ink
                            strokeWidth="8"
                            strokeDasharray="289"
                            strokeDashoffset={289 - (289 * holdProgress / 100)}
                            strokeLinecap="butt"
                            className="transition-all duration-75 ease-linear"
                            style={{ mixBlendMode: 'overlay' }}
                        />
                    </svg>

                    {/* Button Face */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-[#fca5a5]">
                        <Anchor className={`w-8 h-8 mb-1 ${isHolding ? 'animate-pulse text-white' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest font-serif leading-none text-white/90">
                            ABORT
                        </span>
                    </div>
                </button>
            </div>

         </div>
         
         {/* Footer Disclaimer */}
         <div className="absolute bottom-6 text-[10px] text-red-900/50 font-serif italic opacity-80">
             Vessel in Distress Mode. Controls locked for safety.
         </div>
      </motion.div>
    </AnimatePresence>
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
  const developerMode = useAppStore(state => state.developerMode);
  
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
  const setCurrentFPS = useAppStore(state => state.setCurrentFPS);
  const setDragDetected = useAppStore(state => state.setDragDetected);

  const topTask = useLiveQuery(() => db.tasks.where('isCompleted').equals(0).first());
  const pendingSignalCount = useLiveQuery(() => db.contacts.where('signalResponse').equals('PENDING').count()) || 0;
  const inboxCount = useLiveQuery(() => db.tasks.filter(t => t.projectId === undefined).count()) || 0;
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());

  useEffect(() => {
    checkSunset();
  }, [checkSunset]);

  // --- DIAGNOSTIC ENGINE & GLOBAL ERROR CATCHER ---
  useEffect(() => {
    Diagnostics.startHeartbeat((fps) => {
      // Feed the real FPS to the bridge
      setCurrentFPS(fps);
      
      // Calculate speed based on FPS (60fps = 18.5kts)
      const baseSpeed = (fps / 60) * 18.5;
      const noise = (Math.random() - 0.5) * 0.2;
      const knots = Math.max(0, Math.min(25, baseSpeed + noise));
      
      setCurrentSpeed(knots);
      
      if (fps < 45) {
        setDragDetected(true);
      } else {
        setDragDetected(false);
      }
    });
    
    Diagnostics.info('Bridge', 'Vessel systems initialized. Black Box recording.');

    const handleError = (event: ErrorEvent) => {
        Diagnostics.error('System', event.message, { stack: event.error?.stack });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
        Diagnostics.error('Promise', event.reason?.message || 'Unhandled Rejection', event.reason);
    };

    // Hotkey Listener for Dev Overlay (Stealth Mode)
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl + Shift + D
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            // Only toggle if developer mode is active
            if (useAppStore.getState().developerMode) {
                setIsDevOverlayActive(prev => !prev);
            }
        }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
        window.removeEventListener('keydown', handleKeyDown);
    }
  }, [setCurrentSpeed, setCurrentFPS, setDragDetected]);
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
                      Diagnostics.warn('Nav', 'Sextant Error', err);
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
      case ViewState.DRIFT_REPORT: return <DriftReport />;
      case ViewState.SHIP_MANIFEST: return <ShipManifest />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`deep-water-transition h-screen w-screen overflow-hidden flex justify-center relative ${themeMode === 'MIDNIGHT' ? 'bg-slate-900 text-slate-200' : 'bg-[#f4f1ea] text-slate-800'} ${isNightWatch && themeMode === 'PAPER' ? 'sepia-[.2]' : ''} ${highContrastMode ? 'contrast-125 font-semibold' : ''}`}>
      
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none z-0"></div>

      {developerMode && isDevOverlayActive && <LogViewer onClose={() => setIsDevOverlayActive(false)} />}

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
      <Settings />

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
