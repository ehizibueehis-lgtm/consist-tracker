export type LifeCategory =
  | 'Academics'
  | 'Work'
  | 'Fitness'
  | 'Faith'
  | 'Personal Development'
  | 'Reading'
  | 'Sleep'
  | 'Business'
  | 'Creative Work'
  | 'Other';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ActivityStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'partially_completed'
  | 'missed'
  | 'skipped';

export type RecurrencePattern = 'once' | 'daily' | 'weekdays' | 'weekends' | 'custom';

export type EnergyLevel = 'Low' | 'Medium' | 'High';

export type MoodRating = 'Great' | 'Good' | 'Average' | 'Difficult';

/**
 * Activity Session Model (Section 29)
 * Preserves execution timestamps, duration spent, and focus metrics
 */
export interface ActivitySession {
  id: string;
  activityId: string;
  startedAt: string; // ISO string
  endedAt: string; // ISO string
  durationMinutes: number;
  pomodoroCyclesCompleted?: number;
  completedState: 'full' | 'partial' | 'interrupted';
  sessionNotes?: string;
}

/**
 * Activity Model (Sections 3, 6, 29)
 */
export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  completionPercentage: number;
  category: LifeCategory;
  priority: PriorityLevel;
  recurrence: RecurrencePattern;
  daysOfWeek?: string[]; // ['Mon', 'Tue', ...]
  status: ActivityStatus;
  notes?: string;
  goalId?: string;
  habitId?: string;
  startedAt?: string;
  completedAt?: string;
  timeAdherenceScore?: number; // 0-100
  historySessions?: ActivitySession[];
}

/**
 * Habit Model (Sections 15, 29)
 */
export interface Habit {
  id: string;
  title: string;
  category: LifeCategory;
  frequency: 'daily' | 'specific_days';
  daysOfWeek: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  targetDurationMinutes: number;
  reminderTime: string; // HH:MM
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-100
  completedToday: boolean;
  weekHistory: boolean[]; // Mon..Sun
  goalId?: string;
}

export interface GoalActionItem {
  id: string;
  title: string;
  frequencyText: string;
  targetMinutesPerDay: number;
  adherenceRate: number; // 0-100
}

/**
 * Long-Term Goal Model (Sections 14, 29)
 */
export interface Goal {
  id: string;
  title: string;
  category: LifeCategory;
  targetDate: string;
  progressPercentage: number;
  consistencyContribution: number;
  actions: GoalActionItem[];
}

/**
 * Notifications Model (Sections 5, 24, 29)
 */
export interface NotificationItem {
  id: string;
  type:
    | 'upcoming_activity'
    | 'activity_starting'
    | 'activity_ending'
    | 'missed_activity'
    | 'daily_checkin'
    | 'evening_review'
    | 'weekly_review'
    | 'streak_milestone'
    | 'goal_progress';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  activityId?: string;
  actionTaken?: 'started' | 'snoozed' | 'skipped' | 'rescheduled';
}

/**
 * Daily Check-In & Mood Log (Sections 18, 19, 29)
 */
export interface DailyCheckIn {
  date: string;
  morningIntention: string;
  energyLevel: EnergyLevel;
  eveningMood?: MoodRating;
  blockerReason?: string;
  reflectionNotes?: string;
}

/**
 * Achievements Model (Sections 23, 29)
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  target: number;
  unit: string;
}

/**
 * AI Recommendation Model (Sections 11, 12, 29)
 */
export interface AiScheduleRecommendation {
  id: string;
  title: string;
  reason: string;
  newStartTime: string;
  newDurationMinutes: number;
  accepted: boolean;
}

/**
 * User Preferences & Profile (Sections 25, 29)
 */
export interface UserProfile {
  name: string;
  email: string;
  onboardingCompleted: boolean;
  mainGoals: string[];
  focusAreas: LifeCategory[];
  wakeTime: string;
  sleepTime: string;
  scheduleStrictness: 'strict' | 'balanced' | 'flexible';
  preferredDays: string[];
  currentStreak: number;
  longestStreak: number;
  weeklyStreak: number;
  monthlyConsistency: number;
  theme: 'light' | 'dark';
  weekStartsOn: 'Monday' | 'Sunday';
  timeFormat: '12h' | '24h';
  reminderLeadMinutes: number;
  aiProactivity: 'high' | 'balanced' | 'minimal';
  notificationsEnabled: {
    upcomingActivity: boolean;
    activityStarting: boolean;
    missedActivity: boolean;
    dailyCheckIn: boolean;
    weeklyReview: boolean;
    streakMilestone: boolean;
  };
}

/**
 * Consistency Breakdown Model (Sections 8, 27)
 */
export interface ConsistencyBreakdown {
  overallScore: number;
  completedCount: number;
  partialCount: number;
  missedCount: number;
  skippedCount: number;
  totalScheduled: number;
  priorityWeightedScore: number;
  durationAdherenceScore: number;
  punctualityScore: number;
  streakBonus: number;
  explanation: string[];
}
