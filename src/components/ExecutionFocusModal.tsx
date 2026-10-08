import React, { useState, useEffect } from 'react';
import { Activity, ActivitySession } from '../types';
import { formatTimeDisplay } from '../utils/consistency';
import {
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  X,
  Clock,
  Flame,
} from 'lucide-react';

interface ExecutionFocusModalProps {
  activity: Activity | null;
  timeFormat: '12h' | '24h';
  onClose: () => void;
  onUpdateActivity: (updated: Activity, celebrationMsg?: string) => void;
}

type PomodoroMode = 'continuous' | '25/5' | '50/10' | '90/15' | 'custom';

export const ExecutionFocusModal: React.FC<ExecutionFocusModalProps> = ({
  activity,
  timeFormat,
  onClose,
  onUpdateActivity,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('50/10');
  const [notes, setNotes] = useState(activity?.notes || '');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerEndedPrompt, setTimerEndedPrompt] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (activity) {
      setNotes(activity.notes || '');
      const spent = (activity.actualDurationMinutes || 0) * 60;
      setElapsedSeconds(spent);
      setIsRunning(true);
      setTimerEndedPrompt(false);
      setShowCelebration(false);
    }
  }, [activity?.id]);

  useEffect(() => {
    if (!activity || !isRunning || timerEndedPrompt || showCelebration) return;

    const totalTargetSecs = activity.plannedDurationMinutes * 60;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalTargetSecs) {
          setIsRunning(false);
          setTimerEndedPrompt(true);
          return totalTargetSecs;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activity, isRunning, timerEndedPrompt, showCelebration]);

  if (!activity) return null;

  const totalPlannedSeconds = Math.max(60, activity.plannedDurationMinutes * 60);
  const remainingSeconds = Math.max(0, totalPlannedSeconds - elapsedSeconds);
  const progressPct = Math.min(100, Math.round((elapsedSeconds / totalPlannedSeconds) * 100));

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const totalBlocks = 16;
  const filledBlocks = Math.round((progressPct / 100) * totalBlocks);
  const asciiBar =
    '█'.repeat(Math.max(0, filledBlocks)) +
    '░'.repeat(Math.max(0, totalBlocks - filledBlocks));

  const handleCompleteActivity = () => {
    setShowCelebration(true);
    setIsRunning(false);

    const actualMins = Math.max(
      1,
      Math.round(elapsedSeconds / 60) || activity.plannedDurationMinutes
    );

    const newSession: ActivitySession = {
      id: `session-${Date.now()}`,
      activityId: activity.id,
      startedAt: activity.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationMinutes: actualMins,
      completedState: 'full',
      sessionNotes: notes,
    };

    setTimeout(() => {
      onUpdateActivity(
        {
          ...activity,
          status: 'completed',
          actualDurationMinutes: actualMins,
          completionPercentage: 100,
          notes,
          completedAt: new Date().toTimeString().slice(0, 5),
          timeAdherenceScore: 98,
          historySessions: [...(activity.historySessions || []), newSession],
        },
        `✓ Completed "${activity.title}" · Consistency Score Updated`
      );
      onClose();
    }, 2000);
  };

  const handleContinueExtend = () => {
    onUpdateActivity({
      ...activity,
      plannedDurationMinutes: activity.plannedDurationMinutes + 15,
      status: 'in_progress',
      notes,
    });
    setTimerEndedPrompt(false);
    setIsRunning(true);
  };

  const handleSkipActivity = () => {
    onUpdateActivity({
      ...activity,
      status: 'skipped',
      actualDurationMinutes: Math.round(elapsedSeconds / 60),
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div
        className={`bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none border-0'
            : 'w-full max-w-2xl max-h-[92vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-mono text-neutral-500 dark:text-slate-400">
              FOCUS MODE · {activity.category.toUpperCase()} · {activity.priority.toUpperCase()} PRIORITY
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              className="px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isFullscreen ? 'Standard' : 'Fullscreen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6 overflow-y-auto">
          {showCelebration ? (
            /* Section 28 Satisfying Completion State */
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold animate-bounce shadow-lg shadow-emerald-500/30">
                ✓
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                ACTIVITY COMPLETED
              </h2>
              <p className="text-base text-neutral-600 dark:text-slate-300 font-medium">
                “Great job. You stayed consistent.”
              </p>
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Daily consistency score and streak updated immediately 🔥
              </div>
            </div>
          ) : (
            <>
              {/* Header Title & Timing */}
              <div className="text-center space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                  {activity.title}
                </h1>
                <div className="text-xs font-mono text-neutral-500 dark:text-slate-400">
                  Started {formatTimeDisplay(activity.startTime, timeFormat)} · Ends{' '}
                  {formatTimeDisplay(activity.endTime, timeFormat)} · Planned {activity.plannedDurationMinutes}m
                </div>
              </div>

              {/* Big Focused Countdown Timer Display */}
              <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 text-center space-y-5">
                <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums">
                  {formatCountdown(remainingSeconds)}
                </div>

                {/* ASCII + Visual Progress Bar (Section 28) */}
                <div className="max-w-md mx-auto space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-700 dark:text-slate-300">
                    <span className="tracking-widest">{asciiBar}</span>
                    <span className="font-bold">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400">
                    {Math.floor(elapsedSeconds / 60)}m actual focus recorded
                  </div>
                </div>

                {/* Controls */}
                {!timerEndedPrompt ? (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRunning((r) => !r)}
                      className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 flex items-center gap-2"
                    >
                      {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isRunning ? 'PAUSE' : 'RESUME'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteActivity}
                      className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      COMPLETE
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipActivity}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium border border-neutral-300 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                    >
                      END ACTIVITY
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Activity time is complete.
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-slate-300">
                      Did you successfully finish this session?
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleCompleteActivity}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5"
                      >
                        ✓ Completed
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueExtend}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1.5"
                      >
                        ↻ Continue (+15m)
                      </button>
                      <button
                        type="button"
                        onClick={handleSkipActivity}
                        className="px-4 py-2 rounded-lg text-xs font-medium border border-neutral-300 dark:border-slate-700 text-neutral-600"
                      >
                        ⏭ Skip
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pomodoro Cadence + Scratchpad Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-neutral-800 dark:text-slate-200">
                    Pomodoro Interval
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['continuous', '25/5', '50/10', '90/15'] as PomodoroMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPomodoroMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                          pomodoroMode === mode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 hover:bg-neutral-200'
                        }`}
                      >
                        {mode === 'continuous' ? 'Full Timer' : mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-neutral-800 dark:text-slate-200">
                    Session Notes
                  </div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Milestones achieved, blockers encountered..."
                    className="w-full rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
