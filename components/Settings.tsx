
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
  X,
  FileText
} from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store';
import { NotificationManager } from '../utils/notifications';
import { UserRole, MapStyle, CompassMode, Contact, ViewState } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const isSettingsOpen = useAppStore(state => state.isSettingsOpen);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const sidebarState = useAppStore(state => state.sidebarState);

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
          <motion.div 
              className="fixed inset-0 bg-transparent z-[998]"
              onClick={handleClose}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
          />
          
          <motion.div 
              style={{ 
                  left: getLeftOffset(),
                  boxShadow: '5px 0 15px rgba(0, 0, 0, 0.1)' 
              }}
              className="fixed top-0 bottom-0 w-[320px] z-[999] bg-[#fdfbf7] border-r border-y border-slate-200/50 rounded-r-2xl overflow-hidden flex flex-col pointer-events-auto"
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

const SettingsContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activePath, setActivePath] = useState<string[]>([]);
  const requestNavigation = useAppStore(state => state.requestNavigation);
  
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
  const layoutMode = useAppStore(state => state.layoutMode);
  const setLayoutMode = useAppStore(state => state.setLayoutMode);
  const wakeLockEnabled = useAppStore(state => state.wakeLockEnabled);
  const setWakeLockEnabled = useAppStore(state => state.setWakeLockEnabled);

  const patcoAudioEnabled = useAppStore(state => state.patcoAudioEnabled);
  const setPatcoAudioEnabled = useAppStore(state => state.setPatcoAudioEnabled);
  const patcoVisualsEnabled = useAppStore(state => state.patcoVisualsEnabled);
  const setPatcoVisualsEnabled = useAppStore(state => state.setPatcoVisualsEnabled);
  const patcoVolume = useAppStore(state => state.patcoVolume);
  const setPatcoVolume = useAppStore(state => state.setPatcoVolume);

  const soundEnabled = useAppStore(state => state.soundEnabled);
  const toggleSound = useAppStore(state => state.toggleSound);
  const cabinMode = useAppStore(state => state.cabinMode);
  const toggleCabinMode = useAppStore(state => state.toggleCabinMode);
  const locationEnabled = useAppStore(state => state.locationEnabled);
  const setLocationEnabled = useAppStore(state => state.setLocationEnabled);
  const sosLatchEnabled = useAppStore(state => state.sosLatchEnabled);
  const setSosLatchEnabled = useAppStore(state => state.setSosLatchEnabled);

  const toggleNotifications = async () => {
    if (!notificationSettings.enabled) {
      const granted = await NotificationManager.requestPermission();
      if (granted) {
        updateNotificationSettings({ enabled: true });
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

  const handleOpenManifest = () => {
      requestNavigation(ViewState.SHIP_MANIFEST);
      onClose();
  };

  const renderContent = () => {
    const currentLevel = activePath[activePath.length - 1];

    if (!currentLevel) {
      return (
        <div className="space-y-4 pb-10">
           <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">The Engine Room</h3>
            <SettingItem icon={User} label="Vessel Class" value={userRole || 'GENERAL'} onClick={() => navigate('role')} />
            <SettingItem icon={FileText} label="Ship's Manifest" onClick={handleOpenManifest} />
            <SettingItem icon={Clock} label="Watch Schedule" value={`${shiftDuration}h`} onClick={() => navigate('roster')} />
            <SettingItem icon={DollarSign} label="Financials" value={`$${hourlyRate}/hr`} onClick={() => navigate('financials')} />
            <SettingItem icon={MessageSquare} label="Comm-Link (P.A.T.C.O.)" onClick={() => navigate('comm-link')} />
            <SettingItem icon={Headphones} label="Soundscape Deck" onClick={() => navigate('soundscape')} />
            <SettingItem icon={Sliders} label="Navigation Calibration" onClick={() => navigate('calibration')} />
            <SettingItem icon={Wrench} label="Experimental Features" onClick={() => navigate('experimental')} />
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">System Instruments</h3>
            <SettingItem icon={Bell} label="Bridge Alerts" value={notificationSettings.enabled ? 'On' : 'Off'} onClick={() => navigate('notifications')} />
            <SettingItem icon={ShieldAlert} label="S.O.S. Signal" onClick={() => navigate('emergency')} />
            
            <ToggleSettingItem 
                icon={Eye} 
                label="Prevent Screen Sleep" 
                active={wakeLockEnabled}
                onToggle={setWakeLockEnabled}
            />
           </div>
        </div>
      );
    }

    if (currentLevel === 'experimental') {
        return (
            <div className="space-y-6">
                <Header onBack={goBack} title="Experimental" />
                <div className="px-4 space-y-4">
                    <GraphiteToggle 
                        label="Interactive Bilge Pump"
                        checked={bilgePumpEnabled}
                        onChange={setBilgePumpEnabled}
                        description="Rising water based on overdue tasks."
                    />
                </div>
            </div>
        )
    }

    // Default back nav for other paths
    return <div onClick={goBack} className="p-4 text-slate-500 hover:text-slate-800 cursor-pointer">Click to go back</div>;
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-50">
          <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-amber-900/30 bg-gradient-to-br from-[#fcd34d] via-[#b45309] to-[#78350f] hover:brightness-110 group"
          >
              <X className="w-5 h-5 text-slate-900" />
              <div className="absolute top-1 left-2 w-3 h-2 bg-white/40 rounded-full blur-[1px]"></div>
          </button>
      </div>

      <header className="px-8 py-6 border-b border-slate-200 bg-white shrink-0 mt-2">
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Settings Deck</h2>
          <p className="text-slate-500 text-sm font-sans">Configure your tackle box.</p>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {renderContent()}
      </div>
    </>
  );
};

const Header: React.FC<{ onBack: () => void, title: string }> = ({ onBack, title }) => (
  <div className="flex items-center mb-4 text-slate-800 font-semibold cursor-pointer hover:text-blue-600 sticky top-0 bg-[#fdfbf7] z-20 py-4 border-b border-slate-100 px-8" onClick={onBack}>
    <span className="mr-2 text-slate-400">&larr;</span> {title}
  </div>
);

const SettingItem: React.FC<{ icon: any, label: string, value?: string, onClick?: () => void }> = ({ icon: Icon, label, value, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 bg-white rounded-lg border border-transparent mx-2 my-1 ${onClick ? 'cursor-pointer hover:border-slate-200' : 'opacity-75'}`}
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
  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-transparent mx-2 my-1 hover:border-slate-200 cursor-pointer" onClick={() => onToggle(!active)}>
    <div className="flex items-center text-slate-700 gap-3">
        <div className={`p-1.5 rounded-md ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <div className="font-medium text-sm text-slate-800">{label}</div>
            {description && <div className="text-[10px] text-slate-400">{description}</div>}
        </div>
    </div>
    <div className={`relative w-10 h-5 rounded-full border ${active ? 'bg-emerald-500 border-emerald-600' : 'bg-stone-300 border-stone-400'}`}>
        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transform transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
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
           <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
       </div>
    </div>
);
