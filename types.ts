

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INBOX = 'INBOX',
  TASKS = 'TASKS',
  CALENDAR = 'CALENDAR',
  NOTES = 'NOTES',
  AQUARIUM = 'AQUARIUM',
  REEF = 'REEF',
  DEV_JOURNAL = 'DEV_JOURNAL',
  SETTINGS = 'SETTINGS',
  DRIFT_REPORT = 'DRIFT_REPORT'
}

export type UserRole = 'STUDENT' | 'SALES' | 'PLANNER' | 'GENERAL';

export enum TaskPriority {
  REGULAR = 'REGULAR',
  URGENT = 'URGENT'
}

export enum EffortLevel {
  LOW = 'LOW',     // "Easy Catch"
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'    // "Big Game"
}

export enum EnergyLevel {
  LOW = 'LOW',
  HIGH = 'HIGH'
}

export enum TidePhase {
  SUNRISE = 'SUNRISE', // Morning: Focus on Planning
  DEEP_WATER = 'DEEP_WATER', // Day: Focus on Execution
  SHORE = 'SHORE' // Evening: Reflection
}

export type SidebarState = 'full' | 'mini' | 'hidden';

export type LayoutMode = 'FULL_HULL' | 'EXPANSIVE';

export type CrewStatus = 'AT_OARS' | 'DRIFTING' | 'MAN_OVERBOARD' | 'SHORE_LEAVE' | 'GALLEY' | 'ASHORE';

export type FlareType = 'RED' | 'WHITE' | 'GREEN';

export type ThemeMode = 'PAPER' | 'MIDNIGHT';

export interface CrewMember {
  id: string;
  name: string;
  role: UserRole;
  status: CrewStatus;
  lastHeartbeat: number;
  activeFlare?: FlareType; // If they fired a signal
}

export interface NavItem {
  id: ViewState;
  label: string;
  icon: string;
  order: number;
}

export interface Project {
  id?: number;
  name: string;
  description?: string;
  createdAt: number;
  completedAt?: number;
  theme?: 'TROPICAL' | 'ARCTIC' | 'VOLCANIC'; 
}

export interface Resource {
  id?: number;
  title: string;
  url: string;
  icon?: string; // URL to favicon or lucide icon name
  category?: 'DEV' | 'DESIGN' | 'COMMS' | 'DOCS';
}

export interface Task {
  id?: number;
  title: string;
  isCompleted: boolean;
  priority: TaskPriority;
  effort: EffortLevel;
  dueDate?: string; // ISO Date string YYYY-MM-DD
  dueTime?: string; // HH:MM
  createdAt: number;
  filePath?: string; // The Anchor Point
  projectId?: number; // Linked Island
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  folder: string;
  updatedAt: number;
  isDeleted?: boolean;
  deletedAt?: number;
  // Tackle Organizer Metadata
  tags?: string[];
  depth?: 'Surface' | 'Shallow' | 'Abyssal'; // Priority
  owner?: string;
  isFresh?: boolean; // Fresh Catch from Net
}

export interface Folder {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Asset {
  id?: number;
  name: string;
  type: string;
  size: number;
  data: Blob;
  createdAt: number;
  lastAccessed?: number; // For Algae detection
  extractedText?: string; // For Sonar Scan (OCR)
  location?: 'live_well' | 'aquarium';
  folderId?: number; // Navigation logic
  deletedAt?: number; // The Depths logic
  tags?: string[];
  linkedId?: number; // Linked to a Task or Note ID
  species?: 'Scales' | 'Shells' | 'Plankton'; // Triage Category
  isFresh?: boolean; // Fresh Catch from Net
}

export interface ClipboardItem {
  id?: number;
  content: string;
  title?: string;
  favicon?: string;
  type: 'text' | 'link' | 'code';
  timestamp: number;
}

export interface LogEntry {
  id: string;
  source: 'Email' | 'SMS' | 'Phone';
  sender: string;
  preview: string;
  timestamp: string;
  type: 'tuna' | 'bycatch'; // Priority vs Spam
}

export interface Session {
  id?: number;
  startTime: number;
  endTime?: number;
  focusArea?: string;
  itemsCaught: number;
  efficiency?: number; // 0-100 score
  signedAt?: number; // Timestamp of signature
  startLocation?: GPSCoordinates;
  endLocation?: GPSCoordinates;
}

export interface BottleMessage {
  id?: number;
  content: string;
  timestamp: number;
  openedAt?: number; // When it washes up in the future
}

export interface Snapshot {
  id?: number;
  timestamp: number;
  description: string;
  config: string; // JSON string of settings/layout
}

export interface DailyCatchConfig {
  date: string; // YYYY-MM-DD
  priorities: string[]; // 3 items
  isComplete: boolean;
}

export interface InteractionLog {
  id: string;
  type: 'call' | 'sms' | 'email';
  timestamp: number;
  duration?: number; // seconds (for calls)
  notes: string;
}

export type SignalType = 'STATUS' | 'READY' | 'SYNC';
export type SignalResponse = 'AYE' | 'NAY' | 'PENDING';

export interface Contact {
  id?: number;
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  pressure: 'Low' | 'Medium' | 'High'; // Importance
  avatar?: string;
  history: InteractionLog[];
  createdAt: number;
  pendingItems?: string; // "What I Need" Log
  category?: 'CREW' | 'HQ' | 'CLIENT';
  status?: 'ACTIVE' | 'ASHORE' | 'ONBOARDING' | 'SHORE_LEAVE' | 'GALLEY';
  lastSignal?: SignalType;
  signalResponse?: SignalResponse;
  reliability?: number; // 0-100 score
  isEmergency?: boolean; // Part of SOS Deck
}

export interface Script {
  id?: number;
  title: string;
  content: string;
  type: 'script' | 'template'; // Teleprompter vs Copy/Paste
  tags?: string[];
}

export interface Feedback {
  id?: number;
  type: 'BUG' | 'FEATURE' | 'GENERAL';
  content: string;
  browserInfo: string;
  timestamp: number;
}

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'IMMEDIATE' | 'DIGEST';
  parrotVoice: 'CHIRP' | 'SQUAWK';
}

export type DepartureReason = 'MEDICAL' | 'TECHNICAL' | 'PERSONAL' | 'COMPLETED_EARLY' | 'EMERGENCY' | 'OTHER';

export interface AuditLog {
  id?: number;
  type: 'EARLY_EXIT' | 'OFFLINE' | 'DRIFT' | 'SECURITY' | 'SAFETY_CHECK' | 'SOS_BEACON';
  timestamp: number;
  details: string;
  reasonCode?: DepartureReason;
  duration?: number; // For offline/drift events
  crewId?: string; // For safety checks
}

export interface Achievement {
  id?: number;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlockedAt: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export type MapStyle = 'PAPER' | 'HOLOGRAPHIC';
export type CompassMode = 'URGENCY' | 'IMPORTANCE' | 'CHRONOLOGY';

export type WeatherCondition = 'CLEAR' | 'RAIN' | 'STORM' | 'FOG' | 'SNOW' | 'UNKNOWN';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number; // Stored as Knots
  windDirection: number;
}

// Command Order: Bridge, Trawl, Reef, Deck, Vault, Aquarium, Chart Room, Logbook, Settings
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: ViewState.DASHBOARD, label: 'The Bridge', icon: 'LayoutDashboard', order: 0 },
  { id: ViewState.INBOX, label: 'The Trawl', icon: 'Inbox', order: 1 },
  { id: ViewState.REEF, label: 'The Reef', icon: 'Users', order: 2 },
  { id: ViewState.TASKS, label: 'The Deck', icon: 'CheckSquare', order: 3 },
  { id: ViewState.NOTES, label: 'The Vault', icon: 'FileText', order: 4 },
  { id: ViewState.AQUARIUM, label: 'The Aquarium', icon: 'Waves', order: 5 },
  { id: ViewState.CALENDAR, label: 'Chart Room', icon: 'Calendar', order: 6 },
  { id: ViewState.DRIFT_REPORT, label: 'Logbook', icon: 'Activity', order: 7 },
  { id: ViewState.SETTINGS, label: 'Settings', icon: 'Settings', order: 8 },
];