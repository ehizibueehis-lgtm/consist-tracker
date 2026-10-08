import React from 'react';
import { NotificationItem, UserProfile, Activity } from '../types';
import { Bell, Play, Clock, SkipForward, Download, RotateCcw, User, Sliders } from 'lucide-react';

interface NotificationsSettingsViewProps {
  activeSubView: 'notifications' | 'settings';
  notifications: NotificationItem[];
  profile: UserProfile;
  activities: Activity[];
  onUpdateProfile: (updated: UserProfile) => void;
  onNotificationAction: (
    notifId: string,
    action: 'start' | 'snooze' | 'skip',
    activityId?: string
  ) => void;
  onTriggerTestReminder: (mode: '10min' | 'now') => void;
  onMarkAllRead: () => void;
  onOpenOnboarding: () => void;
  onResetDemoData: () => void;
}

export const NotificationsSettingsView: React.FC<NotificationsSettingsViewProps> = ({
  activeSubView,
  notifications,
  profile,
  activities,
  onUpdateProfile,
  onNotificationAction,
  onTriggerTestReminder,
  onMarkAllRead,
  onOpenOnboarding,
  onResetDemoData,
}) => {
  const [tab, setTab] = React.useState<'notifications' | 'settings'>(activeSubView);

  const handleExportData = () => {
    const data = { profile, activities, notifications, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consist-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {tab === 'notifications' ? 'Smart Reminders' : 'Settings & Preferences'}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-slate-400 mt-0.5">
            {tab === 'notifications' ? 'Direct execution actions (START, SNOOZE, SKIP).' : 'Customize boundaries, notifications, and data.'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('notifications')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${tab === 'notifications' ? 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-white' : 'text-neutral-500'}`}
          >
            Reminders ({notifications.filter((n) => !n.read).length})
          </button>
          <button
            type="button"
            onClick={() => setTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${tab === 'settings' ? 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-white' : 'text-neutral-500'}`}
          >
            Settings
          </button>
        </div>
      </div>

      {tab === 'notifications' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 flex justify-between items-center">
            <div>
              <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Reminder Action Testing</div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300">Simulate start-time notifications:</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onTriggerTestReminder('10min')}
                className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-indigo-200 text-indigo-700 dark:text-indigo-300"
              >
                10m Before Alert
              </button>
              <button
                type="button"
                onClick={() => onTriggerTestReminder('now')}
                className="px-3 py-1.5 rounded-xl text-xs bg-indigo-600 text-white font-semibold"
              >
                Starting Now Alert
              </button>
              <button
                type="button"
                onClick={onMarkAllRead}
                className="px-2 py-1.5 text-xs text-neutral-500"
              >
                Mark Read
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl divide-y divide-neutral-200 dark:divide-slate-800">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono text-neutral-400 uppercase">{n.timestamp}</div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">{n.title}</div>
                  <div className="text-xs text-neutral-500">{n.message}</div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onNotificationAction(n.id, 'start', n.activityId)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" /> START
                  </button>
                  <button
                    type="button"
                    onClick={() => onNotificationAction(n.id, 'snooze', n.activityId)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" /> SNOOZE
                  </button>
                  <button
                    type="button"
                    onClick={() => onNotificationAction(n.id, 'skip', n.activityId)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-neutral-300 dark:border-slate-700 text-neutral-500 flex items-center gap-1"
                  >
                    <SkipForward className="w-3 h-3" /> SKIP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Profile & Daily Window
              </h2>
              <button type="button" onClick={onOpenOnboarding} className="text-xs text-indigo-600 font-semibold hover:underline">
                Re-run Onboarding
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 mb-1">Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Wake Time</label>
                  <input
                    type="time"
                    value={profile.wakeTime}
                    onChange={(e) => onUpdateProfile({ ...profile, wakeTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 font-mono text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Sleep Time</label>
                  <input
                    type="time"
                    value={profile.sleepTime}
                    onChange={(e) => onUpdateProfile({ ...profile, sleepTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-3 py-2 font-mono text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-600" /> Data & Local Storage
            </h2>

            <p className="text-xs text-neutral-500 leading-relaxed">
              CONSIST preserves your complete session history locally in your browser. Export or restore defaults anytime.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Data (.JSON)
              </button>
              <button
                type="button"
                onClick={onResetDemoData}
                className="px-4 py-2 rounded-xl text-xs border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Default Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
