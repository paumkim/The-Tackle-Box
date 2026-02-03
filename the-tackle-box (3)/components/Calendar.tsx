
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight, Map, Grid, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '../db';
import { Task } from '../types';
import { VoyageMap } from './VoyageMap';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'GRID' | 'MAP'>('GRID');
  const tasks = useLiveQuery(() => db.tasks.toArray());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getTasksForDay = (day: number) => {
    if (!tasks) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.dueDate === dateStr && !t.isCompleted);
  };

  return (
    <div className="bridge-container-standard">
      <header className="bridge-header-standard">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
            <CalendarIcon className="w-6 h-6 text-slate-600" />
            The Chart Room
          </h2>
          <p className="text-slate-500 font-serif italic text-sm">Plot your course across the days.</p>
        </div>
        
        <div className="flex gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} title="Grid View"><Grid className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('MAP')} className={`p-2 rounded-md transition-all ${viewMode === 'MAP' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} title="Voyage Map"><Map className="w-5 h-5" /></button>
            </div>
        </div>
      </header>

      {viewMode === 'GRID' && (
          <div className="px-4 mb-4 flex items-center justify-center gap-6">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-600"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-bold text-slate-700 min-w-[180px] text-center font-serif text-lg">
                {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-600"><ChevronRight className="w-5 h-5" /></button>
          </div>
      )}

      <div className="bridge-body-standard">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
            {viewMode === 'MAP' ? (
                <div className="absolute inset-0"><VoyageMap /></div>
            ) : (
                <>
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
                    ))}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-5 flex-1">
                    {blanks.map(blank => (<div key={`blank-${blank}`} className="border-b border-r border-slate-100 bg-slate-50/30" />))}
                    {days.map(day => {
                        const dayTasks = getTasksForDay(day);
                        const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                        return (
                        <div key={day} className={`border-b border-r border-slate-100 p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'}`}>{day}</div>
                            <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {dayTasks.map((t: Task) => (<div key={t.id} className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-600 truncate font-medium">{t.title}</div>))}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </>
            )}
          </div>
      </div>
    </div>
  );
};
