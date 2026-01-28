
import React, { useState } from 'react';
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
  Timer,
  RefreshCcw,
  Droplets,
  X
} from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store';
import { NotificationManager } from '../utils/notifications';
import { UserRole, MapStyle, CompassMode, Contact } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

// --- MAIN WRAPPER COMPONENT ---
// This component remains mounted but is extremely lightweight.
// It acts as the airlock, only admitting the heavy "SettingsContent" when opened.
export const Settings: React.FC = () => {
  const isSettingsOpen = useAppStore(state => state.isSettingsOpen);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const sidebarState = useAppStore(state => state.sidebarState);

  // Anchoring Calculation: Strictly flush to rail
  const getLeftOffset = () => {
      switch(sidebarState) {
          case 'full': return '260px'; 
          case 'mini': return '68px';
          case 'hidden': return '0px'; 
          default: return '260px';
      }
  };

  const handleClose = () => {
      setSettingsOpen(false);
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Dimmer (Removed for Transparent Hull Protocol) */}
          <motion.div 
              className="fixed inset-0 bg-transparent z-[998]"
              onClick={handleClose}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0 }}
          />
          
          {/* Anchored Settings Deck - Updated for Transparent Hull Protocol */}
          <motion.div 
              style={{ 
                  left: getLeftOffset(),
                  boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.1)' 
              }}
              className="fixed top-0 bottom-0 w-[320px] z-[999] bg-[#fdfbf7] shadow-2xl border-r border-y border-slate-200/50 rounded-r-2xl overflow-hidden flex flex-col pointer-events-auto"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0 }}
          >
              <SettingsContent onClose={handleClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- HEAVY CONTENT COMPONENT ---
// This only mounts when the user actually opens settings.
// All useLiveQuery and heavy store subscriptions happen here.
const SettingsContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activePath, setActivePath] = useState<string[]>([]);
  
  // Data Fetching (Only runs when open now)
  const snapshots = useLiveQuery(() => db.snapshots.orderBy('timestamp').reverse().toArray());
  const contacts = useLiveQuery(() => db.contacts.toArray());
  
  // Store Hooks
  const userRole = useAppStore(state => state.userRole);
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
  const bilgePumpEnabled = useAppStore(state => state.bilgePumpEnabled);
  const setBilgePumpEnabled = useAppStore(state => state.setBilgePumpEnabled);
  const setBilgeLevel = useAppStore(state => state.setBilgeLevel);
  const layoutMode = useAppStore(state => state.layoutMode);
  const setLayoutMode = useAppStore(state => state.setLayoutMode);
  const wakeLockEnabled = useAppStore(state => state.wakeLockEnabled);
  const setWakeLockEnabled = useAppStore(state => state.setWakeLockEnabled);

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
  
  // Location
  const locationEnabled = useAppStore(state => state.locationEnabled);
  const setLocationEnabled = useAppStore(state => state.setLocationEnabled);

  // SOS
  const sosLatchEnabled = useAppStore(state => state.sosLatchEnabled);
  const setSosLatchEnabled = useAppStore(state => state.setSosLatchEnabled);

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

  const performEmergencyPump = () => {
      setBilgeLevel(0);
      NotificationManager.send("Bilge Clear", "Emergency pump cycle complete. Water cleared.");
  }

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
           
           {/* Deck Controls removed per "Lightweight Hull" Directive */}

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
            <SettingItem icon={Wrench} label="Experimental Features" onClick={() => navigate('experimental')} />
            
            {/* Visuals removed - Theme Locked to Classic Paper */}

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">System Instruments</h3>
            <SettingItem icon={Bell} label="Bridge Alerts" value={notificationSettings.enabled ? 'On' : 'Off'} onClick={() => navigate('notifications')} />
            <SettingItem icon={ShieldAlert} label="S.O.S. Signal" onClick={() => navigate('emergency')} />
            <SettingItem icon={Book} label="The Ship's Library" onClick={() => navigate('manifesto')} />
            <SettingItem icon={History} label="The Logbook (Versions)" onClick={() => navigate('snapshots')} />
            <SettingItem icon={Activity} label="System Diagnostics" onClick={() => navigate('diagnostics')} />
            
            {/* Navigator's Watch */}
            <ToggleSettingItem 
                icon={Eye} 
                label="Prevent Screen Sleep" 
                description="Maintains full brightness for long voyages"
                active={wakeLockEnabled}
                onToggle={setWakeLockEnabled}
            />
           </div>
        </div>
      );
    }

    // --- SUB-MENUS ---

    if (currentLevel === 'experimental') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Experimental Features" />
                <div className="px-4 space-y-4">
                    <PaperCard title="Beta Mechanics">
                        <GraphiteToggle 
                            label="Interactive Bilge Pump"
                            checked={bilgePumpEnabled}
                            onChange={setBilgePumpEnabled}
                            description="Enables the visual water rising mechanic based on overdue tasks."
                        />
                        
                        {bilgePumpEnabled && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={performEmergencyPump}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 font-bold text-xs uppercase tracking-wider"
                                >
                                    <RefreshCcw className="w-4 h-4" /> Emergency Pump (Clear Water)
                                </button>
                            </div>
                        )}
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
                                <div key={contact.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
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
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full border ${contact.isEmergency ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
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
                                <div className="ml-2 pl-4 border-l-2 border-slate-200">
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
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${unitSystem === 'IMPERIAL' ? 'bg-white shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span className="uppercase tracking-widest">USA</span>
                                    <span className="font-mono text-[10px] opacity-70">Ft / °F / Miles</span>
                                </button>
                                <button 
                                    onClick={() => setUnitSystem('METRIC')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${unitSystem === 'METRIC' ? 'bg-white shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
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
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Compass className="w-3 h-3" /> Hull Configuration
                            </label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setLayoutMode('FULL_HULL')}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all flex flex-col items-center gap-1 ${layoutMode === 'FULL_HULL' ? 'bg-white border-white/50 shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span>Full Hull</span>
                                    <span className="font-normal opacity-70 text-[9px]">(Centered)</span>
                                </button>
                                <button 
                                    onClick={() => setLayoutMode('EXPANSIVE')}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all flex flex-col items-center gap-1 ${layoutMode === 'EXPANSIVE' ? 'bg-white border-white/50 shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span>Expansive Sea</span>
                                    <span className="font-normal opacity-70 text-[9px]">(Edge-to-Edge)</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 italic mt-1">
                                "Full Hull" snaps instruments to the console (Recommended). "Expansive Sea" pushes rails to the horizon.
                            </p>
                        </div>

                        <div className="mt-6 space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Compass Mode</label>
                            <div className="flex gap-2">
                                {['URGENCY', 'IMPORTANCE', 'CHRONOLOGY'].map(mode => (
                                    <button 
                                        key={mode}
                                        onClick={() => setCompassMode(mode as CompassMode)}
                                        className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all ${compassMode === mode ? 'bg-white border-white/50 shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
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
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all ${mapStyle === 'PAPER' ? 'bg-white border-white/50 shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Classic Paper
                                </button>
                                <button 
                                    onClick={() => setMapStyle('HOLOGRAPHIC')}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all ${mapStyle === 'HOLOGRAPHIC' ? 'bg-white border-white/50 shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
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
                    <div className="px-4 space-y-4">
                        <PaperCard title="Signal Strength">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateNotificationSettings({ frequency: 'IMMEDIATE' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${notificationSettings.frequency === 'IMMEDIATE' ? 'bg-white shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    Immediate
                                </button>
                                <button 
                                    onClick={() => updateNotificationSettings({ frequency: 'DIGEST' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${notificationSettings.frequency === 'DIGEST' ? 'bg-white shadow-md text-slate-900' : 'bg-transparent border-slate-400 text-slate-600 hover:bg-slate-50'}`}
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
    <>
      {/* Brass Close Latch - Always visible inside content */}
      <div className="absolute top-4 right-4 z-50">
          <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-amber-900/30 bg-gradient-to-br from-[#fcd34d] via-[#b45309] to-[#78350f] hover:brightness-110 active:scale-95 group"
              title="Close Settings Deck"
          >
              <X className="w-5 h-5 text-slate-900 group-hover:text-black" />
              {/* Shine Effect */}
              <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full blur-[1px]"></div>
          </button>
      </div>

      <header className="px-8 py-6 border-b border-slate-200/50 bg-white/40 shrink-0 mt-2">
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Settings Deck</h2>
          <p className="text-slate-500 text-sm font-sans">Configure your tackle box.</p>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {renderContent()}
      </div>
    </>
  );
};

// --- Sub-Components ---

const Header: React.FC<{ onBack: () => void, title: string }> = ({ onBack, title }) => (
  <div className="flex items-center mb-4 text-slate-800 font-semibold cursor-pointer hover:text-blue-600 sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-20 py-4 border-b border-slate-100 px-8" onClick={onBack}>
    <span className="mr-2 text-slate-400">&larr;</span> {title}
  </div>
);

const SettingItem: React.FC<{ icon: any, label: string, value?: string, onClick?: () => void }> = ({ icon: Icon, label, value, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 bg-white/60 rounded-lg border border-transparent mx-2 my-1 ${onClick ? 'cursor-pointer hover:bg-white hover:border-slate-200 hover:shadow-sm' : 'opacity-75'}`}
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

const ToggleSettingItem: React.FC<{ icon: any, label: string, description?: string, active: boolean, onToggle: (val: boolean) => void }> = ({ icon: Icon, label, description, active, onToggle }) => (
  <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-transparent mx-2 my-1 hover:bg-white hover:border-slate-200 hover:shadow-sm cursor-pointer" onClick={() => onToggle(!active)}>
    <div className="flex items-center text-slate-700 gap-3">
        <div className={`p-1.5 rounded-md ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <div className="font-medium text-sm text-slate-800">{label}</div>
            {description && <div className="text-[10px] text-slate-400">{description}</div>}
        </div>
    </div>
    {/* Toggle Switch */}
    <div 
        className={`relative w-10 h-5 rounded-full border ${active ? 'bg-emerald-500 border-emerald-600' : 'bg-stone-300 border-stone-400'}`}
    >
        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  </div>
);

const TactileToggle: React.FC<{ label: string, description: string, active: boolean, onToggle: () => void, icon: any }> = ({ label, description, active, onToggle, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-white/80 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 cursor-pointer group" onClick={onToggle}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
        
        <div className={`relative w-14 h-7 rounded-full border ${active ? 'bg-emerald-500 border-emerald-600' : 'bg-stone-300 border-stone-400'}`}>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform ${active ? 'translate-x-7' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

const GraphiteToggle: React.FC<{ label: string, description?: string, checked: boolean, onChange: (val: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-start justify-between group cursor-pointer" onClick={() => onChange(!checked)}>
       <div>
           <div className="font-bold text-slate-700 text-sm mb-1">{label}</div>
           {description && <div className="text-xs text-slate-500 leading-tight max-w-[200px]">{description}</div>}
       </div>
       <div className={`relative w-12 h-6 rounded-full border ${checked ? 'bg-emerald-500 border-emerald-600' : 'bg-stone-300 border-stone-400'}`}>
           <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
       </div>
    </div>
);

const GraphiteSlider: React.FC<{ label: string, value: number, onChange: (val: number) => void, min: number, max: number, icon: any }> = ({ label, value, onChange, min, max, icon: Icon }) => (
    <div className="bg-white/80 p-4 rounded-lg border border-stone-200 shadow-sm">
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
    <div className="bg-white/90 border border-slate-200 rounded-lg p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-stone-200 to-transparent opacity-50"></div>
        <h4 className="font-serif font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider border-b border-stone-200 pb-2">{title}</h4>
        {children}
    </div>
);

const LifelineCard: React.FC<{ icon: any, title: string, desc: string, action: string, type: 'email' | 'call', alert?: boolean }> = ({ icon: Icon, title, desc, action, type, alert }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border group ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200 hover:border-stone-300'}`}
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
            className={`p-2 rounded-lg ${alert ? 'hover:bg-red-100 text-red-500' : 'hover:bg-stone-100 text-slate-400 hover:text-blue-600'}`}
            title={type === 'email' ? 'Send Email' : 'Call'}
        >
            {type === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
        </button>
    </div>
);
