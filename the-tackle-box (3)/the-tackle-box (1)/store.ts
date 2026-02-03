
import { create } from 'zustand';
import { Contact, SidebarState, UserRole, NotificationSettings, MapStyle, CompassMode, CrewMember, CrewStatus, FlareType, WeatherCondition, GPSCoordinates, Achievement, WeatherData, ThemeMode } from './types';
import { db } from './db';
import { NotificationManager } from './utils/notifications';

interface VoyageStats {
  duration: number;
  earnings: number;
  itemsCaught: number;
}

interface AppState {
  // Sidebar State
  sidebarState: SidebarState;
  preferredSidebarState: SidebarState; // Remembered state (full/mini)
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void; // Toggles between saved state and hidden
  toggleMiniMode: () => void; // Toggle between Full and Mini specifically
  
  pressureScore: number;
  setPressureScore: (score: number) => void;
  lastCopied: string | null;
  setLastCopied: (text: string) => void;
  
  // Comms State
  activeCall: Contact | null;
  setActiveCall: (contact: Contact | null) => void;
  isScriptDrawerOpen: boolean;
  toggleScriptDrawer: () => void;
  hookedContactId: number | null;
  setHookedContactId: (id: number | null) => void;
  
  // Settings
  quietMode: boolean;
  toggleQuietMode: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;
  localSearchEnabled: boolean;
  setLocalSearchEnabled: (enabled: boolean) => void;

  // Immersion & Soundscape
  cabinMode: boolean;
  toggleCabinMode: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  
  // P.A.T.C.O. Comm-Link
  patcoAudioEnabled: boolean;
  setPatcoAudioEnabled: (val: boolean) => void;
  patcoVisualsEnabled: boolean;
  setPatcoVisualsEnabled: (val: boolean) => void;
  patcoVolume: number;
  setPatcoVolume: (val: number) => void;
  patcoAlert: string | null; // High priority message override
  setPatcoAlert: (msg: string | null) => void;
  connectionStatus: 'GOOD' | 'LAG' | 'OFFLINE';
  setConnectionStatus: (status: 'GOOD' | 'LAG' | 'OFFLINE') => void;
  
  // Project Islands & Navigation
  activeProjectId: number | null;
  setActiveProject: (id: number | null) => void;
  hqName: string;
  setHqName: (name: string) => void;

  // Engagement & Ceremony
  safeHarborOpen: boolean;
  setSafeHarborOpen: (open: boolean) => void;
  isBottleCeremonyOpen: boolean;
  setBottleCeremonyOpen: (open: boolean) => void;
  isDepartureManifestOpen: boolean;
  setDepartureManifestOpen: (open: boolean) => void;
  
  lastVoyageStats: VoyageStats | null;
  setLastVoyageStats: (stats: VoyageStats) => void;
  
  bilgeLevel: number;
  setBilgeLevel: (level: number) => void;
  
  isOvertime: boolean;
  setOvertime: (val: boolean) => void;

  // The Diver State
  isSubmerged: boolean;
  toggleSubmersion: (active: boolean) => void;
  isDragDetected: boolean;
  setDragDetected: (val: boolean) => void;
  isDrifting: boolean;
  setDrifting: (val: boolean) => void;

  // The Fishing Line (Active Focus)
  activeTaskId: number | null;
  setActiveTask: (id: number | null) => void;

  // Captain's Role
  userRole: UserRole | null;
  setUserRole: (role: UserRole) => void;
  hasOnboarded: boolean;
  setHasOnboarded: (val: boolean) => void;
  captainStatus: CrewStatus;
  setCaptainStatus: (status: CrewStatus) => void;
  awayStartTime: number | null;

  // Notification Beacons
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Navigation & Identity
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
  compassMode: CompassMode;
  setCompassMode: (mode: CompassMode) => void;
  unitSystem: 'IMPERIAL' | 'METRIC';
  setUnitSystem: (system: 'IMPERIAL' | 'METRIC') => void;

  // Payroll & Roster
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  shiftDuration: number; // Hours
  setShiftDuration: (hours: number) => void;
  shoreLeaveDuration: number; // Minutes
  setShoreLeaveDuration: (minutes: number) => void;

  // Crew & Safety
  crewManifest: CrewMember[];
  updateCrewStatus: (id: string, status: CrewStatus) => void;
  fireFlare: (id: string, type: FlareType) => void;
  resolveFlare: (id: string) => void;
  throwLifebuoy: (id: string) => void;
  recentSafetyChecks: number[];
  performSafetyCheck: (crewId?: string) => Promise<void>;

  // Engine Room (Advanced Settings)
  flareSensitivity: number; // 0-100
  setFlareSensitivity: (val: number) => void;
  radarVolume: number; // 0-100
  setRadarVolume: (val: number) => void;
  knotSpeedSensitivity: number; // 0-100
  setKnotSpeedSensitivity: (val: number) => void;
  paperTextureIntensity: number; // 0-100
  setPaperTextureIntensity: (val: number) => void;
  crewPermissions: { canFireFlare: boolean; canViewVault: boolean };
  updateCrewPermissions: (perms: Partial<{ canFireFlare: boolean; canViewVault: boolean }>) => void;

  // Weather & Location
  locationEnabled: boolean;
  setLocationEnabled: (val: boolean) => void;
  currentLocation: GPSCoordinates | null;
  setCurrentLocation: (coords: GPSCoordinates | null) => void;
  weatherCondition: WeatherCondition;
  setWeatherCondition: (cond: WeatherCondition) => void;
  weatherData: WeatherData | null;
  fetchWeather: () => Promise<void>;
  isNightWatch: boolean;
  checkSunset: () => void;
  sextantError: string | null;
  signalStatus: 'SEARCHING' | 'LOCKED' | 'FALLBACK' | 'OFFLINE';
  calibrateSextant: () => Promise<void>;

  // SOS
  sosActive: boolean;
  setSosActive: (active: boolean) => void;
  sosLatchEnabled: boolean;
  setSosLatchEnabled: (val: boolean) => void;

  // Life on the Ship
  waterCount: number;
  drinkWater: () => void;
  isShoreLeave: boolean;
  setShoreLeave: (val: boolean) => void;
  isConfirmingBreak: boolean; // Mascot interaction state
  setConfirmingBreak: (val: boolean) => void;
  unlockAchievement: (title: string, desc: string, icon: string, tier: Achievement['tier']) => Promise<void>;

  // Utility Features
  morningBrief: string;
  setMorningBrief: (text: string) => void;
  supplyLink: string | null;
  setSupplyLink: (url: string | null) => void;
}

// Load initial state from local storage
const savedState = localStorage.getItem('vessel_sidebar_state') as SidebarState | null;
const initialState = savedState || 'full';

// Default to 'PLANNER' (The Navigator) if no role is saved.
const savedRole = localStorage.getItem('vessel_role') as UserRole | null;
const defaultRole = 'PLANNER'; 

const savedNotifications = localStorage.getItem('vessel_notifications');
const savedMapStyle = localStorage.getItem('vessel_map_style') as MapStyle | null;
const savedCompassMode = localStorage.getItem('vessel_compass_mode') as CompassMode | null;
const savedUnitSystem = localStorage.getItem('vessel_unit_system') as 'IMPERIAL' | 'METRIC' | null;

const savedHourlyRate = localStorage.getItem('vessel_hourly_rate');
const savedShiftDuration = localStorage.getItem('vessel_shift_duration');
const savedShoreLeaveDuration = localStorage.getItem('vessel_shore_leave_duration');
const savedHqName = localStorage.getItem('vessel_hq_name');

// Immersion Persistence
const savedSound = localStorage.getItem('vessel_sound_enabled');
const savedCabin = localStorage.getItem('vessel_cabin_mode');
const savedTheme = localStorage.getItem('vessel_theme') as ThemeMode | null;
const savedHighContrast = localStorage.getItem('vessel_high_contrast');
const savedLocalSearch = localStorage.getItem('vessel_local_search');

// P.A.T.C.O. Persistence
const savedPatcoAudio = localStorage.getItem('vessel_patco_audio');
const savedPatcoVisuals = localStorage.getItem('vessel_patco_visuals');
const savedPatcoVolume = localStorage.getItem('vessel_patco_volume');

// Engine Room Persistence
const savedFlareSens = localStorage.getItem('vessel_flare_sensitivity');
const savedRadarVol = localStorage.getItem('vessel_radar_volume');
const savedKnotSens = localStorage.getItem('vessel_knot_sensitivity');
const savedPaperInt = localStorage.getItem('vessel_paper_intensity');
const savedCrewPerms = localStorage.getItem('vessel_crew_permissions');
const savedLocationEnabled = localStorage.getItem('vessel_location_enabled');
const savedSosLatch = localStorage.getItem('vessel_sos_latch');

// Water persistence (daily reset)
const savedWaterDate = localStorage.getItem('vessel_water_date');
const savedWaterCount = localStorage.getItem('vessel_water_count');
const today = new Date().toLocaleDateString();
const initialWater = (savedWaterDate === today && savedWaterCount) ? parseInt(savedWaterCount) : 0;

// Brief persistence (daily reset)
const savedBriefDate = localStorage.getItem('vessel_brief_date');
const initialBrief = (savedBriefDate === today) ? (localStorage.getItem('vessel_morning_brief') || '') : '';

// Supply Hook
const savedSupplyLink = localStorage.getItem('vessel_supply_link');
const savedHookedContact = localStorage.getItem('vessel_hooked_contact');

// Default Coordinates (Cupertino - Apple Park / Tech Hub Proxy)
const DEFAULT_HOME_PORT: GPSCoordinates = { latitude: 37.3346, longitude: -122.0090 };

// Mock Crew
const INITIAL_CREW: CrewMember[] = [
    { id: '1', name: 'Navigator John', role: 'PLANNER', status: 'AT_OARS', lastHeartbeat: Date.now() },
    { id: '2', name: 'Sales Rep Sarah', role: 'SALES', status: 'AT_OARS', lastHeartbeat: Date.now() },
    { id: '3', name: 'Scholar Mike', role: 'STUDENT', status: 'AT_OARS', lastHeartbeat: Date.now() },
];

export const useAppStore = create<AppState>((set, get) => ({
  sidebarState: initialState,
  preferredSidebarState: initialState === 'hidden' ? 'full' : initialState,

  setSidebarState: (state) => {
    if (state !== 'hidden') {
      localStorage.setItem('vessel_sidebar_state', state);
      set({ sidebarState: state, preferredSidebarState: state });
    } else {
      set({ sidebarState: state });
    }
  },

  toggleSidebar: () => {
    const { sidebarState, preferredSidebarState } = get();
    if (sidebarState === 'hidden') {
      set({ sidebarState: preferredSidebarState });
    } else {
      set({ sidebarState: 'hidden' });
    }
  },

  toggleMiniMode: () => {
    const { sidebarState } = get();
    if (sidebarState === 'mini') {
        set({ sidebarState: 'full', preferredSidebarState: 'full' });
        localStorage.setItem('vessel_sidebar_state', 'full');
    } else {
        set({ sidebarState: 'mini', preferredSidebarState: 'mini' });
        localStorage.setItem('vessel_sidebar_state', 'mini');
    }
  },
  
  pressureScore: 0,
  setPressureScore: (score) => set({ pressureScore: score }),
  
  lastCopied: null,
  setLastCopied: (text) => set({ lastCopied: text }),

  activeCall: null,
  setActiveCall: (contact) => set({ activeCall: contact, isScriptDrawerOpen: !!contact }),
  
  isScriptDrawerOpen: false,
  toggleScriptDrawer: () => set((state) => ({ isScriptDrawerOpen: !state.isScriptDrawerOpen })),
  
  hookedContactId: savedHookedContact ? parseInt(savedHookedContact) : null,
  setHookedContactId: (id) => {
      if (id) localStorage.setItem('vessel_hooked_contact', id.toString());
      else localStorage.removeItem('vessel_hooked_contact');
      set({ hookedContactId: id });
  },

  quietMode: false,
  toggleQuietMode: () => set((state) => ({ quietMode: !state.quietMode })),
  
  themeMode: savedTheme || 'PAPER',
  setThemeMode: (mode) => {
      localStorage.setItem('vessel_theme', mode);
      set({ themeMode: mode });
  },
  highContrastMode: savedHighContrast === 'true',
  setHighContrastMode: (enabled) => {
      localStorage.setItem('vessel_high_contrast', String(enabled));
      set({ highContrastMode: enabled });
  },
  localSearchEnabled: savedLocalSearch === 'true',
  setLocalSearchEnabled: (enabled) => {
      localStorage.setItem('vessel_local_search', String(enabled));
      set({ localSearchEnabled: enabled });
  },

  cabinMode: savedCabin === 'true',
  toggleCabinMode: () => set(state => {
      const newVal = !state.cabinMode;
      localStorage.setItem('vessel_cabin_mode', String(newVal));
      return { cabinMode: newVal };
  }),

  soundEnabled: savedSound === 'true',
  toggleSound: () => set(state => {
      const newVal = !state.soundEnabled;
      localStorage.setItem('vessel_sound_enabled', String(newVal));
      return { soundEnabled: newVal };
  }),

  patcoAudioEnabled: savedPatcoAudio === 'true',
  setPatcoAudioEnabled: (val) => {
      localStorage.setItem('vessel_patco_audio', String(val));
      set({ patcoAudioEnabled: val });
  },
  patcoVisualsEnabled: savedPatcoVisuals !== 'false',
  setPatcoVisualsEnabled: (val) => {
      localStorage.setItem('vessel_patco_visuals', String(val));
      set({ patcoVisualsEnabled: val });
  },
  patcoVolume: savedPatcoVolume ? parseInt(savedPatcoVolume) : 50,
  setPatcoVolume: (val) => {
      localStorage.setItem('vessel_patco_volume', val.toString());
      set({ patcoVolume: val });
  },
  patcoAlert: null,
  setPatcoAlert: (msg) => set({ patcoAlert: msg }),
  connectionStatus: 'GOOD',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  
  hqName: savedHqName || 'One Infinite Loop, Cupertino',
  setHqName: (name) => {
      localStorage.setItem('vessel_hq_name', name);
      set({ hqName: name });
  },

  safeHarborOpen: false,
  setSafeHarborOpen: (open) => set({ safeHarborOpen: open }),
  
  isBottleCeremonyOpen: false,
  setBottleCeremonyOpen: (open) => set({ isBottleCeremonyOpen: open }),

  isDepartureManifestOpen: false,
  setDepartureManifestOpen: (open) => set({ isDepartureManifestOpen: open }),

  lastVoyageStats: null,
  setLastVoyageStats: (stats) => set({ lastVoyageStats: stats }),

  bilgeLevel: 0,
  setBilgeLevel: (level) => set({ bilgeLevel: level }),

  isOvertime: false,
  setOvertime: (val) => set({ isOvertime: val }),

  isSubmerged: false,
  toggleSubmersion: (active) => {
    set({ isSubmerged: active });
  },
  isDragDetected: false,
  setDragDetected: (val) => set({ isDragDetected: val }),
  
  isDrifting: false,
  setDrifting: (val) => set({ isDrifting: val }),

  activeTaskId: null,
  setActiveTask: (id) => set({ activeTaskId: id }),

  userRole: savedRole || defaultRole,
  setUserRole: (role) => {
    localStorage.setItem('vessel_role', role);
    set({ userRole: role });
  },
  
  hasOnboarded: true, 
  setHasOnboarded: (val) => set({ hasOnboarded: val }),
  captainStatus: 'AT_OARS',
  awayStartTime: null,
  setCaptainStatus: (status) => {
      set(state => {
          const now = Date.now();
          let newAwayTime = state.awayStartTime;
          
          if ((status === 'SHORE_LEAVE' || status === 'GALLEY') && state.captainStatus === 'AT_OARS') {
              newAwayTime = now;
          }
          if (status === 'AT_OARS') {
              newAwayTime = null;
          }

          const shouldBeQuiet = status === 'SHORE_LEAVE' || status === 'GALLEY';
          
          return { 
              captainStatus: status,
              quietMode: shouldBeQuiet,
              awayStartTime: newAwayTime
          };
      });
  },

  notificationSettings: savedNotifications ? JSON.parse(savedNotifications) : { enabled: false, frequency: 'IMMEDIATE', parrotVoice: 'CHIRP' },
  updateNotificationSettings: (settings) => set((state) => {
    const newSettings = { ...state.notificationSettings, ...settings };
    localStorage.setItem('vessel_notifications', JSON.stringify(newSettings));
    return { notificationSettings: newSettings };
  }),

  mapStyle: savedMapStyle || 'PAPER',
  setMapStyle: (style) => {
    localStorage.setItem('vessel_map_style', style);
    set({ mapStyle: style });
  },

  compassMode: savedCompassMode || 'URGENCY',
  setCompassMode: (mode) => {
    localStorage.setItem('vessel_compass_mode', mode);
    set({ compassMode: mode });
  },

  unitSystem: savedUnitSystem || 'IMPERIAL',
  setUnitSystem: (system) => {
    localStorage.setItem('vessel_unit_system', system);
    set({ unitSystem: system });
  },

  hourlyRate: savedHourlyRate ? parseInt(savedHourlyRate) : 50,
  setHourlyRate: (rate) => {
    localStorage.setItem('vessel_hourly_rate', rate.toString());
    set({ hourlyRate: rate });
  },

  shiftDuration: savedShiftDuration ? parseInt(savedShiftDuration) : 10,
  setShiftDuration: (hours) => {
    localStorage.setItem('vessel_shift_duration', hours.toString());
    set({ shiftDuration: hours });
  },

  shoreLeaveDuration: savedShoreLeaveDuration ? parseInt(savedShoreLeaveDuration) : 60,
  setShoreLeaveDuration: (minutes) => {
      localStorage.setItem('vessel_shore_leave_duration', minutes.toString());
      set({ shoreLeaveDuration: minutes });
  },

  crewManifest: INITIAL_CREW,
  updateCrewStatus: (id, status) => set(state => ({
      crewManifest: state.crewManifest.map(c => c.id === id ? { ...c, status } : c)
  })),
  fireFlare: (id, type) => set(state => ({
      crewManifest: state.crewManifest.map(c => c.id === id ? { ...c, activeFlare: type } : c)
  })),
  resolveFlare: (id) => set(state => ({
      crewManifest: state.crewManifest.map(c => c.id === id ? { ...c, activeFlare: undefined } : c)
  })),
  throwLifebuoy: (id) => set(state => ({
      crewManifest: state.crewManifest.map(c => c.id === id ? { ...c, status: 'AT_OARS', lastHeartbeat: Date.now() } : c)
  })),
  
  recentSafetyChecks: [],
  performSafetyCheck: async (crewId) => {
      const now = Date.now();
      const type = 'SAFETY_CHECK';
      const details = crewId 
          ? `Specific safety inspection of crew member.` 
          : 'General bridge oversight of crew manifest.';
          
      await db.auditLogs.add({
          type,
          timestamp: now,
          details,
          crewId
      });
      
      set(state => {
          const oneHourAgo = now - (60 * 60 * 1000);
          const recent = [...state.recentSafetyChecks, now].filter(t => t > oneHourAgo);
          if (recent.length > 3) {
              return { 
                  recentSafetyChecks: recent,
                  patcoAlert: "The crew is seasoned, Captain. Let them find their rhythm."
              };
          }
          return { recentSafetyChecks: recent };
      });
  },

  flareSensitivity: savedFlareSens ? parseInt(savedFlareSens) : 70,
  setFlareSensitivity: (val) => {
      localStorage.setItem('vessel_flare_sensitivity', val.toString());
      set({ flareSensitivity: val });
  },
  radarVolume: savedRadarVol ? parseInt(savedRadarVol) : 50,
  setRadarVolume: (val) => {
      localStorage.setItem('vessel_radar_volume', val.toString());
      set({ radarVolume: val });
  },
  knotSpeedSensitivity: savedKnotSens ? parseInt(savedKnotSens) : 50,
  setKnotSpeedSensitivity: (val) => {
      localStorage.setItem('vessel_knot_sensitivity', val.toString());
      set({ knotSpeedSensitivity: val });
  },
  paperTextureIntensity: savedPaperInt ? parseInt(savedPaperInt) : 20,
  setPaperTextureIntensity: (val) => {
      localStorage.setItem('vessel_paper_intensity', val.toString());
      set({ paperTextureIntensity: val });
  },
  crewPermissions: savedCrewPerms ? JSON.parse(savedCrewPerms) : { canFireFlare: true, canViewVault: false },
  updateCrewPermissions: (perms) => set(state => {
      const newPerms = { ...state.crewPermissions, ...perms };
      localStorage.setItem('vessel_crew_permissions', JSON.stringify(newPerms));
      return { crewPermissions: newPerms };
  }),

  locationEnabled: savedLocationEnabled === 'true',
  setLocationEnabled: (val) => {
      localStorage.setItem('vessel_location_enabled', String(val));
      set({ locationEnabled: val });
  },
  currentLocation: null,
  setCurrentLocation: (coords) => set({ currentLocation: coords }),
  weatherCondition: 'CLEAR',
  setWeatherCondition: (cond) => set({ weatherCondition: cond }),
  weatherData: null,
  fetchWeather: async () => {
      const { currentLocation, setWeatherCondition, checkSunset } = get();
      if (!currentLocation) return;

      try {
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&current_weather=true&windspeed_unit=kn`);
          const data = await response.json();
          const { weathercode, temperature, windspeed, winddirection } = data.current_weather;
          
          let condition: WeatherCondition = 'CLEAR';
          if (weathercode >= 95) condition = 'STORM';
          else if (weathercode >= 51) condition = 'RAIN';
          else if (weathercode >= 45) condition = 'FOG';
          else if (weathercode >= 71) condition = 'SNOW';
          else condition = 'CLEAR';

          setWeatherCondition(condition);
          set({
              weatherData: {
                  temperature,
                  windSpeed: windspeed,
                  windDirection: winddirection
              }
          });
          checkSunset();
      } catch (error) {
          console.error("Weather radar malfunction:", error);
      }
  },
  isNightWatch: false,
  checkSunset: () => {
      const now = new Date();
      const hour = now.getHours();
      let isNight = hour >= 18 || hour < 6;
      set({ isNightWatch: isNight });
  },
  
  sextantError: null,
  signalStatus: 'OFFLINE',
  calibrateSextant: async () => {
      const { setLocationEnabled, setCurrentLocation, fetchWeather, setPatcoAlert } = get();
      set({ sextantError: null, signalStatus: 'SEARCHING' });

      if (!navigator.geolocation) {
          set({ sextantError: "Sensors not detected on this vessel.", signalStatus: 'OFFLINE' });
          return;
      }

      navigator.geolocation.getCurrentPosition(
          (pos) => {
              setLocationEnabled(true);
              setCurrentLocation({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude
              });
              fetchWeather();
              set({ sextantError: null, signalStatus: 'LOCKED' });
          },
          (err) => {
              let msg = "Signal Lost.";
              let patcoMsg = "Sensors failing, Captain.";
              
              if (err.code === 1) { 
                  msg = "Permission Blocked";
                  patcoMsg = "Sextant locked by Captain. Engaging Fallback Protocol.";
              } else if (err.code === 2) { 
                  msg = "Position Unavailable";
                  patcoMsg = "Satellites are out of range. Fallback engaged.";
              } else if (err.code === 3) { 
                  msg = "Connection Timeout";
                  patcoMsg = "The signal timed out. Fallback engaged.";
              }
              
              console.warn("Sextant Error:", err);
              
              setCurrentLocation(DEFAULT_HOME_PORT);
              fetchWeather();
              
              set({ 
                  sextantError: msg, 
                  signalStatus: 'FALLBACK' 
              });
              setLocationEnabled(true); 
              setPatcoAlert(patcoMsg);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
  },

  sosActive: false,
  setSosActive: (active) => set({ sosActive: active }),
  sosLatchEnabled: savedSosLatch !== 'false',
  setSosLatchEnabled: (val) => {
      localStorage.setItem('vessel_sos_latch', String(val));
      set({ sosLatchEnabled: val });
  },

  waterCount: initialWater,
  drinkWater: () => set(state => {
      if (state.waterCount >= 8) {
          state.setPatcoAlert("The barrel is full, Captain! Focus on the voyage for now.");
          return {}; 
      }

      const newVal = state.waterCount + 1;
      localStorage.setItem('vessel_water_count', newVal.toString());
      localStorage.setItem('vessel_water_date', new Date().toLocaleDateString());
      
      if (newVal === 8) {
          state.unlockAchievement('Hydro-Homie', 'Drank 8 glasses of water in one watch.', 'Droplets', 'BRONZE');
          state.setPatcoAlert("Hydration tanks full, Captain! Excellent work.");
      } else {
          state.setPatcoAlert("Hydration logged. Keep the fluids moving.");
      }

      return { waterCount: newVal };
  }),
  isShoreLeave: false,
  setShoreLeave: (val) => set({ isShoreLeave: val }),
  isConfirmingBreak: false,
  setConfirmingBreak: (val) => set({ isConfirmingBreak: val }),
  unlockAchievement: async (title, desc, icon, tier) => {
      const existing = await db.achievements.where('title').equals(title).first();
      if (!existing) {
          await db.achievements.add({
              title,
              description: desc,
              icon,
              tier,
              unlockedAt: Date.now()
          });
          NotificationManager.send("Commendation Awarded", `You earned the '${title}' medal!`);
      }
  },

  morningBrief: initialBrief,
  setMorningBrief: (text) => {
      localStorage.setItem('vessel_morning_brief', text);
      localStorage.setItem('vessel_brief_date', new Date().toLocaleDateString());
      set({ morningBrief: text });
  },
  supplyLink: savedSupplyLink,
  setSupplyLink: (url) => {
      if(url) localStorage.setItem('vessel_supply_link', url);
      else localStorage.removeItem('vessel_supply_link');
      set({ supplyLink: url });
  }
}));
