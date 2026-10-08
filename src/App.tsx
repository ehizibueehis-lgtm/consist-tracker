import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Habit,
  Goal,
  NotificationItem,
  DailyCheckIn,
  Achievement,
  UserProfile,
  EnergyLevel,
} from './types';
import {
  calculateDailyConsistency,
  formatTimeDisplay,
  INITIAL_ACTIVITIES,
  INITIAL_ACHIEVEMENTS,
  INITIAL_GOALS,
  INITIAL_HABITS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USER_PROFILE,
  minutesToTime,
  timeToMinutes,
  TODAY_DATE,
} from './utils/consistency';
import { OnboardingModal } from './components/OnboardingModal';
import { ExecutionFocusModal } from './components/ExecutionFocusModal';
import { PlannerView } from './components/PlannerView';
import { CalendarView } from './components/CalendarView';
import { HabitsGoalsView } from './components/HabitsGoalsView';
import { AnalyticsCoachView } from './components/AnalyticsCoachView';
import { NotificationsSettingsView } from './components/NotificationsSettingsView';
import {
  LayoutDashboard,
  ListTodo,
  Calendar as CalendarIcon,
  Target,
  BarChart3,
  Bell,
  Settings,
  Play,
  CheckCircle2,
  Flame,
  Sparkles,
  Sun,
  Moon,
  Clock,
  SkipForward,
  Info,
  ArrowRight,
  Plus,
} from 'lucide-react';

type ActiveSection =
  | 'dashboard'
  | 'planner'
  | 'calendar'
  | 'habits_goals'
  | 'analytics'
  | 'notifications'
  | 'settings';

export function App() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('consist_profile_v2');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('consist_activities_v2');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('consist_habits_v2');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('consist_goals_v2');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('consist_notifications_v2');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [achievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_DATE);

  // Focus Modal
  const [executingActivity, setExecutingActivity] = useState<Activity | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('High');

  useEffect(() => {
    localStorage.setItem('consist_profile_v2', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('consist_activities_v2', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('consist_habits_v2', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('consist_goals_v2', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('consist_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const root = document.documentElement;
    if (profile.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [profile.theme]);

  const triggerCelebration = (msg: string) => {
    setCelebrationToast(msg);
    setTimeout(() => {
      setCelebrationToast((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const todayActivities = useMemo(
    () =>
      activities
        .filter((a) => a.date === TODAY_DATE)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [activities]
  );

  const consistency = useMemo(
    () => calculateDailyConsistency(todayActivities, profile.currentStreak),
    [todayActivities, profile.currentStreak]
  );

  // Section 27: Next Activity
  const nextActivity = useMemo(() => {
    return (
      todayActivities.find((a) => a.status === 'in_progress') ||
      todayActivities.find((a) => a.status === 'scheduled') ||
      todayActivities[0]
    );
  }, [todayActivities]);

  const unreadReminder = useMemo(
    () =>
      notifications.find(
        (n) =>
          !n.read &&
          (n.type === 'upcoming_activity' ||
            n.type === 'activity_starting' ||
            n.type === 'missed_activity')
      ),
    [notifications]
  );

  const handleStartActivity = (act: Activity) => {
    const updated: Activity = {
      ...act,
      status: 'in_progress',
      startedAt: act.startedAt || new Date().toTimeString().slice(0, 5),
    };
    setActivities((prev) => prev.map((a) => (a.id === act.id ? updated : a)));
    setExecutingActivity(updated);
    triggerCelebration(`Started "${act.title}" · Focus timer running`);
  };

  const handleUpdateActivity = (updated: Activity, celebrationMsg?: string) => {
    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (executingActivity?.id === updated.id) {
      setExecutingActivity(updated);
    }
    if (celebrationMsg) {
      triggerCelebration(celebrationMsg);
    }
  };

  const handleNotificationAction = (
    notifId: string,
    action: 'start' | 'snooze' | 'skip',
    activityId?: string
  ) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId
          ? {
              ...n,
              read: true,
              actionTaken:
                action === 'start' ? 'started' : action === 'snooze' ? 'snoozed' : 'skipped',
            }
          : n
      )
    );

    const target = activities.find((a) => a.id === activityId) || nextActivity;
    if (!target) return;

    if (action === 'start') {
      handleStartActivity(target);
    } else if (action === 'snooze') {
      const sStart = minutesToTime(timeToMinutes(target.startTime) + 10);
      const sEnd = minutesToTime(timeToMinutes(target.endTime) + 10);
      handleUpdateActivity(
        { ...target, startTime: sStart, endTime: sEnd },
        `Snoozed "${target.title}" by 10 minutes`
      );
    } else if (action === 'skip') {
      handleUpdateActivity({ ...target, status: 'skipped' }, `Skipped "${target.title}"`);
    }
  };

  const handleTriggerTestReminder = (mode: '10min' | 'now') => {
    const target = nextActivity || todayActivities[0];
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: mode === '10min' ? 'upcoming_activity' : 'activity_starting',
      title:
        mode === '10min'
          ? `📚 ${target?.title || 'Study Session'} starts in 18 minutes.`
          : `Your ${target?.title || 'Study Session'} is starting now.`,
      message:
        mode === '10min'
          ? `Scheduled ${target?.startTime || '16:00'} – ${target?.endTime || '17:30'}. Get ready to enter Focus Mode.`
          : `Click START to begin execution timer, SNOOZE (+10m), or SKIP.`,
      timestamp: 'Just now',
      read: false,
      activityId: target?.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    triggerCelebration(newNotif.title);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#090D16] text-neutral-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header Contract */}
      <header className="sticky top-0 z-30 h-15 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white"
        >
          CONSIST
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-slate-300">
          {[
            { id: 'dashboard', label: 'Home' },
            { id: 'planner', label: 'Daily Plan' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'habits_goals', label: 'Habits & Goals' },
            { id: 'analytics', label: 'Coach & Review' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection(item.id as ActiveSection);
              }}
              className={`py-1 transition-colors ${
                activeSection === item.id
                  ? 'text-indigo-600 dark:text-indigo-400 underline underline-offset-8 decoration-2'
                  : 'hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveSection('planner')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            PLAN MY DAY
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4">
          <div className="space-y-6">
            <div className="space-y-1">
              {[
                { id: 'dashboard', label: 'Home Screen', icon: LayoutDashboard },
                { id: 'planner', label: 'Daily Plan & AI', icon: ListTodo },
                { id: 'calendar', label: 'Calendar Grid', icon: CalendarIcon },
                { id: 'habits_goals', label: 'Habits & Goals', icon: Target },
                { id: 'analytics', label: 'Coach & Review', icon: BarChart3 },
                {
                  id: 'notifications',
                  label: `Smart Reminders (${notifications.filter((n) => !n.read).length})`,
                  icon: Bell,
                },
                { id: 'settings', label: 'Settings & Data', icon: Settings },
              ].map((nav) => {
                const Icon = nav.icon;
                const active = activeSection === nav.id;
                return (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => setActiveSection(nav.id as ActiveSection)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Philosophy Box (Section 30) */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 space-y-1.5 text-xs">
              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                CORE PHILOSOPHY
              </span>
              <p className="text-[11px] font-mono text-neutral-600 dark:text-slate-400 leading-snug">
                PLAN → REMEMBER → START → FOCUS → COMPLETE → TRACK → ANALYZE → IMPROVE
              </p>
              <p className="text-[11px] text-neutral-500 italic pt-1">
                “Plan it. Start it. Finish it. Become consistent.”
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">{profile.name}</div>
              <div className="text-[11px] font-mono text-neutral-500">🔥 {profile.currentStreak}d Streak</div>
            </div>
            <button
              type="button"
              onClick={() =>
                setProfile((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
              }
              aria-label="Toggle theme"
              className="p-2 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300"
            >
              {profile.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-20 lg:pb-10">
          {celebrationToast && (
            <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{celebrationToast}</span>
              </div>
              <span className="font-mono text-[11px] opacity-90">UPDATED IMMEDIATELY</span>
            </div>
          )}

          {unreadReminder && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> SMART REMINDER
                </div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">{unreadReminder.title}</div>
                <div className="text-xs text-neutral-500">{unreadReminder.message}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleNotificationAction(unreadReminder.id, 'start', unreadReminder.activityId)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" /> START
                </button>
                <button
                  type="button"
                  onClick={() => handleNotificationAction(unreadReminder.id, 'snooze', unreadReminder.activityId)}
                  className="px-3 py-1.5 rounded-xl text-xs border border-neutral-300 dark:border-slate-700"
                >
                  SNOOZE
                </button>
                <button
                  type="button"
                  onClick={() => handleNotificationAction(unreadReminder.id, 'skip', unreadReminder.activityId)}
                  className="px-3 py-1.5 rounded-xl text-xs border border-neutral-300 dark:border-slate-700 text-neutral-500"
                >
                  SKIP
                </button>
              </div>
            </div>
          )}

          {/* SECTION 27: EXACT HOME SCREEN DESIGN */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Greeting Header (Section 27) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    GOOD MORNING 👋
                  </h1>
                  <p className="text-sm text-neutral-600 dark:text-slate-400 font-medium mt-0.5">
                    “Let's make today count.”
                  </p>
                </div>

                {/* Prominent PLAN MY DAY button (Section 27) */}
                <button
                  type="button"
                  onClick={() => setActiveSection('planner')}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  PLAN MY DAY
                </button>
              </div>

              {/* Top Metrics Row: TODAY'S CONSISTENCY, CURRENT STREAK, NEXT ACTIVITY (Section 27) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. TODAY'S CONSISTENCY */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-mono text-neutral-500 dark:text-slate-400 uppercase">
                    TODAY'S CONSISTENCY
                  </span>
                  <div className="text-4xl font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                    {consistency.overallScore}%
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${consistency.overallScore}%` }} />
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    {consistency.completedCount} of {consistency.totalScheduled} completed
                  </div>
                </div>

                {/* 2. CURRENT STREAK */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-mono text-neutral-500 dark:text-slate-400 uppercase">
                    CURRENT STREAK
                  </span>
                  <div className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 tabular-nums">
                    <Flame className="w-7 h-7" />
                    {profile.currentStreak} DAYS
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-slate-400">
                    Longest streak: {profile.longestStreak} days
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Sustainable momentum active
                  </div>
                </div>

                {/* 3. NEXT ACTIVITY */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono text-neutral-500 dark:text-slate-400 uppercase">
                      NEXT ACTIVITY
                    </span>
                    <div className="text-base font-bold text-neutral-900 dark:text-white truncate mt-1">
                      {nextActivity ? nextActivity.title : 'All activities completed'}
                    </div>
                    <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {nextActivity?.status === 'in_progress' ? '▶ In Progress (1:24:35 remaining)' : 'Starts in 18 minutes'}
                    </div>
                  </div>

                  {nextActivity && (
                    <button
                      type="button"
                      onClick={() => handleStartActivity(nextActivity)}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {nextActivity.status === 'in_progress' ? 'Open Focus Screen' : 'START NOW'}
                    </button>
                  )}
                </div>
              </div>

              {/* TODAY'S PLAN (Section 27) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-wide uppercase font-mono">
                    TODAY'S PLAN
                  </h2>
                  <span className="text-xs font-mono text-neutral-500">
                    {formatTimeDisplay(profile.wakeTime, profile.timeFormat)} – {formatTimeDisplay(profile.sleepTime, profile.timeFormat)}
                  </span>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-slate-800/80 font-mono text-sm">
                  {todayActivities.map((act) => {
                    const icon =
                      act.status === 'completed'
                        ? '✓'
                        : act.status === 'in_progress'
                        ? '▶'
                        : '○';
                    return (
                      <div
                        key={act.id}
                        className={`py-3 flex items-center justify-between gap-3 ${
                          act.status === 'in_progress'
                            ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                            : act.status === 'completed'
                            ? 'text-neutral-400 dark:text-slate-500 line-through'
                            : 'text-neutral-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-base shrink-0 font-bold">{icon}</span>
                          <span className="truncate">{act.title}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-neutral-400 tabular-nums">
                            {formatTimeDisplay(act.startTime, profile.timeFormat)}
                          </span>
                          {act.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleStartActivity(act)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-slate-900"
                            >
                              START
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'planner' && (
            <PlannerView
              activities={activities}
              goals={goals}
              selectedDate={selectedDate}
              onChangeDate={setSelectedDate}
              wakeTime={profile.wakeTime}
              sleepTime={profile.sleepTime}
              strictness={profile.scheduleStrictness}
              energyLevel={energyLevel}
              timeFormat={profile.timeFormat}
              onStartActivity={handleStartActivity}
              onUpdateActivity={handleUpdateActivity}
              onAddActivities={(items, msg) => {
                setActivities((prev) => [...prev, ...items]);
                if (msg) triggerCelebration(msg);
              }}
              onDeleteActivity={(id) => {
                setActivities((prev) => prev.filter((a) => a.id !== id));
                triggerCelebration('Activity deleted');
              }}
              onReplaceActivities={(list, msg) => {
                setActivities(list);
                if (msg) triggerCelebration(msg);
              }}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarView
              activities={activities}
              selectedDate={selectedDate}
              onChangeDate={setSelectedDate}
              timeFormat={profile.timeFormat}
              onUpdateActivity={handleUpdateActivity}
              onStartActivity={handleStartActivity}
            />
          )}

          {activeSection === 'habits_goals' && (
            <HabitsGoalsView
              habits={habits}
              goals={goals}
              timeFormat={profile.timeFormat}
              onToggleHabitToday={(id) => {
                setHabits((prev) =>
                  prev.map((h) => (h.id === id ? { ...h, completedToday: !h.completedToday } : h))
                );
                triggerCelebration('Habit logged');
              }}
              onToggleHabitWeekDay={(id, idx) => {
                setHabits((prev) =>
                  prev.map((h) => {
                    if (h.id !== id) return h;
                    const hist = [...h.weekHistory];
                    hist[idx] = !hist[idx];
                    return { ...h, weekHistory: hist };
                  })
                );
              }}
              onAddHabit={(h) => {
                setHabits((prev) => [...prev, h]);
                triggerCelebration(`Added habit "${h.title}"`);
              }}
              onAddGoal={(g) => {
                setGoals((prev) => [...prev, g]);
                triggerCelebration(`Added goal "${g.title}"`);
              }}
            />
          )}

          {activeSection === 'analytics' && (
            <AnalyticsCoachView
              activities={activities}
              habits={habits}
              achievements={achievements}
              checkIns={[]}
              currentStreak={profile.currentStreak}
              longestStreak={profile.longestStreak}
              onAcceptScheduleRecommendation={(rec) => {
                setActivities((prev) => {
                  const targetIdx = prev.findIndex((a) => a.date === TODAY_DATE);
                  if (targetIdx === -1) return prev;
                  const copy = [...prev];
                  copy[targetIdx] = {
                    ...copy[targetIdx],
                    startTime: rec.newStartTime,
                    notes: `AI Recommendation: ${rec.title}`,
                  };
                  return copy;
                });
                triggerCelebration(`Accepted recommendation: ${rec.title}`);
              }}
            />
          )}

          {(activeSection === 'notifications' || activeSection === 'settings') && (
            <NotificationsSettingsView
              activeSubView={activeSection === 'settings' ? 'settings' : 'notifications'}
              notifications={notifications}
              profile={profile}
              activities={activities}
              onUpdateProfile={(up) => {
                setProfile(up);
                triggerCelebration('Profile updated');
              }}
              onNotificationAction={handleNotificationAction}
              onTriggerTestReminder={handleTriggerTestReminder}
              onMarkAllRead={() =>
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
              }
              onOpenOnboarding={() => setShowOnboarding(true)}
              onResetDemoData={() => {
                setProfile(INITIAL_USER_PROFILE);
                setActivities(INITIAL_ACTIVITIES);
                setHabits(INITIAL_HABITS);
                setGoals(INITIAL_GOALS);
                setNotifications(INITIAL_NOTIFICATIONS);
                triggerCelebration('Default data restored');
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-neutral-200 dark:border-slate-800 flex items-center justify-around px-2">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'planner', label: 'Plan', icon: ListTodo },
          { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
          { id: 'habits_goals', label: 'Habits', icon: Target },
          { id: 'analytics', label: 'Coach', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as ActiveSection)}
              className={`flex flex-col items-center justify-center py-1 px-2 text-[11px] ${
                active ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-neutral-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        profile={profile}
        onSave={(up) => {
          setProfile(up);
          triggerCelebration('Onboarding updated');
        }}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Focused Activity Execution Modal (Section 28) */}
      <ExecutionFocusModal
        activity={executingActivity}
        timeFormat={profile.timeFormat}
        onClose={() => setExecutingActivity(null)}
        onUpdateActivity={handleUpdateActivity}
      />
    </div>
  );
}

export default App;
