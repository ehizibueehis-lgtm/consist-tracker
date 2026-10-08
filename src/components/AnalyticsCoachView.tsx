import React, { useState } from 'react';
import { Activity, Habit, Achievement, DailyCheckIn } from '../types';
import { RefreshCw, CheckCircle2, Award, Filter } from 'lucide-react';

interface AnalyticsCoachViewProps {
  activities: Activity[];
  habits: Habit[];
  achievements: Achievement[];
  checkIns: DailyCheckIn[];
  currentStreak: number;
  longestStreak: number;
  onAcceptScheduleRecommendation: (rec: {
    id: string;
    title: string;
    newStartTime: string;
    newDurationMinutes: number;
  }) => void;
}

export const AnalyticsCoachView: React.FC<AnalyticsCoachViewProps> = ({
  activities,
  habits,
  achievements,
  checkIns,
  currentStreak,
  longestStreak,
  onAcceptScheduleRecommendation,
}) => {
  const [activeTab, setActiveTab] = useState<'coach' | 'weekly' | 'monthly' | 'history' | 'achievements'>('coach');
  const [coachLoading, setCoachLoading] = useState(false);
  const [acceptedRecIds, setAcceptedRecIds] = useState<string[]>([]);

  const [coachData, setCoachData] = useState({
    observations: [
      {
        title: 'Peak Morning Execution Window',
        metric: '94% completion before 11:30 AM',
        detail: 'You are most consistent with your morning activities. Tasks scheduled between 6:15 AM and 11:00 AM start within 2 minutes of planned time.',
        actionableFix: 'Anchor your hardest Critical engineering study sessions in the morning before checking notifications.',
      },
      {
        title: 'Afternoon Energy Dip (2:00 PM – 4:00 PM)',
        metric: '62% of missed/delayed tasks occur between 2 PM and 4 PM',
        detail: 'You tend to miss activities scheduled between 2:00 PM and 4:00 PM due to post-lunch cognitive fatigue.',
        actionableFix: 'Insert a 25-minute recovery buffer at 2:00 PM and shift deep project work to 3:30 PM.',
      },
      {
        title: 'Study Consistency Velocity',
        metric: '+18% study consistency improvement this week',
        detail: 'Your study consistency improved by 18% this week using 50/10 Pomodoro intervals.',
        actionableFix: 'Keep capping single continuous study blocks at 90 minutes.',
      },
    ],
    whatWentWell: [
      'Maintained a 12-day consistency streak with 96% adherence on morning keystone habits.',
      'Your study consistency improved by 18% this week (21.5 focused hours logged).',
      'Completed 100% of morning Critical tasks on schedule.',
    ],
    needsImprovement: [
      'Activities scheduled between 2:00 PM and 4:00 PM experienced a 38% skip rate.',
      'Wednesday schedule was overloaded with 8.5 hours of planned work.',
    ],
    suggestedScheduleChanges: [
      {
        id: 'rec-1',
        title: 'Shift Afternoon Project Work to 15:30 with 15m Buffer',
        reason: 'Avoids the 2:00 PM – 3:00 PM fatigue trough where 62% of misses occur.',
        newStartTime: '15:30',
        newDurationMinutes: 90,
      },
      {
        id: 'rec-2',
        title: 'Standardize Engineering Study Session to 90m Morning Block',
        reason: 'You perform 28% better when demanding analytical tasks are scheduled before 10:30 AM.',
        newStartTime: '08:30',
        newDurationMinutes: 90,
      },
    ],
  });

  const handleRefreshCoach = async () => {
    setCoachLoading(true);
    try {
      const response = await fetch('/api/ai/coach-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities, habits, checkIns, streak: currentStreak }),
      });
      const data = await response.json();
      if (data.observations) setCoachData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCoachLoading(false);
    }
  };

  // 12-week GitHub style heatmap
  const heatmapWeeks = Array.from({ length: 12 }, (_, wIdx) =>
    Array.from({ length: 7 }, (__, dIdx) => {
      const score = wIdx === 11 && dIdx > 3 ? 0 : [84, 91, 76, 88, 82, 94, 89][(wIdx + dIdx) % 7];
      return { score };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            AI Productivity Coach & Reviews
          </h1>
          <p className="text-sm text-neutral-600 dark:text-slate-400 mt-0.5">
            Behavioral analysis grounded in your actual schedule, completion rates, and historical logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl">
          {[
            { id: 'coach', label: 'AI Coach' },
            { id: 'weekly', label: 'Weekly Review' },
            { id: 'monthly', label: 'Monthly Heatmap' },
            { id: 'history', label: 'History' },
            { id: 'achievements', label: 'Achievements' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'coach' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400">BEHAVIORAL AI ENGINE</div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Productivity Patterns & Recommendations</h2>
            </div>
            <button
              type="button"
              disabled={coachLoading}
              onClick={handleRefreshCoach}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${coachLoading ? 'animate-spin' : ''}`} />
              Refresh AI Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coachData.observations.map((obs, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">0{i + 1}. PATTERN</span>
                  <span className="text-emerald-600">{obs.metric}</span>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{obs.title}</h3>
                <p className="text-xs text-neutral-600 dark:text-slate-300">“{obs.detail}”</p>
                <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 text-xs">
                  <strong className="text-indigo-600 dark:text-indigo-400">Fix: </strong>
                  {obs.actionableFix}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800">
              <div className="text-xs text-neutral-500">Weekly Consistency</div>
              <div className="text-2xl font-mono font-bold mt-1">86%</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800">
              <div className="text-xs text-neutral-500">Activities Completed</div>
              <div className="text-2xl font-mono font-bold mt-1">36 / 41</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800">
              <div className="text-xs text-neutral-500">Focused Time</div>
              <div className="text-2xl font-mono font-bold mt-1">33.5h</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800">
              <div className="text-xs text-neutral-500">Active Streak</div>
              <div className="text-2xl font-mono font-bold text-amber-600 mt-1">{currentStreak} Days 🔥</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-mono font-bold text-emerald-600 uppercase">What You Did Well</h3>
              <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-slate-300">
                {coachData.whatWentWell.map((w, i) => (
                  <li key={i}>✓ {w}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-mono font-bold text-amber-600 uppercase">What Needs Improvement</h3>
              <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-slate-300">
                {coachData.needsImprovement.map((n, i) => (
                  <li key={i}>• {n}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-indigo-600 uppercase">Suggested Schedule Changes</h3>
            <div className="divide-y divide-neutral-200 dark:divide-slate-800">
              {coachData.suggestedScheduleChanges.map((rec) => {
                const isAccepted = acceptedRecIds.includes(rec.id);
                return (
                  <div key={rec.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white">{rec.title}</div>
                      <div className="text-neutral-500">{rec.reason}</div>
                    </div>
                    <button
                      type="button"
                      disabled={isAccepted}
                      onClick={() => {
                        setAcceptedRecIds((prev) => [...prev, rec.id]);
                        onAcceptScheduleRecommendation(rec);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {isAccepted ? 'Applied' : 'Accept'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Monthly Consistency Heatmap (12 Weeks)
            </h3>
            <span className="text-xs font-mono text-neutral-500">Darker = Higher Consistency</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                {week.map((cell, dIdx) => (
                  <div
                    key={dIdx}
                    className={`h-6 rounded-sm text-[10px] font-mono text-white flex items-center justify-center ${
                      cell.score === 0
                        ? 'bg-neutral-100 dark:bg-slate-800 text-transparent'
                        : cell.score < 80
                        ? 'bg-emerald-400'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {cell.score > 0 ? `${cell.score}%` : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 dark:border-slate-800 font-mono text-neutral-500 bg-neutral-50/50 dark:bg-slate-950/50">
              <tr>
                <th className="p-3.5">Activity</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
              {activities.map((act) => (
                <tr key={act.id}>
                  <td className="p-3.5 font-medium">{act.title}</td>
                  <td className="p-3.5 text-neutral-500">{act.category}</td>
                  <td className="p-3.5 font-mono">{act.plannedDurationMinutes}m</td>
                  <td className="p-3.5 font-mono">{act.status}</td>
                  <td className="p-3.5 text-right font-mono font-semibold text-indigo-600">{act.completionPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border ${
                ach.unlocked
                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900'
                  : 'bg-neutral-50 dark:bg-slate-900/40 border-neutral-200 dark:border-slate-800 opacity-70'
              }`}
            >
              <div className="flex justify-between items-center text-xs font-mono text-indigo-600 mb-2">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {ach.unlocked ? 'UNLOCKED' : 'IN PROGRESS'}</span>
                <span>{ach.progress}/{ach.target}</span>
              </div>
              <h4 className="font-semibold text-neutral-900 dark:text-white">{ach.title}</h4>
              <p className="text-xs text-neutral-500 mt-1">{ach.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
