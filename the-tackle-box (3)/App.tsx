
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

import { WeatherLayer } from './components/WeatherLayer';
import { SOSModal } from './components/SOSModal';
import { TheCurrent } from './components/TheCurrent';

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
            } catch (err) { }
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
