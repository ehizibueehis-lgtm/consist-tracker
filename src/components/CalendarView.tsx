import React, { useState } from 'react';
import { Activity } from '../types';
import {
  formatTimeDisplay,
  minutesToTime,
  timeToMinutes,
  TODAY_DATE,
} from '../utils/consistency';
import { Play, GripVertical, ArrowUp, ArrowDown, Plus, Minus } from 'lucide-react';

interface CalendarViewProps {
  activities: Activity[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  timeFormat: '12h' | '24h';
  onUpdateActivity: (updated: Activity, celebrationMsg?: string) => void;
  onStartActivity: (activity: Activity) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

export const CalendarView: React.FC<CalendarViewProps> = ({
  activities,
  selectedDate,
  onChangeDate,
  timeFormat,
  onUpdateActivity,
  onStartActivity,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const dayActivities = activities
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const handleShiftActivity = (act: Activity, deltaMinutes: number) => {
    const newStartMins = Math.max(360, Math.min(1320, timeToMinutes(act.startTime) + deltaMinutes));
    const newEndMins = newStartMins + act.plannedDurationMinutes;
    const newStart = minutesToTime(newStartMins);
    const newEnd = minutesToTime(newEndMins);

    onUpdateActivity(
      { ...act, startTime: newStart, endTime: newEnd },
      `Shifted "${act.title}" to ${formatTimeDisplay(newStart, timeFormat)}`
    );
  };

  const handleResizeDuration = (act: Activity, deltaMinutes: number) => {
    const newDuration = Math.max(15, Math.min(300, act.plannedDurationMinutes + deltaMinutes));
    const newEnd = minutesToTime(timeToMinutes(act.startTime) + newDuration);

    onUpdateActivity(
      { ...act, plannedDurationMinutes: newDuration, endTime: newEnd },
      `Resized "${act.title}" to ${newDuration}m`
    );
  };

  const weekDays = [
    { label: 'Mon', date: '2026-10-05', score: 84 },
    { label: 'Tue', date: '2026-10-06', score: 91 },
    { label: 'Wed', date: '2026-10-07', score: 76 },
    { label: 'Thu', date: '2026-10-08', score: 82 },
    { label: 'Fri', date: '2026-10-09', score: 88 },
    { label: 'Sat', date: '2026-10-10', score: 94 },
    { label: 'Sun', date: '2026-10-11', score: 89 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Calendar & Time Allocation
          </h1>
          <p className="text-sm text-neutral-600 dark:text-slate-400 mt-0.5">
            Adjust activity times, resize session blocks, and ensure conflict-free execution.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl">
          {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-slate-400'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 dark:border-slate-800 flex justify-between items-center bg-neutral-50/50 dark:bg-slate-950/50">
            <span className="text-xs font-mono font-semibold text-neutral-600 dark:text-slate-400">
              DATE: {selectedDate}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onChangeDate(e.target.value)}
              className="text-xs font-mono border border-neutral-300 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-slate-800">
            {HOURS.map((hour) => {
              const hourLabel = formatTimeDisplay(`${String(hour).padStart(2, '0')}:00`, timeFormat);
              const matching = dayActivities.filter(
                (a) => Math.floor(timeToMinutes(a.startTime) / 60) === hour
              );

              return (
                <div key={hour} className="flex min-h-[64px] hover:bg-neutral-50/60 dark:hover:bg-slate-800/30">
                  <div className="w-24 sm:w-28 shrink-0 px-4 py-3 border-r border-neutral-200 dark:border-slate-800 text-xs font-mono text-neutral-400 tabular-nums">
                    {hourLabel}
                  </div>

                  <div className="flex-1 p-2 space-y-2">
                    {matching.map((act) => (
                      <div
                        key={act.id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          act.status === 'completed'
                            ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : act.status === 'in_progress'
                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                            : 'border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/70'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {act.title}
                          </div>
                          <div className="text-xs font-mono text-neutral-500">
                            {formatTimeDisplay(act.startTime, timeFormat)} –{' '}
                            {formatTimeDisplay(act.endTime, timeFormat)} · {act.plannedDurationMinutes}m
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleShiftActivity(act, -30)}
                            className="p-1 rounded border border-neutral-200 dark:border-slate-700 text-xs"
                            title="Shift earlier"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShiftActivity(act, 30)}
                            className="p-1 rounded border border-neutral-200 dark:border-slate-700 text-xs"
                            title="Shift later"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResizeDuration(act, -15)}
                            className="px-2 py-0.5 rounded border border-neutral-200 dark:border-slate-700 text-xs font-mono"
                          >
                            -15m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResizeDuration(act, 15)}
                            className="px-2 py-0.5 rounded border border-neutral-200 dark:border-slate-700 text-xs font-mono"
                          >
                            +15m
                          </button>
                          {act.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => onStartActivity(act)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Start
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((wd) => (
            <div
              key={wd.date}
              onClick={() => {
                onChangeDate(wd.date);
                setViewMode('daily');
              }}
              className="p-4 rounded-2xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-slate-800">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">{wd.label}</span>
                <span className="text-xs font-mono text-emerald-600 font-semibold">{wd.score}%</span>
              </div>
              <div className="pt-3 text-[11px] font-mono text-neutral-400">
                {wd.date === TODAY_DATE ? 'Today (Active)' : 'Consistent'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
