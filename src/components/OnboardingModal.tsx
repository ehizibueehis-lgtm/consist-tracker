import React, { useState } from 'react';
import { LifeCategory, UserProfile, Activity } from '../types';
import { TODAY_DATE } from '../utils/consistency';
import { Check, ArrowRight, ArrowLeft, X, Clock, Calendar, Target, Layers } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile, newRecurringActivities: Activity[]) => void;
  onClose: () => void;
}

const ALL_CATEGORIES: LifeCategory[] = [
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

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  profile,
  onSave,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [goalsText, setGoalsText] = useState(profile.mainGoals.join('\n'));
  const [selectedAreas, setSelectedAreas] = useState<LifeCategory[]>(profile.focusAreas);
  const [wakeTime, setWakeTime] = useState(profile.wakeTime);
  const [sleepTime, setSleepTime] = useState(profile.sleepTime);
  const [recurringActivitiesText, setRecurringActivitiesText] = useState(
    'Morning devotion — 30 minutes\nExercise — 45 minutes\nStudy Engineering — 2 hours\nReview the day — 30 minutes'
  );
  const [strictness, setStrictness] = useState<'strict' | 'balanced' | 'flexible'>(
    profile.scheduleStrictness
  );
  const [preferredDays, setPreferredDays] = useState<string[]>(profile.preferredDays);

  if (!isOpen) return null;

  const toggleArea = (cat: LifeCategory) => {
    setSelectedAreas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleDay = (day: string) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFinish = () => {
    const parsedGoals = goalsText
      .split('\n')
      .map((g) => g.trim())
      .filter(Boolean);

    const updatedProfile: UserProfile = {
      ...profile,
      onboardingCompleted: true,
      mainGoals: parsedGoals.length > 0 ? parsedGoals : profile.mainGoals,
      focusAreas: selectedAreas.length > 0 ? selectedAreas : profile.focusAreas,
      wakeTime,
      sleepTime,
      scheduleStrictness: strictness,
      preferredDays: preferredDays.length > 0 ? preferredDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    };

    onSave(updatedProfile, []);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
              STEP 0{step} OF 07 · ONBOARDING WIZARD
            </span>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mt-0.5">
              Build Your Daily Consistency Foundation
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white whitespace-nowrap"
            >
              Skip & Configure Later
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-neutral-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 transition-all duration-200"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Target className="w-5 h-5" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  1. What are your main goals?
                </h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-slate-400">
                Enter your core objectives (one per line):
              </p>
              <textarea
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                rows={4}
                placeholder="Pass all engineering courses with excellent grades&#10;Ship my software project by November&#10;Exercise 4 times every week"
                className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 p-3.5 text-sm text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  2. What areas of your life do you want to improve?
                </h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-slate-400">
                Select your focus areas:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ALL_CATEGORIES.map((cat) => {
                  const active = selectedAreas.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleArea(cat)}
                      className={`px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium transition-colors flex items-center justify-between ${
                        active
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                          : 'border-neutral-200 dark:border-slate-800 text-neutral-700 dark:text-slate-300 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {active && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-5 h-5" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  3. What time do you normally wake up?
                </h3>
              </div>
              <div className="max-w-xs">
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-4 py-2.5 text-base font-mono text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-5 h-5" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  4. What time do you normally sleep?
                </h3>
              </div>
              <div className="max-w-xs">
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 px-4 py-2.5 text-base font-mono text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                5. What recurring activities do you want to maintain?
              </h3>
              <textarea
                rows={4}
                value={recurringActivitiesText}
                onChange={(e) => setRecurringActivitiesText(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 p-3.5 text-sm text-neutral-900 dark:text-white"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                6. How strict or flexible should your schedule be?
              </h3>
              <div className="space-y-2.5">
                {[
                  { id: 'strict' as const, title: 'Strict', desc: 'Exact time blocks with minimal buffers.' },
                  { id: 'balanced' as const, title: 'Balanced (Recommended)', desc: 'Reasonable breaks between demanding activities.' },
                  { id: 'flexible' as const, title: 'Flexible', desc: 'Adaptable buffers around energy levels.' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStrictness(opt.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      strictness === opt.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50'
                        : 'border-neutral-200 dark:border-slate-800 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">{opt.title}</div>
                    <div className="text-xs text-neutral-600 dark:text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  7. What days of the week should particular activities occur?
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const active = preferredDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-neutral-200 dark:border-slate-800 text-neutral-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-slate-800 flex items-center justify-between bg-neutral-50/60 dark:bg-slate-900/60">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-slate-300 border border-neutral-300 dark:border-slate-700 rounded-xl hover:bg-neutral-100 disabled:opacity-40 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Save Configuration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
