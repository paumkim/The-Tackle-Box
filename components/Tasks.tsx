
import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, AlertCircle, Circle, CheckCircle2, Battery, BatteryCharging, Gauge, BoxSelect, Link as LinkIcon, ShieldAlert, Anchor, Map, X, FolderPlus, Mic, MicOff } from 'lucide-react';
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

  // Voice Recognition Setup
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
          
          recognitionRef.current.onerror = () => {
              setIsRecording(false);
          };
          
          recognitionRef.current.onend = () => {
              setIsRecording(false);
          };
      }
  }, []);

  const toggleVoice = () => {
      if (!recognitionRef.current) {
          alert("Voice logging not supported in this browser.");
          return;
      }
      
      if (isRecording) {
          recognitionRef.current.stop();
      } else {
          setIsRecording(true);
          recognitionRef.current.start();
      }
  };

  // Anti-Burnout Cap
  const URGENT_LIMIT = 3;
  const currentUrgentCount = tasks?.filter(t => t.priority === TaskPriority.URGENT && !t.isCompleted).length || 0;

  // Filter tasks by Active Project
  const displayTasks = activeProjectId 
    ? tasks?.filter(t => t.projectId === activeProjectId) 
    : tasks;

  const currentProject = projects?.find(p => p.id === activeProjectId);

  const handleToggleUrgency = () => {
    if (!isUrgent) {
      if (currentUrgentCount >= URGENT_LIMIT) {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 3000);
        return;
      }
    }
    setIsUrgent(!isUrgent);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const finalPriority = (isUrgent && currentUrgentCount < URGENT_LIMIT) ? TaskPriority.URGENT : TaskPriority.REGULAR;

    await db.tasks.add({
      title: newTaskTitle,
      isCompleted: false,
      priority: finalPriority,
      effort: effort,
      createdAt: Date.now(),
      dueDate: new Date().toISOString().split('T')[0],
      projectId: activeProjectId || undefined
    });
    setNewTaskTitle('');
    setIsUrgent(false);
    setEffort(EffortLevel.MEDIUM);
  };

  const createProject = async () => {
      if (!newProjectName.trim()) return;
      const id = await db.projects.add({
          name: newProjectName,
          description: '',
          createdAt: Date.now(),
          theme: 'TROPICAL'
      });
      setActiveProject(id as number);
      setNewProjectName('');
      setIsCreatingProject(false);
      setShowProjectSelector(false);
  }

  const applyPreset = async (presetName: string) => {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    let newTasks: Partial<Task>[] = [];

    if (presetName === 'Morning Routine') {
      newTasks = [
        { title: 'Review Calendar', priority: TaskPriority.REGULAR, effort: EffortLevel.LOW },
        { title: 'Check Emails', priority: TaskPriority.REGULAR, effort: EffortLevel.LOW },
        { title: 'Plan Top 3 Priorities', priority: TaskPriority.REGULAR, effort: EffortLevel.MEDIUM },
      ];
    } else if (presetName === 'Project Kickoff') {
       newTasks = [
        { title: 'Define Scope', priority: TaskPriority.REGULAR, effort: EffortLevel.HIGH },
        { title: 'Create Folder Structure', priority: TaskPriority.REGULAR, effort: EffortLevel.MEDIUM },
        { title: 'Email Stakeholders', priority: TaskPriority.REGULAR, effort: EffortLevel.LOW },
      ];
    }

    for (const t of newTasks) {
      await db.tasks.add({
        title: t.title!,
        isCompleted: false,
        priority: t.priority!,
        effort: t.effort!,
        createdAt: now,
        dueDate: today,
        projectId: activeProjectId || undefined
      });
    }
    setShowPresets(false);
  };

  const toggleTask = async (task: Task) => {
    if (task.id) {
      const newStatus = !task.isCompleted;
      await db.tasks.update(task.id, { isCompleted: newStatus });
      if (newStatus && activeTaskId === task.id) {
        setActiveTask(null);
      }
    }
  };

  const toggleLine = (task: Task) => {
    if (activeTaskId === task.id) {
      setActiveTask(null); 
    } else {
      setActiveTask(task.id || null);
    }
  };

  const deleteTask = async (id: number) => {
    if (activeTaskId === id) setActiveTask(null);
    await db.tasks.delete(id);
  };

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
    <div className="h-full flex flex-col relative bg-[#F8F9FA] w-full">
      <header className="px-6 py-4 border-b border-slate-200 bg-[#F8F9FA] flex justify-between items-end shrink-0 sticky top-0 z-30">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-serif font-bold text-slate-800">The Deck</h2>
                {activeProjectId && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                        <Map className="w-3 h-3" />
                        {currentProject?.name}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowProjectSelector(!showProjectSelector)}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                    <Map className="w-3 h-3" />
                    {activeProjectId ? 'Switch Island' : 'Select Island (Project)'}
                </button>
            </div>
        </div>
        
        {/* The SOS Flare Gun */}
        <FlareGun />
      </header>

      {/* Main Content Container - Unified Hull */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar w-full">
        
            {/* Project Selector Panel */}
            <AnimatePresence>
                {showProjectSelector && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 bg-white border border-slate-200 rounded-xl p-4 overflow-hidden shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Archipelago Map</h3>
                            <button onClick={() => setShowProjectSelector(false)}><X className="w-4 h-4 text-slate-400" /></button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Open Sea Option */}
                            <button 
                                onClick={() => { setActiveProject(null); setShowProjectSelector(false); }}
                                className={`p-3 rounded-lg border text-left transition-all ${activeProjectId === null ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-white'}`}
                            >
                                <span className="block font-bold text-sm">Open Sea</span>
                                <span className="text-xs opacity-70">All Tasks</span>
                            </button>

                            {/* Projects */}
                            {projects?.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => { setActiveProject(p.id!); setShowProjectSelector(false); }}
                                    className={`p-3 rounded-lg border text-left transition-all ${activeProjectId === p.id ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-white'}`}
                                >
                                    <span className="block font-bold text-sm truncate">{p.name}</span>
                                    <span className="text-xs opacity-70">Island</span>
                                </button>
                            ))}

                            {/* New Project */}
                            {isCreatingProject ? (
                                <div className="p-2 rounded-lg border border-blue-300 bg-white flex flex-col gap-2">
                                    <input 
                                        autoFocus
                                        className="text-sm border-b border-slate-200 outline-none pb-1" 
                                        placeholder="Island Name..."
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && createProject()}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsCreatingProject(false)} className="text-xs text-slate-400">Cancel</button>
                                        <button onClick={createProject} className="text-xs font-bold text-blue-600">Map It</button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsCreatingProject(true)}
                                    className="p-3 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-1"
                                >
                                    <FolderPlus className="w-5 h-5" />
                                    <span className="text-xs font-bold">Chart New Island</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <motion.form 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={addTask} 
                className="mb-8 bg-white border border-slate-200 shadow-sm p-2 rounded-xl flex items-center gap-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-100 relative z-20"
            >
                <div className="relative">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Bait Presets"
                >
                    <BoxSelect className="w-5 h-5" />
                </motion.button>
                
                <AnimatePresence>
                {showPresets && (
                    <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"
                    >
                    <div className="p-2 text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-100">BAIT PRESETS</div>
                    <button type="button" onClick={() => applyPreset('Morning Routine')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                        Morning Routine
                    </button>
                    <button type="button" onClick={() => applyPreset('Project Kickoff')} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                        Project Kickoff
                    </button>
                    </motion.div>
                )}
                </AnimatePresence>
                </div>

                <div className="relative">
                    <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleToggleUrgency}
                    className={`p-2 rounded-lg transition-colors ${isUrgent ? 'bg-red-50 text-red-500 shadow-sm ring-1 ring-red-100' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                    title={currentUrgentCount >= URGENT_LIMIT ? "Capacity Reached" : "Toggle Urgency"}
                    >
                    <AlertCircle className="w-5 h-5" />
                    </motion.button>
                    
                    <AnimatePresence>
                    {showLimitWarning && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg shadow-xl z-50 flex items-start gap-2"
                        >
                            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <div>
                                <span className="font-bold text-red-700 block mb-1">Capacity Reached</span>
                                The boat is heavy. Downgrade another urgent task before adding more.
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
                
                <div className="flex bg-slate-100 rounded-lg p-1">
                {[EffortLevel.LOW, EffortLevel.MEDIUM, EffortLevel.HIGH].map((lvl) => (
                    <button
                    key={lvl}
                    type="button"
                    onClick={() => setEffort(lvl)}
                    className={`p-1.5 rounded-md transition-all ${effort === lvl ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title={`Effort: ${lvl}`}
                    >
                    {getEffortIcon(lvl)}
                    </button>
                ))}
                </div>

                <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={activeProjectId ? `Add task to ${currentProject?.name}...` : "New Task... (Type / for commands)"}
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 text-lg"
                />

                <button 
                    type="button"
                    onClick={toggleVoice}
                    className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                    title="Vocal Log"
                >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit" 
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
                >
                <Plus className="w-5 h-5" />
                </motion.button>
            </motion.form>

            {/* Task Lists */}
            <div className="space-y-8 pb-10">
                
                {urgentTasks.length > 0 && (
                <section>
                    <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Critical</span>
                    <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full">{currentUrgentCount} / {URGENT_LIMIT} Capacity</span>
                    </h3>
                    <div className="space-y-3">
                    <AnimatePresence>
                    {urgentTasks.map(task => (
                        <TaskItem 
                        key={task.id} 
                        task={task} 
                        isActive={activeTaskId === task.id}
                        onToggle={() => toggleTask(task)} 
                        onLineToggle={() => toggleLine(task)}
                        onDelete={() => deleteTask(task.id!)} 
                        isGlowing={true} 
                        />
                    ))}
                    </AnimatePresence>
                    </div>
                </section>
                )}

                <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {activeProjectId ? `${currentProject?.name} Tasks` : 'General Population'}
                </h3>
                <div className="space-y-2">
                    <AnimatePresence>
                    {regularTasks.length === 0 && urgentTasks.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed"
                    >
                        <p className="text-slate-400 text-sm font-serif italic">
                            {activeProjectId ? 'Island mapped. No tasks visible.' : 'All caught up. Enjoy the water.'}
                        </p>
                    </motion.div>
                    )}
                    {regularTasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        isActive={activeTaskId === task.id}
                        onToggle={() => toggleTask(task)} 
                        onLineToggle={() => toggleLine(task)}
                        onDelete={() => deleteTask(task.id!)} 
                    />
                    ))}
                    </AnimatePresence>
                </div>
                </section>

                {completedTasks.length > 0 && (
                <section className="opacity-60">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Washed Away</h3>
                    <div className="space-y-2">
                    <AnimatePresence>
                    {completedTasks.map(task => (
                        <TaskItem 
                        key={task.id} 
                        task={task} 
                        isActive={false} // Completed tasks cannot be active
                        onToggle={() => toggleTask(task)} 
                        onLineToggle={() => {}} 
                        onDelete={() => deleteTask(task.id!)} 
                        />
                    ))}
                    </AnimatePresence>
                    </div>
                </section>
                )}
            </div>
      </div>
    </div>
  );
};

interface TaskItemProps { 
  task: Task; 
  isActive: boolean;
  onToggle: () => void; 
  onLineToggle: () => void;
  onDelete: () => void;
  isGlowing?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, isActive, onToggle, onLineToggle, onDelete, isGlowing }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    whileHover={{ scale: 1.01 }}
    className={`
    group flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all cursor-default relative overflow-hidden
    ${isGlowing ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'}
    ${isActive ? 'ring-2 ring-blue-400 border-blue-400' : ''}
  `}>
    
    {/* Active Glow Background */}
    {isActive && (
      <div className="absolute inset-0 bg-blue-50/50 pointer-events-none z-0"></div>
    )}

    <div className="flex items-center gap-3 flex-1 z-10">
      <motion.button 
        whileTap={{ scale: 0.8 }}
        onClick={onToggle} 
        className="text-slate-400 hover:text-blue-500 transition-colors"
      >
        {task.isCompleted ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5" />}
      </motion.button>
      <div className="flex flex-col">
        <span className={`transition-colors duration-300 ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
          {task.title}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
           {task.priority === TaskPriority.URGENT && !task.isCompleted && (
            <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">URGENT</span>
           )}
           {task.filePath && (
             <span className="text-[10px] flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100 border border-blue-200" title={`Anchor: ${task.filePath}`}>
               <LinkIcon className="w-3 h-3 mr-1" />
               Anchored
             </span>
           )}
           <span className="text-[10px] text-slate-500 border border-slate-200 px-1.5 rounded flex items-center bg-slate-50">
             {task.effort === EffortLevel.LOW && <Battery className="w-3 h-3 mr-1 inline" />}
             {task.effort === EffortLevel.MEDIUM && <BatteryCharging className="w-3 h-3 mr-1 inline" />}
             {task.effort === EffortLevel.HIGH && <Gauge className="w-3 h-3 mr-1 inline" />}
             {task.effort}
           </span>
        </div>
      </div>
    </div>
    <div className="flex gap-2 z-10">
      {!task.isCompleted && (
        <button 
          onClick={onLineToggle}
          className={`p-1.5 rounded transition-colors ${isActive ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
          title={isActive ? "Reel Up Line" : "Cast Line (Focus)"}
        >
          <Anchor className="w-4 h-4" />
        </button>
      )}
      <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);
