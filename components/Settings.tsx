
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
  HelpCircle, 
  Heart, 
  Book, 
  Activity, 
  HardDrive, 
  Layers, 
  Fish,
  Anchor,
  Download,
  Upload,
  History,
  RotateCcw,
  Sun,
  Moon,
  PanelLeft,
  Bell,
  Radio,
  User,
  Check,
  Compass,
  Map as MapIcon,
  DollarSign,
  Clock,
  Zap,
  Sliders,
  PenTool,
  Lock,
  Headphones,
  Eye,
  Speaker,
  Building2,
  MessageSquare,
  Briefcase,
  LifeBuoy,
  Wrench,
  Phone,
  Mail,
  Users,
  Navigation,
  Globe,
  AlertOctagon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Contrast,
  CloudRain,
  ShieldAlert,
  MousePointer,
  Search,
  Timer
} from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store';
import { NotificationManager } from '../utils/notifications';
import { UserRole, MapStyle, CompassMode, Contact } from '../types';

export const Settings: React.FC = () => {
  const [activePath, setActivePath] = useState<string[]>([]);
  const snapshots = useLiveQuery(() => db.snapshots.orderBy('timestamp').reverse().toArray());
  const [morningCastEnabled, setMorningCastEnabled] = useState(false);
  const contacts = useLiveQuery(() => db.contacts.toArray());
  
  // Store Hooks
  const quietMode = useAppStore(state => state.quietMode);
  const toggleQuietMode = useAppStore(state => state.toggleQuietMode);
  const sidebarState = useAppStore(state => state.sidebarState);
  const toggleSidebar = useAppStore(state => state.toggleSidebar);
  
  const userRole = useAppStore(state => state.userRole);
  const setUserRole = useAppStore(state => state.setUserRole);
  const notificationSettings = useAppStore(state => state.notificationSettings);
  const updateNotificationSettings = useAppStore(state => state.updateNotificationSettings);

  const mapStyle = useAppStore(state => state.mapStyle);
  const setMapStyle = useAppStore(state => state.setMapStyle);
  const compassMode = useAppStore(state => state.compassMode);
  const setCompassMode = useAppStore(state => state.setCompassMode);
  const unitSystem = useAppStore(state => state.unitSystem);
  const setUnitSystem = useAppStore(state => state.setUnitSystem);

  const hourlyRate = useAppStore(state => state.hourlyRate);
  const setHourlyRate = useAppStore(state => state.setHourlyRate);
  const shiftDuration = useAppStore(state => state.shiftDuration);
  const setShiftDuration = useAppStore(state => state.setShiftDuration);
  const shoreLeaveDuration = useAppStore(state => state.shoreLeaveDuration);
  const setShoreLeaveDuration = useAppStore(state => state.setShoreLeaveDuration);
  
  const hqName = useAppStore(state => state.hqName);
  const setHqName = useAppStore(state => state.setHqName);

  // New Engine Room Hooks
  const flareSensitivity = useAppStore(state => state.flareSensitivity);
  const setFlareSensitivity = useAppStore(state => state.setFlareSensitivity);
  const radarVolume = useAppStore(state => state.radarVolume);
  const setRadarVolume = useAppStore(state => state.setRadarVolume);
  const knotSpeedSensitivity = useAppStore(state => state.knotSpeedSensitivity);
  const setKnotSpeedSensitivity = useAppStore(state => state.setKnotSpeedSensitivity);
  const paperTextureIntensity = useAppStore(state => state.paperTextureIntensity);
  const setPaperTextureIntensity = useAppStore(state => state.setPaperTextureIntensity);
  const crewPermissions = useAppStore(state => state.crewPermissions);
  const updateCrewPermissions = useAppStore(state => state.updateCrewPermissions);
  const localSearchEnabled = useAppStore(state => state.localSearchEnabled);
  const setLocalSearchEnabled = useAppStore(state => state.setLocalSearchEnabled);

  // P.A.T.C.O. Hooks
  const patcoAudioEnabled = useAppStore(state => state.patcoAudioEnabled);
  const setPatcoAudioEnabled = useAppStore(state => state.setPatcoAudioEnabled);
  const patcoVisualsEnabled = useAppStore(state => state.patcoVisualsEnabled);
  const setPatcoVisualsEnabled = useAppStore(state => state.setPatcoVisualsEnabled);
  const patcoVolume = useAppStore(state => state.patcoVolume);
  const setPatcoVolume = useAppStore(state => state.setPatcoVolume);

  // Immersion Hooks
  const soundEnabled = useAppStore(state => state.soundEnabled);
  const toggleSound = useAppStore(state => state.toggleSound);
  const cabinMode = useAppStore(state => state.cabinMode);
  const toggleCabinMode = useAppStore(state => state.toggleCabinMode);
  
  // Theme & Accessibility
  const themeMode = useAppStore(state => state.themeMode);
  const setThemeMode = useAppStore(state => state.setThemeMode);
  const highContrastMode = useAppStore(state => state.highContrastMode);
  const setHighContrastMode = useAppStore(state => state.setHighContrastMode);
  
  // Location
  const locationEnabled = useAppStore(state => state.locationEnabled);
  const setLocationEnabled = useAppStore(state => state.setLocationEnabled);

  // SOS
  const sosLatchEnabled = useAppStore(state => state.sosLatchEnabled);
  const setSosLatchEnabled = useAppStore(state => state.setSosLatchEnabled);

  useEffect(() => {
    const pref = localStorage.getItem('tackle_morning_cast');
    setMorningCastEnabled(pref === 'true');
  }, []);

  const toggleMorningCast = () => {
    const newValue = !morningCastEnabled;
    setMorningCastEnabled(newValue);
    localStorage.setItem('tackle_morning_cast', String(newValue));
  };

  const toggleNotifications = async () => {
    if (!notificationSettings.enabled) {
      const granted = await NotificationManager.requestPermission();
      if (granted) {
        updateNotificationSettings({ enabled: true });
        NotificationManager.send("Signal Flare Active", "The ship can now reach you.");
      }
    } else {
      updateNotificationSettings({ enabled: false });
    }
  };

  const navigate = (path: string) => {
    setActivePath([...activePath, path]);
  };

  const goBack = () => {
    setActivePath(activePath.slice(0, -1));
  };

  const getRoleLabel = (role: string | null) => {
      switch(role) {
          case 'PLANNER': return 'Navigator';
          case 'STUDENT': return 'Scholar';
          case 'SALES': return 'Merchant';
          default: return 'General';
      }
  }

  const toggleEmergencyContact = async (contact: Contact) => {
      if (contact.id) {
          await db.contacts.update(contact.id, { isEmergency: !contact.isEmergency });
      }
  }

  const renderContent = () => {
    const currentLevel = activePath[activePath.length - 1];

    if (!currentLevel) {
      // Root Settings
      return (
        <div className="space-y-4 pb-10">
           {/* Console Controls */}
           <div className="grid grid-cols-1 gap-4 p-4 bg-slate-100/50 rounded-xl border border-slate-200">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deck Controls</h3>
             
             <TactileToggle 
               label="Morning Cast" 
               description="Guided launch sequence"
               active={morningCastEnabled} 
               onToggle={toggleMorningCast}
               icon={Sun}
             />
             
             <TactileToggle 
               label="No-Wake Zone" 
               description="Silence signals & dim lights"
               active={quietMode} 
               onToggle={toggleQuietMode}
               icon={Moon}
             />
             
             <TactileToggle 
               label="Clear Deck" 
               description="Hide Sidebar"
               active={sidebarState === 'hidden'} 
               onToggle={toggleSidebar}
               icon={PanelLeft}
             />
           </div>

           <div className="space-y-1 ship-systems-list">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">The Engine Room</h3>
            <SettingItem icon={User} label="Vessel Class" value={getRoleLabel(userRole)} onClick={() => navigate('role')} />
            <SettingItem icon={Clock} label="Watch Schedule" value={`${shiftDuration}h`} onClick={() => navigate('roster')} />
            <SettingItem icon={DollarSign} label="Financials" value={`$${hourlyRate}/hr`} onClick={() => navigate('financials')} />
            <SettingItem icon={MessageSquare} label="Comm-Link (P.A.T.C.O.)" onClick={() => navigate('comm-link')} />
            <SettingItem icon={Headphones} label="Soundscape Deck" onClick={() => navigate('soundscape')} />
            <SettingItem icon={Lock} label="Crew Permissions" onClick={() => navigate('permissions')} />
            <SettingItem icon={Sliders} label="Navigation Calibration" onClick={() => navigate('calibration')} />
            <SettingItem icon={PenTool} label="Vessel Customization" onClick={() => navigate('customization')} />
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">Below Deck</h3>
            <SettingItem icon={Contrast} label="Visual Accessibility" onClick={() => navigate('visuals')} />
            <SettingItem icon={ShieldAlert} label="Emergency Reef" onClick={() => navigate('emergency')} />

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">Ship's Systems</h3>
            <SettingItem icon={Bell} label="Signal Beacons" value={notificationSettings.enabled ? 'On' : 'Off'} onClick={() => navigate('notifications')} />
            <SettingItem icon={Book} label="The Ship's Library" onClick={() => navigate('manifesto')} />
            <SettingItem icon={History} label="The Logbook (Versions)" onClick={() => navigate('snapshots')} />
            <SettingItem icon={Activity} label="System Diagnostics" onClick={() => navigate('diagnostics')} />
           </div>
        </div>
      );
    }

    // --- SUB-MENUS ---

    if (currentLevel === 'visuals') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Visual Accessibility" />
                <div className="px-4 space-y-4">
                    <PaperCard title="Vision Modes">
                        <div className="space-y-4">
                            <TactileToggle 
                                label="Midnight Watch" 
                                description="Invert to Dark Mode for night voyages."
                                active={themeMode === 'MIDNIGHT'} 
                                onToggle={() => setThemeMode(themeMode === 'PAPER' ? 'MIDNIGHT' : 'PAPER')}
                                icon={MoonIcon}
                            />
                            <TactileToggle 
                                label="Storm Vision" 
                                description="High contrast lines and bolder text."
                                active={highContrastMode} 
                                onToggle={() => setHighContrastMode(!highContrastMode)}
                                icon={Eye}
                            />
                        </div>
                    </PaperCard>
                </div>
            </div>
        )
    }

    if (currentLevel === 'emergency') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Emergency Reef" />
                <div className="px-4 space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <h4 className="text-red-800 font-bold text-sm mb-2 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> SOS Override Protocol
                        </h4>
                        <p className="text-xs text-red-700 leading-relaxed">
                            Selected contacts can bypass "Silent Waters" (DND) modes like Shore Leave. Use this for critical family or fleet command members only.
                        </p>
                    </div>

                    <PaperCard title="Safety Protocols">
                        <TactileToggle 
                            label="Safety Latch" 
                            description="Require 3-second hold to fire SOS beacon."
                            active={sosLatchEnabled} 
                            onToggle={() => setSosLatchEnabled(!sosLatchEnabled)}
                            icon={MousePointer}
                        />
                    </PaperCard>

                    <PaperCard title="Contact Whitelist">
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {contacts?.map(contact => (
                                <div key={contact.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${contact.isEmergency ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-700">{contact.name}</div>
                                            <div className="text-[10px] text-slate-400">{contact.role}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => toggleEmergencyContact(contact)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${contact.isEmergency ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                                    >
                                        {contact.isEmergency ? 'SOS ACTIVE' : 'ADD'}
                                    </button>
                                </div>
                            ))}
                            {(!contacts || contacts.length === 0) && (
                                <p className="text-xs text-slate-400 italic text-center py-4">No contacts found in The Reef.</p>
                            )}
                        </div>
                    </PaperCard>
                </div>
            </div>
        )
    }

    if (currentLevel === 'comm-link') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Comm-Link" />
                <div className="px-4 space-y-4">
                    <PaperCard title="P.A.T.C.O. Configuration">
                        <div className="space-y-4">
                            <GraphiteToggle 
                                label="Assistant Voice"
                                checked={patcoAudioEnabled}
                                onChange={setPatcoAudioEnabled}
                                description="Enable audible squawks and alerts."
                            />
                            
                            {patcoAudioEnabled && (
                                <div className="ml-2 pl-4 border-l-2 border-slate-200 animate-in slide-in-from-left-2">
                                    <GraphiteSlider 
                                        label="Voice Calibration"
                                        value={patcoVolume}
                                        onChange={setPatcoVolume}
                                        min={0} max={100}
                                        icon={Speaker}
                                    />
                                </div>
                            )}

                            <GraphiteToggle 
                                label="P.A.T.C.O. Commentary"
                                checked={patcoVisualsEnabled}
                                onChange={setPatcoVisualsEnabled}
                                description="Enable random status updates & observations."
                            />
                        </div>
                    </PaperCard>
                    <PaperCard title="The Sextant">
                        <div className="space-y-4">
                            <GraphiteToggle 
                                label="Location Services"
                                checked={locationEnabled}
                                onChange={setLocationEnabled}
                                description="Enable GPS for local weather reports and accurate ETA to HQ."
                            />
                        </div>
                    </PaperCard>
                </div>
            </div>
        )
    }

    if (currentLevel === 'soundscape') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Soundscape Deck" />
                <div className="px-4 space-y-4">
                    <PaperCard title="Audio Atmosphere">
                        <div className="space-y-4">
                            <TactileToggle 
                                label="Ocean Engine" 
                                description="Ambient white noise (waves) when underway"
                                active={soundEnabled} 
                                onToggle={toggleSound}
                                icon={Speaker}
                            />
                            
                            <TactileToggle 
                                label="Cabin Mode" 
                                description="Deep focus: Dim lights & heavy rain sound"
                                active={cabinMode} 
                                onToggle={toggleCabinMode}
                                icon={CloudRain}
                            />
                        </div>
                    </PaperCard>
                    <div className="text-xs text-slate-400 px-2 italic">
                        Note: Sounds only activate when "Full Ahead" is engaged in the Log.
                    </div>
                </div>
            </div>
        )
    }

    if (currentLevel === 'roster') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Watch Schedule" />
                <div className="px-4 space-y-4">
                    <PaperCard title="Daily Watch Duration">
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                value={shiftDuration}
                                onChange={(e) => setShiftDuration(parseInt(e.target.value) || 0)}
                                className="w-24 bg-transparent border-b-2 border-slate-300 px-3 py-2 text-slate-800 font-mono font-bold text-xl focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-slate-600 font-medium font-serif italic">Hours</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Defines the "Full Ahead" operational capacity. The ETA on the bridge will count down based on this limit.
                        </p>
                    </PaperCard>

                    <PaperCard title="Shore Leave Duration">
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                value={shoreLeaveDuration}
                                onChange={(e) => setShoreLeaveDuration(parseInt(e.target.value) || 0)}
                                className="w-24 bg-transparent border-b-2 border-slate-300 px-3 py-2 text-slate-800 font-mono font-bold text-xl focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-slate-600 font-medium font-serif italic">Minutes</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Standard break duration. The public arrival timer will default to this.
                        </p>
                    </PaperCard>
                </div>
            </div>
        )
    }

    if (currentLevel === 'financials') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Financials" />
                <div className="px-4 space-y-4">
                    <PaperCard title="Captain's Rate">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-slate-400">$</span>
                            <input 
                                type="number" 
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                                className="w-full bg-transparent border-b-2 border-slate-300 px-3 py-2 text-slate-800 font-mono font-bold text-xl focus:border-emerald-500 focus:outline-none"
                            />
                            <span className="text-slate-400 font-bold">/HR</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Used to calculate "Voyage Value" in the Logbook. Keep this updated for accurate manifests.
                        </p>
                    </PaperCard>
                </div>
            </div>
        )
    }

    if (currentLevel === 'permissions') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Crew Permissions" />
                <div className="px-4 space-y-4">
                    <div className="bg-[#fdfbf7] border border-stone-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-400" /> Access Control
                        </h4>
                        
                        <div className="space-y-4">
                            <GraphiteToggle 
                                label="Flare Gun Access"
                                checked={crewPermissions.canFireFlare}
                                onChange={(checked) => updateCrewPermissions({ canFireFlare: checked })}
                                description="Allow crew to signal distress (Red/White/Green flares)."
                            />
                            <GraphiteToggle 
                                label="Vault Entry"
                                checked={crewPermissions.canViewVault}
                                onChange={(checked) => updateCrewPermissions({ canViewVault: checked })}
                                description="Allow crew to view the Captain's private notes."
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (currentLevel === 'calibration') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Calibration" />
                <div className="px-4 space-y-6">
                    
                    <PaperCard title="Navigation Standards">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setUnitSystem('IMPERIAL')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${unitSystem === 'IMPERIAL' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    <span className="uppercase tracking-widest">USA</span>
                                    <span className="font-mono text-[10px] opacity-70">Ft / °F / Miles</span>
                                </button>
                                <button 
                                    onClick={() => setUnitSystem('METRIC')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${unitSystem === 'METRIC' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    <span className="uppercase tracking-widest">Metric</span>
                                    <span className="font-mono text-[10px] opacity-70">M / °C / Km</span>
                                </button>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100">
                                <GraphiteToggle 
                                    label="Manual Search Overrides"
                                    checked={localSearchEnabled}
                                    onChange={setLocalSearchEnabled}
                                    description="Enable old-school search inputs in The Reef and other decks. Default is OFF (use Sonar for all searching)."
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 italic">
                            Affects Met. Station, Distance Logs, and Search behavior.
                        </p>
                    </PaperCard>

                    <GraphiteSlider 
                        label="Knot Meter Sensitivity"
                        value={knotSpeedSensitivity}
                        onChange={setKnotSpeedSensitivity}
                        min={0} max={100}
                        icon={Activity}
                    />

                    <GraphiteSlider 
                        label="Radar Ping Volume"
                        value={radarVolume}
                        onChange={setRadarVolume}
                        min={0} max={100}
                        icon={Radio}
                    />

                    <GraphiteSlider 
                        label="Flare Trigger Threshold"
                        value={flareSensitivity}
                        onChange={setFlareSensitivity}
                        min={0} max={100}
                        icon={Zap}
                    />
                </div>
            </div>
        )
    }

    if (currentLevel === 'customization') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Vessel Customization" />
                <div className="px-4 space-y-6">
                    <PaperCard title="Fleet Headquarters">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                value={hqName}
                                onChange={(e) => setHqName(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-slate-300 px-3 py-2 text-slate-800 font-medium focus:border-blue-500 focus:outline-none placeholder:text-slate-300"
                                placeholder="e.g. Acme Corp HQ"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mb-6">
                            The destination for your daily commute. The ship travels here during your shift.
                        </p>

                        {/* Fleet Lifelines */}
                        <div className="border-t border-slate-200 pt-4">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Fleet Lifelines
                            </h5>
                            <div className="space-y-3">
                                <LifelineCard 
                                    icon={Briefcase}
                                    title="HR Department"
                                    desc="Payroll, Leave, & Disputes"
                                    action="hr@fleet.com"
                                    type="email"
                                />
                                <LifelineCard 
                                    icon={LifeBuoy}
                                    title="Claims & Safety"
                                    desc="Accidents & Vessel Damage"
                                    action="claims@fleet.com"
                                    type="email"
                                    alert
                                />
                                <LifelineCard 
                                    icon={Wrench}
                                    title="Tech Support"
                                    desc="System Diagnostics"
                                    action="555-0199"
                                    type="call"
                                />
                            </div>
                        </div>
                    </PaperCard>

                    <PaperCard title="Aesthetics">
                        <GraphiteSlider 
                            label="Paper Texture Intensity"
                            value={paperTextureIntensity}
                            onChange={setPaperTextureIntensity}
                            min={0} max={100}
                            icon={Layers}
                        />
                        <div className="mt-6 space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Compass Mode</label>
                            <div className="flex gap-2">
                                {['URGENCY', 'IMPORTANCE', 'CHRONOLOGY'].map(mode => (
                                    <button 
                                        key={mode}
                                        onClick={() => setCompassMode(mode as CompassMode)}
                                        className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all ${compassMode === mode ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Chart Style</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setMapStyle('PAPER')}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all ${mapStyle === 'PAPER' ? 'bg-[#fdfbf7] text-stone-800 border-stone-400 shadow-inner ring-1 ring-stone-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    Classic Paper
                                </button>
                                <button 
                                    onClick={() => setMapStyle('HOLOGRAPHIC')}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all ${mapStyle === 'HOLOGRAPHIC' ? 'bg-slate-900 text-cyan-400 border-cyan-900 shadow-inner' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    Holographic
                                </button>
                            </div>
                        </div>
                    </PaperCard>
                </div>
            </div>
        )
    }

    if (currentLevel === 'role') {
        return (
            <div className="space-y-4">
                <Header onBack={goBack} title="Vessel Class" />
                <p className="text-sm text-slate-500 px-4">Your class determines the layout of the ship and your flag.</p>
                
                <div className="space-y-2 px-2">
                    <RoleCard 
                        role="PLANNER" 
                        label="The Navigator" 
                        desc="Prioritizes Bridge & Deck. Heavy project management focus." 
                        currentRole={userRole} 
                        onSelect={setUserRole} 
                    />
                    <RoleCard 
                        role="STUDENT" 
                        label="The Scholar" 
                        desc="Prioritizes Vault & Calendar. Research and study focus." 
                        currentRole={userRole} 
                        onSelect={setUserRole} 
                    />
                    <RoleCard 
                        role="SALES" 
                        label="The Merchant" 
                        desc="Prioritizes Reef & Inbox. Fast communication focus." 
                        currentRole={userRole} 
                        onSelect={setUserRole} 
                    />
                </div>
            </div>
        )
    }

    if (currentLevel === 'notifications') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Signal Beacons" />
                
                <div className="px-4">
                    <TactileToggle 
                        label="External Flares" 
                        description="Push alerts to this device"
                        active={notificationSettings.enabled} 
                        onToggle={toggleNotifications}
                        icon={Radio}
                    />
                </div>

                {notificationSettings.enabled && (
                    <div className="px-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <PaperCard title="Signal Strength">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateNotificationSettings({ frequency: 'IMMEDIATE' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${notificationSettings.frequency === 'IMMEDIATE' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500'}`}
                                >
                                    Immediate
                                </button>
                                <button 
                                    onClick={() => updateNotificationSettings({ frequency: 'DIGEST' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${notificationSettings.frequency === 'DIGEST' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500'}`}
                                >
                                    Daily Digest
                                </button>
                            </div>
                        </PaperCard>
                    </div>
                )}
            </div>
        )
    }
    
    // Default fallback
    return <div onClick={goBack} className="p-4 text-slate-500 hover:text-slate-800 cursor-pointer">Click to go back</div>;
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
      <header className="mb-8 flex-shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500">Configure your tackle box.</p>
      </header>
      
      {/* SCROLL FIX APPLIED: h-full with internal scrolling container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative ship-systems-container pointer-events-auto">
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {renderContent()}
         </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const Header: React.FC<{ onBack: () => void, title: string }> = ({ onBack, title }) => (
  <div className="flex items-center mb-4 text-slate-800 font-semibold cursor-pointer hover:text-blue-600 sticky top-0 bg-white/95 backdrop-blur-sm z-20 py-3 border-b border-slate-100 px-4" onClick={onBack}>
    <span className="mr-2 text-slate-400">&larr;</span> {title}
  </div>
);

const SettingItem: React.FC<{ icon: any, label: string, value?: string, onClick?: () => void }> = ({ icon: Icon, label, value, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-transparent mx-2 my-1 ${onClick ? 'cursor-pointer hover:bg-white hover:border-slate-200 hover:shadow-sm' : 'opacity-75'} transition-all`}
  >
    <div className="flex items-center text-slate-700">
      <Icon className="w-5 h-5 mr-3 text-slate-500" />
      {label}
    </div>
    <div className="flex items-center gap-2">
        {value && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{value}</span>}
        {onClick && <ChevronRight className="w-4 h-4 text-slate-400" />}
    </div>
  </div>
);

const TactileToggle: React.FC<{ label: string, description: string, active: boolean, onToggle: () => void, icon: any }> = ({ label, description, active, onToggle, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
        
        <div className={`tactile-switch ${active ? 'active' : ''}`}>
            <div className="tactile-switch-handle">
                <div className="tactile-lines">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    </div>
);

const GraphiteToggle: React.FC<{ label: string, description?: string, checked: boolean, onChange: (val: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-start justify-between group cursor-pointer" onClick={() => onChange(!checked)}>
       <div>
           <div className="font-bold text-slate-700 text-sm mb-1">{label}</div>
           {description && <div className="text-xs text-slate-500 leading-tight max-w-[200px]">{description}</div>}
       </div>
       <div className="relative w-12 h-6 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center transition-colors group-hover:border-slate-400">
           {checked && <div className="absolute inset-0 bg-slate-800 rounded-full opacity-10"></div>}
           <div className={`w-4 h-4 rounded-full bg-slate-600 shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-6 bg-slate-800' : 'translate-x-1 bg-slate-400'}`}></div>
       </div>
    </div>
);

const GraphiteSlider: React.FC<{ label: string, value: number, onChange: (val: number) => void, min: number, max: number, icon: any }> = ({ label, value, onChange, min, max, icon: Icon }) => (
    <div className="bg-white p-4 rounded-lg border border-[#E0E0E0] shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Icon className="w-4 h-4 text-slate-400" />
                {label}
            </div>
            <span className="font-mono text-xs font-bold text-slate-500">{value}%</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
        />
    </div>
);

const PaperCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white border border-[#E0E0E0] rounded-lg p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-stone-200 to-transparent opacity-50"></div>
        <h4 className="font-serif font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider border-b border-stone-200 pb-2">{title}</h4>
        {children}
    </div>
);

const RoleCard: React.FC<{ role: UserRole, label: string, desc: string, currentRole: UserRole | null, onSelect: (r: UserRole) => void }> = ({ role, label, desc, currentRole, onSelect }) => (
    <div 
        onClick={() => onSelect(role)}
        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${currentRole === role ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
    >
        <div>
            <h4 className="font-bold text-slate-700">{label}</h4>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
        {currentRole === role && <div className="bg-blue-500 text-white p-1 rounded-full"><Check className="w-4 h-4" /></div>}
    </div>
);

const LifelineCard: React.FC<{ icon: any, title: string, desc: string, action: string, type: 'email' | 'call', alert?: boolean }> = ({ icon: Icon, title, desc, action, type, alert }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200 hover:border-stone-300'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${alert ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <h4 className={`text-sm font-bold ${alert ? 'text-red-900' : 'text-slate-700'}`}>{title}</h4>
                <p className={`text-[10px] ${alert ? 'text-red-700' : 'text-slate-500'}`}>{desc}</p>
            </div>
        </div>
        <button 
            onClick={() => window.open(type === 'email' ? `mailto:${action}` : `tel:${action}`)}
            className={`p-2 rounded-lg transition-colors ${alert ? 'hover:bg-red-100 text-red-500' : 'hover:bg-stone-100 text-slate-400 hover:text-blue-600'}`}
            title={type === 'email' ? 'Send Email' : 'Call'}
        >
            {type === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
        </button>
    </div>
);
