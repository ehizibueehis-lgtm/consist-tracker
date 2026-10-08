import {
  Activity,
  ConsistencyBreakdown,
  Habit,
  Goal,
  NotificationItem,
  Achievement,
  UserProfile,
  PriorityLevel,
} from '../types';

export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  Critical: 1.5,
  High: 1.25,
  Medium: 1.0,
  Low: 0.75,
};

export const TODAY_DATE = '2026-10-08';

export function timeToMinutes(timeStr: string): number {
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(time24: string, format: '12h' | '24h' = '12h'): string {
  if (format === '24h') return time24;
  const [hStr, mStr] = (time24 || '08:00').split(':');
  const h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

export function calculateDailyConsistency(
  activities: Activity[],
  currentStreak: number
): ConsistencyBreakdown {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      completedCount: 0,
      partialCount: 0,
      missedCount: 0,
      skippedCount: 0,
      totalScheduled: 0,
      priorityWeightedScore: 0,
      durationAdherenceScore: 0,
      punctualityScore: 0,
      streakBonus: 0,
      explanation: ['No activities scheduled for this date.'],
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;
  let totalPlannedMinutes = 0;
  let totalEffectiveActualMinutes = 0;
  let punctualitySum = 0;
  let punctualityCount = 0;

  let completedCount = 0;
  let partialCount = 0;
  let missedCount = 0;
  let skippedCount = 0;

  const actionableActivities = activities.filter((a) => a.status !== 'scheduled');
  const evaluationPool = actionableActivities.length > 0 ? actionableActivities : activities;

  for (const act of activities) {
    if (act.status === 'completed') completedCount++;
    else if (act.status === 'partially_completed') partialCount++;
    else if (act.status === 'missed') missedCount++;
    else if (act.status === 'skipped') skippedCount++;
  }

  for (const act of evaluationPool) {
    const w = PRIORITY_WEIGHTS[act.priority] || 1.0;
    totalWeight += w;
    totalPlannedMinutes += act.plannedDurationMinutes;

    if (act.status === 'completed') {
      earnedWeight += w * (Math.max(90, act.completionPercentage) / 100);
      totalEffectiveActualMinutes += Math.min(
        act.plannedDurationMinutes,
        act.actualDurationMinutes || act.plannedDurationMinutes
      );
      punctualitySum += act.timeAdherenceScore ?? 96;
      punctualityCount++;
    } else if (act.status === 'partially_completed') {
      const pct = act.completionPercentage || 60;
      earnedWeight += w * (pct / 100);
      totalEffectiveActualMinutes +=
        act.actualDurationMinutes || Math.round((act.plannedDurationMinutes * pct) / 100);
      punctualitySum += act.timeAdherenceScore ?? 80;
      punctualityCount++;
    } else if (act.status === 'in_progress') {
      const pct = Math.max(35, act.completionPercentage || 50);
      earnedWeight += w * (pct / 100);
      totalEffectiveActualMinutes += act.actualDurationMinutes;
      punctualitySum += act.timeAdherenceScore ?? 95;
      punctualityCount++;
    } else if (act.status === 'skipped') {
      earnedWeight += w * 0.2;
    }
  }

  const priorityWeightedScore =
    totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const durationAdherenceScore =
    totalPlannedMinutes > 0
      ? Math.min(100, Math.round((totalEffectiveActualMinutes / totalPlannedMinutes) * 100))
      : 0;
  const punctualityScore =
    punctualityCount > 0 ? Math.round(punctualitySum / punctualityCount) : 85;
  const streakBonus = Math.min(5, Math.floor(currentStreak / 3));

  const rawComposite =
    priorityWeightedScore * 0.55 +
    durationAdherenceScore * 0.25 +
    punctualityScore * 0.15 +
    streakBonus;

  const overallScore =
    actionableActivities.length === 0
      ? 0
      : Math.max(0, Math.min(100, Math.round(rawComposite)));

  const explanation = [
    `Priority-Weighted Execution (55%): ${priorityWeightedScore}% — Critical (1.5x) and High (1.25x) activities carry higher consistency weight than Low (0.75x) tasks.`,
    `Duration Adherence (25%): ${durationAdherenceScore}% — ${totalEffectiveActualMinutes}m actual focused execution vs ${totalPlannedMinutes}m planned.`,
    `Start Punctuality (15%): ${punctualityScore}% — Measures adherence to scheduled starting time.`,
    `Streak Bonus (+5% cap): +${streakBonus}% from your ${currentStreak}-day active momentum.`,
  ];

  return {
    overallScore,
    completedCount,
    partialCount,
    missedCount,
    skippedCount,
    totalScheduled: activities.length,
    priorityWeightedScore,
    durationAdherenceScore,
    punctualityScore,
    streakBonus,
    explanation,
  };
}

export interface ScheduleDiagnostic {
  isOverloaded: boolean;
  totalScheduledMinutes: number;
  recommendedMaxMinutes: number;
  overloadMessage: string | null;
  missingBreakAfterIds: { activityId: string; title: string; suggestedBreakStart: string; suggestedBreakEnd: string }[];
  conflicts: { firstTitle: string; secondTitle: string; overlapTime: string }[];
}

export function analyzeScheduleHealth(
  activities: Activity[],
  wakeTime = '06:00',
  sleepTime = '22:30'
): ScheduleDiagnostic {
  const sorted = [...activities].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  const totalScheduledMinutes = sorted.reduce((acc, a) => acc + a.plannedDurationMinutes, 0);
  const awakeMinutes = Math.max(600, timeToMinutes(sleepTime) - timeToMinutes(wakeTime));
  const recommendedMaxMinutes = Math.round(awakeMinutes * 0.65);

  const isOverloaded = totalScheduledMinutes > recommendedMaxMinutes;
  const overloadMessage = isOverloaded
    ? `You have scheduled ${(totalScheduledMinutes / 60).toFixed(1)} hours today (recommended sustainable ceiling: ${(recommendedMaxMinutes / 60).toFixed(1)} hrs). Consider moving 1–2 Medium/Low tasks to tomorrow.`
    : null;

  const missingBreakAfterIds: ScheduleDiagnostic['missingBreakAfterIds'] = [];
  const conflicts: ScheduleDiagnostic['conflicts'] = [];

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const currEnd = timeToMinutes(curr.endTime);

    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      const nextStart = timeToMinutes(next.startTime);

      if (nextStart < currEnd) {
        conflicts.push({
          firstTitle: curr.title,
          secondTitle: next.title,
          overlapTime: `${next.startTime}–${curr.endTime}`,
        });
      } else if (
        curr.plannedDurationMinutes >= 90 &&
        nextStart - currEnd < 10 &&
        curr.category !== 'Sleep'
      ) {
        missingBreakAfterIds.push({
          activityId: curr.id,
          title: curr.title,
          suggestedBreakStart: curr.endTime,
          suggestedBreakEnd: minutesToTime(currEnd + 15),
        });
      }
    }
  }

  return {
    isOverloaded,
    totalScheduledMinutes,
    recommendedMaxMinutes,
    overloadMessage,
    missingBreakAfterIds,
    conflicts,
  };
}

export function findSmartRescheduleSlot(
  missedActivity: Activity,
  dayActivities: Activity[],
  sleepTime = '22:30'
): { startTime: string; endTime: string; reason: string } {
  const duration = missedActivity.plannedDurationMinutes;
  const sorted = dayActivities
    .filter((a) => a.id !== missedActivity.id && a.status !== 'skipped' && a.status !== 'missed')
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let candidateStart = Math.max(timeToMinutes(missedActivity.endTime) + 15, 15 * 60);
  const sleepMins = timeToMinutes(sleepTime);

  for (const act of sorted) {
    const actStart = timeToMinutes(act.startTime);
    const actEnd = timeToMinutes(act.endTime);
    if (candidateStart + duration <= actStart - 5) break;
    if (candidateStart < actEnd + 10) candidateStart = actEnd + 15;
  }

  if (candidateStart + duration > sleepMins) {
    candidateStart = Math.max(16 * 60, sleepMins - duration - 15);
  }

  return {
    startTime: minutesToTime(candidateStart),
    endTime: minutesToTime(candidateStart + duration),
    reason: `Open ${duration}-minute conflict-free window with a 15-minute transition buffer before evening routine.`,
  };
}

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  onboardingCompleted: true,
  mainGoals: [
    'Pass all engineering courses with excellent grades (3.9+ GPA)',
    'Launch production capstone software platform MVP',
    'Maintain 4x weekly strength & mobility conditioning',
  ],
  focusAreas: ['Academics', 'Work', 'Fitness', 'Faith', 'Reading', 'Personal Development'],
  wakeTime: '06:00',
  sleepTime: '22:30',
  scheduleStrictness: 'balanced',
  preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  currentStreak: 12,
  longestStreak: 21,
  weeklyStreak: 4,
  monthlyConsistency: 86,
  theme: 'dark',
  weekStartsOn: 'Monday',
  timeFormat: '12h',
  reminderLeadMinutes: 10,
  aiProactivity: 'high',
  notificationsEnabled: {
    upcomingActivity: true,
    activityStarting: true,
    missedActivity: true,
    dailyCheckIn: true,
    weeklyReview: true,
    streakMilestone: true,
  },
};

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    title: 'Morning routine & Devotion',
    description: 'Scripture reading, hydration, gratitude reflection, and daily intention setting.',
    date: TODAY_DATE,
    startTime: '06:15',
    endTime: '06:45',
    plannedDurationMinutes: 30,
    actualDurationMinutes: 30,
    completionPercentage: 100,
    category: 'Faith',
    priority: 'High',
    recurrence: 'daily',
    status: 'completed',
    notes: 'Grounding start to Thursday execution.',
    habitId: 'hab-1',
    timeAdherenceScore: 98,
  },
  {
    id: 'act-2',
    title: 'Lecture: Systems & Distributed Consensus',
    description: 'Seminar and active lecture note-taking.',
    date: TODAY_DATE,
    startTime: '09:00',
    endTime: '11:00',
    plannedDurationMinutes: 120,
    actualDurationMinutes: 120,
    completionPercentage: 100,
    category: 'Academics',
    priority: 'Critical',
    recurrence: 'weekdays',
    status: 'completed',
    goalId: 'goal-1',
    timeAdherenceScore: 100,
  },
  {
    id: 'act-3',
    title: 'Engineering Study Session',
    description: 'Control Systems state-space representation and Bode plot analysis.',
    date: TODAY_DATE,
    startTime: '16:00',
    endTime: '17:30',
    plannedDurationMinutes: 90,
    actualDurationMinutes: 45,
    completionPercentage: 50,
    category: 'Academics',
    priority: 'Critical',
    recurrence: 'weekdays',
    status: 'in_progress',
    notes: 'Problems 1–5 completed. Focus on frequency response stability.',
    goalId: 'goal-1',
    habitId: 'hab-3',
    startedAt: '16:00',
    timeAdherenceScore: 95,
  },
  {
    id: 'act-4',
    title: 'Project work & Telemetry Engine',
    description: 'Implement real-time consistency scoring pipeline and unit test coverage.',
    date: TODAY_DATE,
    startTime: '18:00',
    endTime: '19:30',
    plannedDurationMinutes: 90,
    actualDurationMinutes: 0,
    completionPercentage: 0,
    category: 'Work',
    priority: 'High',
    recurrence: 'weekdays',
    status: 'scheduled',
    goalId: 'goal-2',
    habitId: 'hab-5',
  },
  {
    id: 'act-5',
    title: 'Exercise & Conditioning',
    description: '45-minute strength conditioning session and thoracic mobility flow.',
    date: TODAY_DATE,
    startTime: '20:00',
    endTime: '20:45',
    plannedDurationMinutes: 45,
    actualDurationMinutes: 0,
    completionPercentage: 0,
    category: 'Fitness',
    priority: 'Medium',
    recurrence: 'weekdays',
    status: 'scheduled',
    habitId: 'hab-2',
    goalId: 'goal-3',
  },
  {
    id: 'act-6',
    title: 'Evening review & synthesis',
    description: 'Review day, log check-in reflection, and plan tomorrow morning blocks.',
    date: TODAY_DATE,
    startTime: '21:30',
    endTime: '22:00',
    plannedDurationMinutes: 30,
    actualDurationMinutes: 0,
    completionPercentage: 0,
    category: 'Personal Development',
    priority: 'Medium',
    recurrence: 'daily',
    status: 'scheduled',
  },
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'hab-1',
    title: 'Morning Prayer & Devotion',
    category: 'Faith',
    frequency: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    targetDurationMinutes: 30,
    reminderTime: '06:15',
    currentStreak: 19,
    longestStreak: 28,
    completionRate: 96,
    completedToday: true,
    weekHistory: [true, true, true, true, false, false, false],
  },
  {
    id: 'hab-2',
    title: 'Exercise & Conditioning',
    category: 'Fitness',
    frequency: 'specific_days',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    targetDurationMinutes: 45,
    reminderTime: '20:00',
    currentStreak: 12,
    longestStreak: 21,
    completionRate: 90,
    completedToday: false,
    weekHistory: [true, true, true, false, false, false, false],
    goalId: 'goal-3',
  },
  {
    id: 'hab-3',
    title: 'Engineering Study Session',
    category: 'Academics',
    frequency: 'specific_days',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    targetDurationMinutes: 90,
    reminderTime: '16:00',
    currentStreak: 9,
    longestStreak: 16,
    completionRate: 88,
    completedToday: false,
    weekHistory: [true, true, true, false, false, false, false],
    goalId: 'goal-1',
  },
  {
    id: 'hab-4',
    title: 'Read 20 pages',
    category: 'Reading',
    frequency: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    targetDurationMinutes: 35,
    reminderTime: '21:00',
    currentStreak: 7,
    longestStreak: 14,
    completionRate: 82,
    completedToday: false,
    weekHistory: [true, true, true, false, false, false, false],
  },
  {
    id: 'hab-5',
    title: 'Work on Project',
    category: 'Work',
    frequency: 'specific_days',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    targetDurationMinutes: 90,
    reminderTime: '18:00',
    currentStreak: 6,
    longestStreak: 15,
    completionRate: 84,
    completedToday: false,
    weekHistory: [true, true, true, false, false, false, false],
    goalId: 'goal-2',
  },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Pass all university engineering courses with excellent grades (3.9+ GPA)',
    category: 'Academics',
    targetDate: '2026-12-18',
    progressPercentage: 78,
    consistencyContribution: 91,
    actions: [
      { id: 'ga-1', title: 'Study 2 hours daily in deep focus mode', frequencyText: 'Mon–Sat · 120m', targetMinutesPerDay: 120, adherenceRate: 92 },
      { id: 'ga-2', title: 'Revise lecture notes within 24 hours', frequencyText: 'Daily · 45m', targetMinutesPerDay: 45, adherenceRate: 85 },
      { id: 'ga-3', title: 'Practice questions & problem sets', frequencyText: '3x / week · 60m', targetMinutesPerDay: 60, adherenceRate: 80 },
      { id: 'ga-4', title: 'Weekly review & self-testing', frequencyText: 'Sundays · 60m', targetMinutesPerDay: 60, adherenceRate: 100 },
    ],
  },
  {
    id: 'goal-2',
    title: 'Launch production capstone software platform & defense',
    category: 'Work',
    targetDate: '2026-11-30',
    progressPercentage: 64,
    consistencyContribution: 85,
    actions: [
      { id: 'ga-5', title: 'Dedicated 90m architecture & coding sprint', frequencyText: 'Weekdays · 90m', targetMinutesPerDay: 90, adherenceRate: 86 },
      { id: 'ga-6', title: 'Write automated unit & integration tests', frequencyText: 'Tue, Thu · 45m', targetMinutesPerDay: 45, adherenceRate: 78 },
    ],
  },
  {
    id: 'goal-3',
    title: 'Build peak cardiovascular stamina & physical conditioning',
    category: 'Fitness',
    targetDate: '2026-12-31',
    progressPercentage: 84,
    consistencyContribution: 94,
    actions: [
      { id: 'ga-7', title: 'Morning strength or Zone 2 conditioning', frequencyText: 'Weekdays · 45m', targetMinutesPerDay: 45, adherenceRate: 94 },
      { id: 'ga-8', title: 'Sleep before 10:30 PM for recovery', frequencyText: 'Daily · 450m', targetMinutesPerDay: 450, adherenceRate: 88 },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'upcoming_activity',
    title: '📚 Engineering Study Session starts in 18 minutes.',
    message: 'Scheduled 4:00 PM – 5:30 PM (90m · Critical Priority). Click START to open the execution timer.',
    timestamp: 'Just now',
    read: false,
    activityId: 'act-3',
  },
  {
    id: 'notif-2',
    type: 'activity_starting',
    title: 'Your Engineering Study Session is starting now.',
    message: 'Time to enter Focus Mode. Notifications muted.',
    timestamp: 'Starting now',
    read: false,
    activityId: 'act-3',
  },
  {
    id: 'notif-3',
    type: 'streak_milestone',
    title: '12-Day Consistency Streak Maintained 🔥',
    message: 'You have stayed consistent with your weighted plan for 12 straight days.',
    timestamp: '2 hours ago',
    read: true,
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'First Day', description: 'Complete your first full daily schedule.', unlocked: true, unlockedDate: '2026-09-02', progress: 1, target: 1, unit: 'day' },
  { id: 'ach-2', title: '7-Day Streak', description: 'Maintain 80%+ consistency for 7 straight days.', unlocked: true, unlockedDate: '2026-10-03', progress: 7, target: 7, unit: 'days' },
  { id: 'ach-3', title: '30-Day Streak', description: 'Maintain sustainable daily momentum for 30 days.', unlocked: false, progress: 12, target: 30, unit: 'days' },
  { id: 'ach-4', title: '100 Completed Activities', description: 'Confirm completion on 100 scheduled activities.', unlocked: true, unlockedDate: '2026-10-06', progress: 114, target: 100, unit: 'activities' },
  { id: 'ach-5', title: '10 Hours Focused', description: 'Log 10 hours in the Activity Execution Timer.', unlocked: true, unlockedDate: '2026-09-14', progress: 38, target: 10, unit: 'hours' },
  { id: 'ach-6', title: 'Consistency Master', description: 'Complete 90%+ weekly consistency across all life areas.', unlocked: false, progress: 86, target: 90, unit: '%' },
];

export const WEEKLY_CONSISTENCY_DATA = [
  { day: 'Mon', date: 'Oct 05', score: 84, completed: 6, total: 7, focusedHours: 5.5 },
  { day: 'Tue', date: 'Oct 06', score: 91, completed: 7, total: 7, focusedHours: 6.2 },
  { day: 'Wed', date: 'Oct 07', score: 76, completed: 5, total: 7, focusedHours: 4.8 },
  { day: 'Thu', date: 'Oct 08', score: 82, completed: 3, total: 6, focusedHours: 4.3 },
  { day: 'Fri', date: 'Oct 09', score: 88, completed: 5, total: 6, focusedHours: 5.0 },
  { day: 'Sat', date: 'Oct 10', score: 94, completed: 5, total: 5, focusedHours: 4.5 },
  { day: 'Sun', date: 'Oct 11', score: 89, completed: 4, total: 4, focusedHours: 3.2 },
];
