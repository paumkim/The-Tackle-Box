
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight, Map, Grid } from 'lucide-react';
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
    <div className="h-full flex flex-col w-full px-6 py-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">The Chart Room</h2>
          <p className="text-slate-500">Plot your course across the days.</p>
        </div>
        
        <div className="flex gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('GRID')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Grid View"
                >
                    <Grid className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setViewMode('MAP')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'MAP' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Voyage Map"
                >
                    <Map className="w-5 h-5" />
                </button>
            </div>

            {viewMode === 'GRID' && (
                <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-md text-slate-600">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold text-slate-700 min-w-[140px] text-center">
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-md text-slate-600">
                    <ChevronRight className="w-5 h-5" />
                </button>
                </div>
            )}
        </div>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        {viewMode === 'MAP' ? (
            <div className="absolute inset-0">
                <VoyageMap />
            </div>
        ) : (
            <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {day}
                    </div>
                ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 grid-rows-5 flex-1">
                {blanks.map(blank => (
                    <div key={`blank-${blank}`} className="border-b border-r border-slate-100 bg-slate-50/30" />
                ))}
                
                {days.map(day => {
                    const dayTasks = getTasksForDay(day);
                    const isToday = 
                    new Date().getDate() === day && 
                    new Date().getMonth() === month && 
                    new Date().getFullYear() === year;

                    return (
                    <div key={day} className={`border-b border-r border-slate-100 p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/50' : ''}`}>
                        <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                        {day}
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayTasks.map((t: Task) => (
                            <div key={t.id} className="text-[10px] px-1.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-slate-600 truncate">
                            {t.title}
                            </div>
                        ))}
                        {dayTasks.length > 3 && (
                            <div className="text-[10px] text-slate-400 pl-1">+ {dayTasks.length - 3} more</div>
                        )}
                        </div>
                    </div>
                    );
                })}
                </div>
            </>
        )}
      </div>
    </div>
  );
};
