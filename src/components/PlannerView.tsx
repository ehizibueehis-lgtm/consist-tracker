import React, { useState } from 'react';
import {
  Activity,
  Goal,
  LifeCategory,
  PriorityLevel,
  RecurrencePattern,
  EnergyLevel,
} from '../types';
import {
  analyzeScheduleHealth,
  findSmartRescheduleSlot,
  formatTimeDisplay,
  minutesToTime,
  timeToMinutes,
} from '../utils/consistency';
import {
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Clock,
  Coffee,
  Calendar,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';

interface PlannerViewProps {
  activities: Activity[];
  goals: Goal[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  wakeTime: string;
  sleepTime: string;
  strictness: 'strict' | 'balanced' | 'flexible';
  energyLevel: EnergyLevel;
  timeFormat: '12h' | '24h';
  onStartActivity: (activity: Activity) => void;
  onUpdateActivity: (updated: Activity, celebrationMsg?: string) => void;
  onAddActivities: (newItems: Activity[], celebrationMsg?: string) => void;
  onDeleteActivity: (id: string) => void;
  onReplaceActivities: (updatedList: Activity[], celebrationMsg?: string) => void;
}

const CATEGORIES: LifeCategory[] = [
  'Academics',
  'Work',
  'Fitness',
  'Faith',
  'Personal Development',
  'Reading',
  'Sleep',
  'Business',
  'Creative Work',
  'Other',
];

const PRIORITIES: PriorityLevel[] = ['Critical', 'High', 'Medium', 'Low'];

export const PlannerView: React.FC<PlannerViewProps> = ({
  activities,
  goals,
  selectedDate,
  onChangeDate,
  wakeTime,
  sleepTime,
  strictness,
  energyLevel,
  timeFormat,
  onStartActivity,
  onUpdateActivity,
  onAddActivities,
  onDeleteActivity,
  onReplaceActivities,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // AI Daily Planner
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    'I have lectures from 10 AM to 2 PM, I need to study for 2 hours, work on my project for 1 hour, exercise for 30 minutes, and read for 1 hour.'
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    summary: string;
    overloadWarning: string;
    activities: any[];
  } | null>(null);

  // Emergency / Busy Day Mode ("Reset My Day")
  const [showResetDay, setShowResetDay] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [behindMinutesInput, setBehindMinutesInput] = useState(120);
  const [resetComparison, setResetComparison] = useState<{
    coachingMessage: string;
    strategyUsed: string;
    optimizedActivities: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      changeNote: string;
    }[];
  } | null>(null);

  // Smart Reschedule
  const [reschedulingActivity, setReschedulingActivity] = useState<Activity | null>(null);
  const [customRescheduleStart, setCustomRescheduleStart] = useState('17:00');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('10:30');
  const [formCategory, setFormCategory] = useState<LifeCategory>('Academics');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('High');
  const [formRecurrence, setFormRecurrence] = useState<RecurrencePattern>('once');
  const [formNotes, setFormNotes] = useState('');
  const [formGoalId, setFormGoalId] = useState('');

  const dayActivities = activities
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const filteredActivities = dayActivities.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const diagnostics = analyzeScheduleHealth(dayActivities, wakeTime, sleepTime);

  const openNewActivityModal = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormDesc('');
    setFormDate(selectedDate);
    setFormStart('09:00');
    setFormEnd('10:00');
    setFormCategory('Academics');
    setFormPriority('High');
    setFormRecurrence('once');
    setFormNotes('');
    setFormGoalId(goals[0]?.id || '');
    setShowAddModal(true);
  };

  const openEditActivityModal = (act: Activity) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormDesc(act.description);
    setFormDate(act.date);
    setFormStart(act.startTime);
    setFormEnd(act.endTime);
    setFormCategory(act.category);
    setFormPriority(act.priority);
    setFormRecurrence(act.recurrence);
    setFormNotes(act.notes || '');
    setFormGoalId(act.goalId || '');
    setShowAddModal(true);
  };

  const handleSaveActivityForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const duration = Math.max(10, timeToMinutes(formEnd) - timeToMinutes(formStart));

    if (editingActivity) {
      onUpdateActivity(
        {
          ...editingActivity,
          title: formTitle.trim(),
          description: formDesc.trim(),
          date: formDate,
          startTime: formStart,
          endTime: formEnd,
          plannedDurationMinutes: duration,
          category: formCategory,
          priority: formPriority,
          recurrence: formRecurrence,
          notes: formNotes.trim(),
          goalId: formGoalId || undefined,
        },
        `Updated "${formTitle.trim()}"`
      );
    } else {
      const newAct: Activity = {
        id: `act-${Date.now()}`,
        title: formTitle.trim(),
        description: formDesc.trim() || 'Scheduled activity',
        date: formDate,
        startTime: formStart,
        endTime: formEnd,
        plannedDurationMinutes: duration,
        actualDurationMinutes: 0,
        completionPercentage: 0,
        category: formCategory,
        priority: formPriority,
        recurrence: formRecurrence,
        status: 'scheduled',
        notes: formNotes.trim(),
        goalId: formGoalId || undefined,
      };
      onAddActivities([newAct], `Added "${newAct.title}" to daily plan`);
    }
    setShowAddModal(false);
  };

  const handleGenerateAiPlan = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/plan-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          date: selectedDate,
          wakeTime,
          sleepTime,
          strictness,
          energyLevel,
          existingActivities: dayActivities.map((a) => ({
            title: a.title,
            startTime: a.startTime,
            endTime: a.endTime,
          })),
        }),
      });
      const data = await response.json();
      setAiResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAiPlan = () => {
    if (!aiResult?.activities) return;
    const mapped: Activity[] = aiResult.activities.map((item: any, idx: number) => ({
      id: `act-ai-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description || 'AI Planned Session',
      date: selectedDate,
      startTime: item.startTime || '09:00',
      endTime: item.endTime || '10:00',
      plannedDurationMinutes:
        item.durationMinutes ||
        Math.max(15, timeToMinutes(item.endTime || '10:00') - timeToMinutes(item.startTime || '09:00')),
      actualDurationMinutes: 0,
      completionPercentage: 0,
      category: (CATEGORIES.includes(item.category) ? item.category : 'Academics') as LifeCategory,
      priority: (PRIORITIES.includes(item.priority) ? item.priority : 'High') as PriorityLevel,
      recurrence: 'once',
      status: 'scheduled',
      notes: item.notes || '',
      goalId: goals[0]?.id,
    }));
    onAddActivities(mapped, `Added ${mapped.length} AI-scheduled activities`);
    setAiResult(null);
    setShowAiPlanner(false);
  };

  const handleRunResetDay = async () => {
    setShowResetDay(true);
    setResetLoading(true);
    const remaining = dayActivities.filter(
      (a) => a.status === 'scheduled' || a.status === 'missed' || a.status === 'in_progress'
    );
    try {
      const response = await fetch('/api/ai/reset-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTime: '14:30',
          behindMinutes: behindMinutesInput,
          remainingActivities: remaining.map((r) => ({
            id: r.id,
            title: r.title,
            startTime: r.startTime,
            endTime: r.endTime,
            durationMinutes: r.plannedDurationMinutes,
            priority: r.priority,
          })),
          sleepTime,
        }),
      });
      const data = await response.json();
      setResetComparison(data);
    } catch (err) {
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  const handleApplyResetDay = () => {
    if (!resetComparison?.optimizedActivities) return;
    const optMap = new Map(resetComparison.optimizedActivities.map((o) => [o.id, o]));
    const updated = activities.map((act) => {
      const match = optMap.get(act.id);
      if (!match) return act;
      return {
        ...act,
        startTime: match.startTime,
        endTime: match.endTime,
        plannedDurationMinutes: match.durationMinutes,
        status: act.status === 'missed' ? ('scheduled' as const) : act.status,
        notes: `${act.notes ? act.notes + ' · ' : ''}${match.changeNote}`,
      };
    });
    onReplaceActivities(updated, 'Optimized recovery schedule applied');
    setShowResetDay(false);
    setResetComparison(null);
  };

  const openSmartReschedule = (act: Activity) => {
    const slot = findSmartRescheduleSlot(act, dayActivities, sleepTime);
    setCustomRescheduleStart(slot.startTime);
    setReschedulingActivity(act);
  };

  const handleConfirmReschedule = (option: 'reschedule' | 'skip' | 'later' | 'keep_missed') => {
    if (!reschedulingActivity) return;
    if (option === 'reschedule') {
      const newEnd = minutesToTime(
        timeToMinutes(customRescheduleStart) + reschedulingActivity.plannedDurationMinutes
      );
      onUpdateActivity(
        {
          ...reschedulingActivity,
          startTime: customRescheduleStart,
          endTime: newEnd,
          status: 'scheduled',
          notes: `Rescheduled to ${customRescheduleStart}`,
        },
        `Rescheduled "${reschedulingActivity.title}" to ${formatTimeDisplay(customRescheduleStart, timeFormat)}`
      );
    } else if (option === 'skip') {
      onUpdateActivity(
        { ...reschedulingActivity, status: 'skipped' },
        `Marked "${reschedulingActivity.title}" as skipped`
      );
    } else if (option === 'later') {
      onUpdateActivity(
        {
          ...reschedulingActivity,
          startTime: '20:00',
          endTime: minutesToTime(20 * 60 + reschedulingActivity.plannedDurationMinutes),
          status: 'scheduled',
        },
        `Moved "${reschedulingActivity.title}" to 8:00 PM evening slot`
      );
    }
    setReschedulingActivity(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Daily Schedule & AI Planner
          </h1>
          <p className="text-sm text-neutral-600 dark:text-slate-400 mt-0.5">
            Plan your day realistically, detect over-scheduling early, and launch directly into Focus Mode.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onChangeDate(e.target.value)}
              className="text-xs font-mono text-neutral-800 dark:text-slate-200 bg-transparent focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAiPlanner((v) => !v)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            PLAN MY DAY
          </button>

          <button
            type="button"
            onClick={handleRunResetDay}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset My Day
          </button>

          <button
            type="button"
            onClick={openNewActivityModal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-slate-700 text-neutral-800 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>
      </div>

      {/* Diagnostics Alert */}
      {(diagnostics.isOverloaded || diagnostics.missingBreakAfterIds.length > 0) && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Schedule Health & Break Recommendation</span>
            </div>
            <span className="font-mono">
              Planned: {(diagnostics.totalScheduledMinutes / 60).toFixed(1)}h / Max:{' '}
              {(diagnostics.recommendedMaxMinutes / 60).toFixed(1)}h
            </span>
          </div>

          {diagnostics.overloadMessage && (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              • {diagnostics.overloadMessage}
            </p>
          )}

          {diagnostics.missingBreakAfterIds.length > 0 && (
            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 pt-1">
              <span>
                • Recommended Break: "{diagnostics.missingBreakAfterIds[0].title}" is a demanding block without a recovery break afterward.
              </span>
              <button
                type="button"
                onClick={() => {
                  const bStart = diagnostics.missingBreakAfterIds[0].suggestedBreakStart;
                  const bEnd = diagnostics.missingBreakAfterIds[0].suggestedBreakEnd;
                  onAddActivities([
                    {
                      id: `act-break-${Date.now()}`,
                      title: 'Decompression & Hydration Break',
                      description: '15-minute rest interval',
                      date: selectedDate,
                      startTime: bStart,
                      endTime: bEnd,
                      plannedDurationMinutes: 15,
                      actualDurationMinutes: 0,
                      completionPercentage: 0,
                      category: 'Personal Development',
                      priority: 'Low',
                      recurrence: 'once',
                      status: 'scheduled',
                    },
                  ]);
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-700 text-white hover:bg-amber-600 flex items-center gap-1"
              >
                <Coffee className="w-3.5 h-3.5" />
                Insert 15m Break
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Daily Planner Drawer */}
      {showAiPlanner && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              AI Daily Planner (“Plan My Day”)
            </h2>
            <button
              type="button"
              onClick={() => setShowAiPlanner(false)}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 p-3 text-sm text-neutral-900 dark:text-white"
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500 font-mono">
              Aligned with your wake ({wakeTime}) & sleep ({sleepTime}) times · {energyLevel} Energy
            </span>
            <button
              type="button"
              disabled={aiLoading}
              onClick={handleGenerateAiPlan}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {aiLoading ? 'Generating Schedule...' : 'Generate Realistic Schedule'}
            </button>
          </div>

          {aiResult && (
            <div className="pt-4 border-t border-neutral-200 dark:border-slate-800 space-y-3">
              <div className="text-xs text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl">
                {aiResult.summary}
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-slate-800 border border-neutral-200 dark:border-slate-800 rounded-xl">
                {aiResult.activities.map((item: any, idx: number) => (
                  <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="text-neutral-500 ml-2">{item.description}</span>
                    </div>
                    <div className="font-mono text-neutral-600 dark:text-slate-300">
                      {item.startTime} – {item.endTime} ({item.durationMinutes}m)
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAiResult(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAiPlan}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Apply {aiResult.activities.length} Activities
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emergency / Busy Day Mode */}
      {showResetDay && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              Reset My Day (Emergency Recovery)
            </h2>
            <button
              type="button"
              onClick={() => setShowResetDay(false)}
              className="p-1 text-neutral-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {resetComparison && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200">
                {resetComparison.coachingMessage}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-neutral-500">Original Remaining</div>
                  {dayActivities
                    .filter((a) => a.status === 'scheduled' || a.status === 'missed')
                    .map((act) => (
                      <div key={act.id} className="text-xs flex justify-between py-1 border-b border-neutral-100 dark:border-slate-800">
                        <span>{act.title}</span>
                        <span className="font-mono text-neutral-400">{act.startTime} – {act.endTime}</span>
                      </div>
                    ))}
                </div>

                <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 space-y-2">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Optimized Schedule</div>
                  {resetComparison.optimizedActivities.map((opt) => (
                    <div key={opt.id} className="text-xs flex justify-between py-1 border-b border-neutral-100 dark:border-slate-800">
                      <span>{opt.title}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">{opt.startTime} – {opt.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetDay(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyResetDay}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Apply Optimized Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activities Timeline Table */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl divide-y divide-neutral-200 dark:divide-slate-800">
        {filteredActivities.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-sm font-medium text-neutral-600 dark:text-slate-400">
              No activities found for {selectedDate}.
            </div>
            <button
              type="button"
              onClick={openNewActivityModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
            >
              Add Activity
            </button>
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                act.status === 'in_progress' ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-24 shrink-0 font-mono">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white tabular-nums">
                    {formatTimeDisplay(act.startTime, timeFormat)}
                  </div>
                  <div className="text-xs text-neutral-400 tabular-nums">
                    to {formatTimeDisplay(act.endTime, timeFormat)}
                  </div>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                      {act.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-slate-400">
                    <span>{act.category}</span>
                    <span>·</span>
                    <span>{act.priority}</span>
                    <span>·</span>
                    <span className="font-mono">
                      {act.status === 'completed'
                        ? '✓ Completed'
                        : act.status === 'in_progress'
                        ? '▶ In Progress'
                        : act.status === 'missed'
                        ? '⚠ Missed'
                        : '○ Scheduled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {act.status === 'missed' && (
                  <button
                    type="button"
                    onClick={() => openSmartReschedule(act)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white"
                  >
                    Reschedule
                  </button>
                )}

                {act.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => onStartActivity(act)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    START
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openEditActivityModal(act)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteActivity(act.id)}
                  className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Smart Reschedule Modal */}
      {reschedulingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              You missed this activity. Would you like to reschedule it?
            </h3>
            <div className="text-xs text-neutral-500 font-mono">
              {reschedulingActivity.title} ({reschedulingActivity.plannedDurationMinutes}m)
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmReschedule('reschedule')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
              >
                Reschedule ({customRescheduleStart})
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReschedule('later')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-slate-900"
              >
                Complete Later (20:00)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReschedule('skip')}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border border-neutral-300 dark:border-slate-700"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReschedule('keep_missed')}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border border-neutral-300 dark:border-slate-700 text-neutral-500"
              >
                Keep as Missed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveActivityForm}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {editingActivity ? 'Edit Activity' : 'Add Activity'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-slate-300 mb-1">
                Activity Name *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Engineering Study"
                className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-sm text-neutral-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-slate-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-slate-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as LifeCategory)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-xs"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Save Activity
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
