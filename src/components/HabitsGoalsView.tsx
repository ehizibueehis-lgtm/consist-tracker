import React, { useState } from 'react';
import { Habit, Goal, LifeCategory } from '../types';
import { formatTimeDisplay } from '../utils/consistency';
import { Plus, Check, Flame, Target, Clock, Bell, X } from 'lucide-react';

interface HabitsGoalsViewProps {
  habits: Habit[];
  goals: Goal[];
  timeFormat: '12h' | '24h';
  onToggleHabitToday: (habitId: string) => void;
  onToggleHabitWeekDay: (habitId: string, dayIndex: number) => void;
  onAddHabit: (habit: Habit) => void;
  onAddGoal: (goal: Goal) => void;
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

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HabitsGoalsView: React.FC<HabitsGoalsViewProps> = ({
  habits,
  goals,
  timeFormat,
  onToggleHabitToday,
  onToggleHabitWeekDay,
  onAddHabit,
  onAddGoal,
}) => {
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const [habTitle, setHabTitle] = useState('');
  const [habCategory, setHabCategory] = useState<LifeCategory>('Personal Development');
  const [habDuration, setHabDuration] = useState(30);
  const [habReminder, setHabReminder] = useState('07:30');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<LifeCategory>('Academics');
  const [goalDate, setGoalDate] = useState('2026-12-20');
  const [goalActionsText, setGoalActionsText] = useState(
    'Study 2 hours daily\nRevise lecture notes\nPractice questions\nWeekly review'
  );

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habTitle.trim()) return;
    const newHabit: Habit = {
      id: `hab-${Date.now()}`,
      title: habTitle.trim(),
      category: habCategory,
      frequency: 'daily',
      daysOfWeek: WEEK_LABELS,
      targetDurationMinutes: habDuration,
      reminderTime: habReminder,
      currentStreak: 1,
      longestStreak: 1,
      completionRate: 100,
      completedToday: false,
      weekHistory: [true, true, true, false, false, false, false],
    };
    onAddHabit(newHabit);
    setHabTitle('');
    setShowHabitModal(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const lines = goalActionsText.split('\n').filter(Boolean);
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: goalTitle.trim(),
      category: goalCategory,
      targetDate: goalDate,
      progressPercentage: 50,
      consistencyContribution: 88,
      actions: lines.map((l, i) => ({
        id: `ga-${Date.now()}-${i}`,
        title: l,
        frequencyText: 'Daily · 60m',
        targetMinutesPerDay: 60,
        adherenceRate: 85,
      })),
    };
    onAddGoal(newGoal);
    setGoalTitle('');
    setShowGoalModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Habit Consistency & Long-Term Goals
          </h1>
          <p className="text-sm text-neutral-600 dark:text-slate-400 mt-0.5">
            Turn long-term aspirations into daily non-negotiable habits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHabitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Habit
          </button>
          <button
            type="button"
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-slate-700 text-neutral-800 dark:text-slate-200 flex items-center gap-1.5"
          >
            <Target className="w-4 h-4" /> New Goal
          </button>
        </div>
      </div>

      {/* Habits Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Active Daily Habits
        </h2>

        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl divide-y divide-neutral-200 dark:divide-slate-800">
          {habits.map((hab) => (
            <div
              key={hab.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 dark:hover:bg-slate-800/30"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleHabitToday(hab.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                      hab.completedToday
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-neutral-300 dark:border-slate-700'
                    }`}
                  >
                    {hab.completedToday && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {hab.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono pl-8">
                  <span>{hab.category}</span>
                  <span>·</span>
                  <span>{hab.targetDurationMinutes}m target</span>
                  <span>·</span>
                  <span>Reminder {formatTimeDisplay(hab.reminderTime, timeFormat)}</span>
                </div>
              </div>

              <div className="flex items-center gap-5 pl-8 sm:pl-0">
                <div className="flex items-center gap-1">
                  {WEEK_LABELS.map((d, idx) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onToggleHabitWeekDay(hab.id, idx)}
                      className={`w-6 h-6 rounded-lg text-xs font-mono flex items-center justify-center border ${
                        hab.weekHistory[idx]
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-neutral-200 dark:border-slate-800 text-neutral-400'
                      }`}
                    >
                      {hab.weekHistory[idx] ? '✓' : '·'}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                  <Flame className="w-3.5 h-3.5" />
                  {hab.currentStreak}d streak
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Goals Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Long-Term Goals & Compound Consistency
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-3"
            >
              <div className="text-xs font-mono text-neutral-500 uppercase">
                {goal.category} · TARGET {goal.targetDate}
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {goal.title}
              </h3>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">GOAL PROGRESS</span>
                  <span className="font-bold text-indigo-600">{goal.progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: `${goal.progressPercentage}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                {goal.actions.map((act) => (
                  <div key={act.id} className="flex justify-between text-neutral-600 dark:text-slate-300">
                    <span className="truncate">• {act.title}</span>
                    <span className="font-mono text-emerald-600 shrink-0 font-semibold">{act.adherenceRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {showHabitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleCreateHabit}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">New Habit</h3>
            <input
              type="text"
              required
              value={habTitle}
              onChange={(e) => setHabTitle(e.target.value)}
              placeholder="e.g. Read 20 pages"
              className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowHabitModal(false)} className="px-4 py-2 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Save</button>
            </div>
          </form>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleCreateGoal}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">New Long-Term Goal</h3>
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Pass all university engineering courses"
              className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              value={goalActionsText}
              onChange={(e) => setGoalActionsText(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 p-3 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowGoalModal(false)} className="px-4 py-2 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
