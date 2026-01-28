
import Dexie, { Table } from 'dexie';
import { Task, Note, Asset, Folder, TaskPriority, EffortLevel, Session, Snapshot, ClipboardItem, Contact, Script, Feedback, Project, BottleMessage, AuditLog, Achievement, Resource } from './types';

class TackleBoxDB extends Dexie {
  tasks!: Table<Task, number>;
  notes!: Table<Note, number>;
  assets!: Table<Asset, number>;
  folders!: Table<Folder, number>;
  sessions!: Table<Session, number>;
  snapshots!: Table<Snapshot, number>;
  clipboard!: Table<ClipboardItem, number>;
  contacts!: Table<Contact, number>;
  scripts!: Table<Script, number>;
  feedback!: Table<Feedback, number>;
  projects!: Table<Project, number>;
  bottles!: Table<BottleMessage, number>;
  auditLogs!: Table<AuditLog, number>;
  achievements!: Table<Achievement, number>;
  resources!: Table<Resource, number>;

  constructor() {
    super('TackleBoxDB');
    
    // Schema definition
    (this as any).version(16).stores({
      tasks: '++id, title, isCompleted, priority, effort, dueDate, createdAt, projectId',
      notes: '++id, title, folder, updatedAt, isDeleted, depth, owner, isFresh, *tags',
      assets: '++id, name, type, createdAt, lastAccessed, extractedText, location, folderId, deletedAt, isFresh, *tags',
      folders: '++id, name, createdAt',
      sessions: '++id, startTime, endTime, signedAt',
      snapshots: '++id, timestamp',
      clipboard: '++id, type, timestamp',
      contacts: '++id, name, company, pressure, signalResponse',
      scripts: '++id, title, type, *tags',
      feedback: '++id, type, timestamp',
      projects: '++id, name, completedAt',
      bottles: '++id, timestamp, openedAt',
      auditLogs: '++id, type, timestamp, reasonCode',
      achievements: '++id, title, tier, unlockedAt',
      resources: '++id, title, category'
    });
  }
}

export const db = new TackleBoxDB();

// Initial seed data if empty
(db as any).on('populate', () => {
  db.tasks.bulkAdd([
    {
      title: 'Welcome to The Tackle Box',
      isCompleted: false,
      priority: TaskPriority.REGULAR,
      effort: EffortLevel.LOW,
      createdAt: Date.now(),
      dueDate: new Date().toISOString().split('T')[0]
    },
    {
      title: 'Check the Developer Journal',
      isCompleted: false,
      priority: TaskPriority.URGENT,
      effort: EffortLevel.HIGH,
      createdAt: Date.now()
    }
  ]);
  
  // Seed Folders (Reefs)
  db.folders.bulkAdd([
    { name: 'Semester 1', createdAt: Date.now() },
    { name: 'Client Assets', createdAt: Date.now() },
    { name: 'Invoices', createdAt: Date.now() }
  ]);
  
  // Seed Projects (Islands)
  db.projects.add({
      name: 'Ship Maintenance',
      description: 'Core system upgrades and repairs.',
      createdAt: Date.now(),
      theme: 'VOLCANIC'
  });
  
  // Captain's Logs (Pre-installed folders)
  db.notes.bulkAdd([
    {
      title: 'Project Manifesto',
      folder: 'Blueprints',
      content: '# The Tackle Box\n\nA local-first environment for focused work.\n\n## Principles\n1. Speed is a feature.\n2. Data belongs to the user.\n3. Simplicity wins.',
      updatedAt: Date.now(),
      depth: 'Abyssal',
      owner: 'Captain',
      tags: ['manifesto', 'core']
    },
    {
      title: 'IndexedDB Architecture',
      folder: 'Blueprints',
      content: 'Technical details on how the IndexedDB handles file storage...',
      updatedAt: Date.now(),
      depth: 'Abyssal',
      tags: ['tech', 'db']
    },
    {
      title: 'Bioluminescent Palette',
      folder: 'The Color Grade',
      content: 'Rules for the glowing UI elements...',
      updatedAt: Date.now(),
      depth: 'Surface',
      tags: ['design', 'ui']
    }
  ]);

  // Initial Clipboard Data
  db.clipboard.add({
    content: 'Welcome to The Net (Clipboard History)',
    type: 'text',
    timestamp: Date.now()
  });

  // Seed Contacts (The Reef)
  db.contacts.bulkAdd([
    {
      name: "Sarah Jenkins",
      role: "Lead Designer",
      company: "Oceanic Corp",
      phone: "555-0123",
      email: "sarah@oceanic.com",
      pressure: "High",
      history: [],
      createdAt: Date.now(),
      category: 'CLIENT',
      status: 'ACTIVE',
      reliability: 98
    },
    {
      name: "Marcus Thorne",
      role: "CTO",
      company: "DeepSea Data",
      phone: "555-0987",
      email: "m.thorne@deepsea.io",
      pressure: "Medium",
      history: [],
      createdAt: Date.now(),
      category: 'CLIENT',
      status: 'ASHORE',
      reliability: 72
    },
    {
      name: "Navigator John",
      role: "Logistics",
      company: "The Tackle Box",
      phone: "555-0001",
      email: "john@tackle.local",
      pressure: "Low",
      history: [],
      createdAt: Date.now(),
      category: 'CREW',
      status: 'ACTIVE',
      reliability: 88
    },
    {
      name: "Admiral Vance",
      role: "Fleet Commander",
      company: "Tackle HQ",
      phone: "555-9999",
      email: "vance@fleet.command",
      pressure: "High",
      history: [],
      createdAt: Date.now(),
      category: 'HQ',
      status: 'ACTIVE',
      pendingItems: "1. Monthly Report\n2. Supply Requisition",
      reliability: 100
    },
    {
      name: "Cadet Miller",
      role: "Junior Dev",
      company: "The Tackle Box",
      phone: "555-0042",
      email: "miller@tackle.local",
      pressure: "Low",
      history: [],
      createdAt: Date.now(),
      category: 'CREW',
      status: 'ONBOARDING',
      pendingItems: "1. Access Badge\n2. Git Config",
      reliability: 60
    }
  ]);

  // Seed Scripts & Bait
  db.scripts.bulkAdd([
    {
      title: "Cold Call Intro",
      type: "script",
      content: "Hi [Name], this is [My Name] from The Tackle Box. I noticed your team is expanding and wanted to ask how you're handling cognitive load...",
      tags: ["sales", "intro"]
    },
    {
      title: "Follow-up SMS",
      type: "template",
      content: "Hey [Name], just checking in on our last conversation. Do you have 5 mins this week?",
      tags: ["follow-up", "sms"]
    },
    {
      title: "Meeting Reschedule",
      type: "template",
      content: "Apologies, something urgent came up in the deep water. Can we shift our call to [Time]?",
      tags: ["logistics"]
    }
  ]);
  
  // Seed Starter Medal
  db.achievements.add({
      title: 'Commissioned Officer',
      description: 'Logged into the system for the first time.',
      icon: 'Badge',
      unlockedAt: Date.now(),
      tier: 'BRONZE'
  });

  // Seed Resources
  db.resources.bulkAdd([
      { title: 'Fleet Command', url: 'https://github.com', category: 'DEV' },
      { title: 'Blueprints', url: 'https://figma.com', category: 'DESIGN' }
  ]);
});
