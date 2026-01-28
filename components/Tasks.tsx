
import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, AlertCircle, Circle, CheckCircle2, Battery, BatteryCharging, Gauge, BoxSelect, Link as LinkIcon, ShieldAlert, Anchor, Map, X, FolderPlus, Mic, MicOff, CheckSquare as TaskIcon } from 'lucide-react';
import { db } from '../db';
import { Task, TaskPriority, EffortLevel, Project } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { FlareGun } from './FlareGun';

export const Tasks: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray());
  const projects = useLiveQuery(() => db.projects.toArray());
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [effort, setEffort] = useState<EffortLevel>(EffortLevel.MEDIUM);
  const [showPresets, setShowPresets] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const activeTaskId = useAppStore(state => state.activeTaskId);
  const setActiveTask = useAppStore(state => state.setActiveTask);
  const activeProjectId = useAppStore(state => state.activeProjectId);
  const setActiveProject = useAppStore(state => state.setActiveProject);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setNewTaskTitle(prev => prev + (prev ? ' ' : '') + transcript);
              setIsRecording(false);
          };
          recognitionRef.current.onerror = () => setIsRecording(false);
          recognitionRef.current.onend = () => setIsRecording(false);
      }
  }, []);

  const toggleVoice = () => {
      if (!recognitionRef.current) { alert("Voice logging not supported."); return; }
      if (isRecording) recognitionRef.current.stop();
      else { setIsRecording(true); recognitionRef.current.start(); }
  };

  const URGENT_LIMIT = 3;
  const currentUrgentCount = tasks?.filter(t => t.priority === TaskPriority.URGENT && !t.isCompleted).length || 0;
  const displayTasks = activeProjectId ? tasks?.filter(t => t.projectId === activeProjectId) : tasks;
  const currentProject = projects?.find(p => p.id === activeProjectId);

  const handleToggleUrgency = () => {
    if (!isUrgent && currentUrgentCount >= URGENT_LIMIT) {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 3000);
        return;
    }
    setIsUrgent(!isUrgent);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const finalPriority = (isUrgent && currentUrgentCount < URGENT_LIMIT) ? TaskPriority.URGENT : TaskPriority.REGULAR;
    await db.tasks.add({
      title: newTaskTitle, isCompleted: false, priority: finalPriority, effort: effort,
      createdAt: Date.now(), dueDate: new Date().toISOString().split('T')[0], projectId: activeProjectId || undefined
    });
    setNewTaskTitle(''); setIsUrgent(false); setEffort(EffortLevel.MEDIUM);
  };

  const createProject = async () => {
      if (!newProjectName.trim()) return;
      const id = await db.projects.add({ name: newProjectName, description: '', createdAt: Date.now(), theme: 'TROPICAL' });
      setActiveProject(id as number); setNewProjectName(''); setIsCreatingProject(false); setShowProjectSelector(false);
  }

  const applyPreset = async (presetName: string) => {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    let newTasks: Partial<Task>[] = [];
    if (presetName === 'Morning Routine') newTasks = [{ title: 'Review Calendar', priority: TaskPriority.REGULAR, effort: EffortLevel.LOW }, { title: 'Check Emails', priority: TaskPriority.REGULAR, effort: EffortLevel.LOW }, { title: 'Plan Top 3 Priorities', priority: TaskPriority.REGULAR, effort: EffortLevel.MEDIUM }];
    else if (presetName === 'Project Kickoff') newTasks = [{ title: 'Define Scope', priority: TaskPriority.REGULAR, effort: EffortLevel.HIGH }, { title: 'Create Folder Structure', priority: TaskPriority.REGULAR, effort: EffortLevel.MEDIUM }, { title: 'Email Stakeholders', priority: TaskPriority.REGULAR, effort: EffortLevel.LOW }];
    for (const t of newTasks) {
      await db.tasks.add({ title: t.title!, isCompleted: false, priority: t.priority!, effort: t.effort!, createdAt: now, dueDate: today, projectId: activeProjectId || undefined });
    }
    setShowPresets(false);
  };

  const toggleTask = async (task: Task) => {
    if (task.id) {
      const newStatus = !task.isCompleted;
      await db.tasks.update(task.id, { isCompleted: newStatus });
      if (newStatus && activeTaskId === task.id) setActiveTask(null);
    }
  };

  const toggleLine = (task: Task) => { setActiveTask(activeTaskId === task.id ? null : (task.id || null)); };
  const deleteTask = async (id: number) => { if (activeTaskId === id) setActiveTask(null); await db.tasks.delete(id); };

  const getEffortIcon = (level: EffortLevel) => {
    switch(level) {
      case EffortLevel.LOW: return <Battery className="w-4 h-4 text-emerald-500" />;
      case EffortLevel.MEDIUM: return <BatteryCharging className="w-4 h-4 text-blue-500" />;
      case EffortLevel.HIGH: return <Gauge className="w-4 h-4 text-orange-500" />;
    }
  };

  if (!tasks) return <div className="p-8 text-slate-500">Loading Triage...</div>;

  const urgentTasks = displayTasks?.filter(t => t.priority === TaskPriority.URGENT && !t.isCompleted) || [];
  const regularTasks = displayTasks?.filter(t => t.priority === TaskPriority.REGULAR && !t.isCompleted) || [];
  const completedTasks = displayTasks?.filter(t => t.isCompleted) || [];

  return (
    <div className="bridge-container-standard">
      <header className="bridge-header-standard">
        <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                <TaskIcon className="w-6 h-6 text-slate-600" />
                The Deck
                {activeProjectId && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1"><Map className="w-3 h-3" />{currentProject?.name}</span>}
            </h2>
            <div className="flex items-center gap-4 mt-1">
                <p className="text-slate-500 font-serif italic text-sm">Action Items & Triage Deck</p>
                <button onClick={() => setShowProjectSelector(!showProjectSelector)} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-wider"><Map className="w-3 h-3" />{activeProjectId ? 'Switch Island' : 'Select Island'}</button>
            </div>
        </div>
        <FlareGun />
      </header>

      <div className="bridge-body-standard overflow-y-auto custom-scrollbar">
            <AnimatePresence>
                {showProjectSelector && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0 }} className="mb-6 bg-white border border-slate-200 rounded-xl p-4 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between mb-4"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archipelago Map</h3><button onClick={() => setShowProjectSelector(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button onClick={() => { setActiveProject(null); setShowProjectSelector(false); }} className={`p-3 rounded-lg border text-left transition-all ${activeProjectId === null ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}><span className="block font-bold text-sm">Open Sea</span></button>
                            {projects?.map(p => (<button key={p.id} onClick={() => { setActiveProject(p.id!); setShowProjectSelector(false); }} className={`p-3 rounded-lg border text-left transition-all ${activeProjectId === p.id ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}><span className="block font-bold text-sm truncate">{p.name}</span></button>))}
                            {isCreatingProject ? (<div className="p-2 rounded-lg border border-blue-300 bg-white flex flex-col gap-2"><input autoFocus className="text-sm border-b border-slate-200 outline-none" placeholder="Island Name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createProject()} /><div className="flex justify-end gap-2"><button onClick={() => setIsCreatingProject(false)} className="text-xs text-slate-400">Cancel</button><button onClick={createProject} className="text-xs font-bold text-blue-600">Map</button></div></div>) : (<button onClick={() => setIsCreatingProject(true)} className="p-3 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-blue-500 flex flex-col items-center justify-center gap-1"><FolderPlus className="w-5 h-5" /><span className="text-xs font-bold">New Island</span></button>)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={addTask} className="mb-8 bg-white border border-slate-200 shadow-sm p-2 rounded-xl flex items-center gap-2 relative z-20">
                <button type="button" onClick={() => setShowPresets(!showPresets)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"><BoxSelect className="w-5 h-5" /></button>
                <AnimatePresence>{showPresets && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0 }} className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"><button type="button" onClick={() => applyPreset('Morning Routine')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Morning Routine</button><button type="button" onClick={() => applyPreset('Project Kickoff')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Project Kickoff</button></motion.div>)}</AnimatePresence>
                <button type="button" onClick={handleToggleUrgency} className={`p-2 rounded-lg transition-colors ${isUrgent ? 'bg-red-50 text-red-500 ring-1 ring-red-100' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}><AlertCircle className="w-5 h-5" /></button>
                <AnimatePresence>{showLimitWarning && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0 }} className="absolute top-full left-0 mt-2 w-64 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg shadow-xl z-50 flex items-start gap-2"><ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" /><div><span className="font-bold text-red-700 block mb-1">Capacity Reached</span>Downgrade another task before adding more.</div></motion.div>)}</AnimatePresence>
                <div className="flex bg-slate-100 rounded-lg p-1">{[EffortLevel.LOW, EffortLevel.MEDIUM, EffortLevel.HIGH].map((lvl) => (<button key={lvl} type="button" onClick={() => setEffort(lvl)} className={`p-1.5 rounded-md transition-all ${effort === lvl ? 'bg-white shadow-sm' : 'text-slate-400'}`}>{getEffortIcon(lvl)}</button>))}</div>
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder={activeProjectId ? `Add task to ${currentProject?.name}...` : "New Task..."} className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 text-lg" />
                <button type="button" onClick={toggleVoice} className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600'}`}>{isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg shadow-lg shadow-blue-200"><Plus className="w-5 h-5" /></button>
            </form>

            <div className="space-y-8 pb-10">
                {urgentTasks.length > 0 && (
                <section>
                    <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-red-100 pb-1">
                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Critical Signals</span>
                    <span className="bg-red-50 px-2 py-0.5 rounded-full">{currentUrgentCount} / {URGENT_LIMIT}</span>
                    </h3>
                    <div className="space-y-3">{urgentTasks.map(task => (<TaskItem key={task.id} task={task} isActive={activeTaskId === task.id} onToggle={() => toggleTask(task)} onLineToggle={() => toggleLine(task)} onDelete={() => deleteTask(task.id!)} isGlowing={true} />))}</div>
                </section>
                )}
                <section>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">{activeProjectId ? `${currentProject?.name} Tasks` : 'General Roster'}</h3>
                    <div className="space-y-2">
                        {regularTasks.length === 0 && urgentTasks.length === 0 && (<div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed"><p className="text-slate-400 text-sm font-serif italic">{activeProjectId ? 'Island mapped. No tasks visible.' : 'All caught up. Enjoy the water.'}</p></div>)}
                        {regularTasks.map(task => (<TaskItem key={task.id} task={task} isActive={activeTaskId === task.id} onToggle={() => toggleTask(task)} onLineToggle={() => toggleLine(task)} onDelete={() => deleteTask(task.id!)} />))}
                    </div>
                </section>
                {completedTasks.length > 0 && (
                <section className="opacity-60">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Archive</h3>
                    <div className="space-y-2">{completedTasks.map(task => (<TaskItem key={task.id} task={task} isActive={false} onToggle={() => toggleTask(task)} onLineToggle={() => {}} onDelete={() => deleteTask(task.id!)} />))}</div>
                </section>
                )}
            </div>
      </div>
    </div>
  );
};

interface TaskItemProps { task: Task; isActive: boolean; onToggle: () => void; onLineToggle: () => void; onDelete: () => void; isGlowing?: boolean; }
const TaskItem: React.FC<TaskItemProps> = ({ task, isActive, onToggle, onLineToggle, onDelete, isGlowing }) => (
  <div className={`group flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all relative overflow-hidden ${isGlowing ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-blue-300'} ${isActive ? 'ring-2 ring-blue-400' : ''}`}>
    {isActive && <div className="absolute inset-0 bg-blue-50/50 pointer-events-none z-0"></div>}
    <div className="flex items-center gap-3 flex-1 z-10">
      <button onClick={onToggle} className="text-slate-400 hover:text-blue-500">{task.isCompleted ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5" />}</button>
      <div className="flex flex-col">
        <span className={`transition-colors duration-300 ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>{task.title}</span>
        <div className="flex items-center gap-2 mt-0.5">
           {task.priority === TaskPriority.URGENT && !task.isCompleted && <span className="text-[9px] bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">URGENT</span>}
           {task.filePath && <span className="text-[9px] flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200"><LinkIcon className="w-3 h-3 mr-1" />Anchored</span>}
           <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight bg-slate-50 border border-slate-100 px-1.5 rounded">{task.effort}</span>
        </div>
      </div>
    </div>
    <div className="flex gap-2 z-10">
      {!task.isCompleted && <button onClick={onLineToggle} className={`p-1.5 rounded transition-colors ${isActive ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-600'}`}><Anchor className="w-4 h-4" /></button>}
      <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
    </div>
  </div>
);
