import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Maximize2, CheckCircle2, Play, Pause, Timer as TimerIcon } from 'lucide-react';
import { db } from '../db';
import { useAppStore } from '../store';
import { Task } from '../types';

export const MiniPlayer: React.FC = () => {
  const toggleMiniMode = useAppStore(state => state.toggleMiniMode);
  const activeSession = useLiveQuery(() => db.sessions.where('endTime').equals(0).first());
  const tasks = useLiveQuery(() => db.tasks.where('isCompleted').equals(0).toArray());
  const [elapsed, setElapsed] = useState(0);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (activeSession) {
      setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
      interval = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const topTask = tasks?.[0];

  const completeTask = async (task: Task) => {
    if (task.id) await db.tasks.update(task.id, { isCompleted: true });
  };

  return (
    <div className="fixed top-4 right-4 w-72 bg-slate-900/95 backdrop-blur-xl text-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-[9999] flex flex-col font-sans">
      {/* Header / Drag Handle */}
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 w-full cursor-move"></div>
      
      <div className="p-4">
        {/* Timer Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${activeSession ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></div>
            <span className="font-mono text-xl font-bold tracking-wider">
              {formatTime(elapsed)}
            </span>
          </div>
          <button 
            onClick={toggleMiniMode}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Expand to Bridge"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Active Task */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-wider">Current Objective</div>
          {topTask ? (
            <div className="flex items-start gap-2">
              <button 
                onClick={() => completeTask(topTask)}
                className="mt-0.5 text-slate-400 hover:text-green-400 transition-colors"
              >
                <div className="w-4 h-4 border border-slate-500 rounded-full hover:bg-green-400/20"></div>
              </button>
              <p className="text-sm font-medium leading-tight">{topTask.title}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No active orders.</p>
          )}
        </div>
      </div>
    </div>
  );
};