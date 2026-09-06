import React, { useState, useEffect } from 'react';
import { Target, Flame, CheckCircle, Trophy, X } from 'lucide-react';
import { type Language } from '../i18n';
import { updatePrefs } from '../api';

interface GoalTrackerProps {
  currentWords: number;
  lang: Language;
  target: number;
  onTargetChange: (n: number) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProgress?: (wordsToday: number) => void;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  currentWords,
  lang,
  target,
  onTargetChange,
  isOpen,
  onOpenChange,
  onProgress,
}) => {
  const [customInput, setCustomInput] = useState(String(target));
  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('lipishilpo_streak_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const [wordsToday, setWordsToday] = useState<number>(0);

  useEffect(() => {
    setCustomInput(String(target));
  }, [target]);

  useEffect(() => {
    try {
      const key = `lipishilpo_start_words_${todayStr}`;
      const startRecord = localStorage.getItem(key);
      if (startRecord === null) {
        localStorage.setItem(key, String(currentWords));
        setWordsToday(0);
        onProgress?.(0);
        return;
      }
      const start = parseInt(startRecord, 10) || 0;
      const diff = Math.max(0, currentWords - start);
      setWordsToday(diff);
      onProgress?.(diff);

      if (diff >= target && target > 0) {
        const lastStreakDate = localStorage.getItem('lipishilpo_last_streak_date');
        if (lastStreakDate !== todayStr) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('lipishilpo_streak_count', String(newStreak));
          localStorage.setItem('lipishilpo_last_streak_date', todayStr);
          updatePrefs({ streak: newStreak, lastStreakDate: todayStr }).catch(() => {});
        }
      }
    } catch {}
  }, [currentWords, target, todayStr, streak, onProgress]);

  function handleSaveTarget(newVal: number) {
    const valid = Math.max(50, newVal);
    onTargetChange(valid);
    try {
      localStorage.setItem('lipishilpo_daily_target', String(valid));
    } catch {}
    onOpenChange(false);
  }

  const percent = target > 0 ? Math.min(100, Math.round((wordsToday / target) * 100)) : 0;
  const isGoalMet = percent >= 100;

  function toBn(num: number): string {
    return lang === 'bn' ? num.toLocaleString('bn-BD') : num.toLocaleString('en-US');
  }

  return (
    <>
      <button
        type="button"
        className={'goal-widget-btn ' + (isGoalMet ? 'goal-met' : '')}
        onClick={() => onOpenChange(true)}
        title={lang === 'bn' ? `আজকের লক্ষ্য: ${toBn(wordsToday)} / ${toBn(target)} শব্দ` : `Today's Goal: ${toBn(wordsToday)} / ${toBn(target)} words`}
      >
        <div className="goal-ring-mini">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path
              className="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="circle"
              strokeDasharray={`${percent}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="goal-icon-inside">{isGoalMet ? <CheckCircle size={11} color="#10b981" /> : <Target size={11} />}</span>
        </div>

        <span className="goal-label-text">
          <strong>{toBn(wordsToday)}</strong> / {toBn(target)}
        </span>

        {streak > 0 && (
          <span className="streak-badge" title={lang === 'bn' ? `${toBn(streak)} দিন টানা লেখার ধারাবাহিকতা` : `${toBn(streak)} days writing streak`}>
            <Flame size={12} color="#f59e0b" /> {toBn(streak)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={() => onOpenChange(false)}>
          <div className="modal-box goal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-flex">
                <Target size={20} color="#20644f" />
                <h3>{lang === 'bn' ? 'দৈনিক লেখার লক্ষ্য ও স্ট্রিক' : 'Daily Writing Goal & Streak'}</h3>
              </div>
              <button className="close-btn" onClick={() => onOpenChange(false)}><X size={18} /></button>
            </div>

            <div className="goal-progress-card">
              <div className="goal-progress-header">
                <span>{lang === 'bn' ? 'আজকের অর্জন:' : "Today's Progress:"}</span>
                <strong>{toBn(wordsToday)} / {toBn(target)} {lang === 'bn' ? 'শব্দ' : 'words'} ({toBn(percent)}%)</strong>
              </div>
              <div className="goal-progress-bar-bg">
                <div className="goal-progress-bar-fill" style={{ width: `${percent}%` }} />
              </div>
              {isGoalMet && (
                <div className="goal-congrats-note">
                  <Trophy size={16} color="#f59e0b" />
                  <span>{lang === 'bn' ? 'অভিনন্দন! আপনি আজকের লেখার লক্ষ্য পূরণ করেছেন।' : 'Congratulations! You reached your daily writing goal.'}</span>
                </div>
              )}
            </div>

            <div className="goal-presets-section">
              <label>{lang === 'bn' ? 'নতুন লক্ষ্য নির্বাচন করুন:' : 'Set daily target:'}</label>
              <div className="goal-presets-grid">
                {[250, 500, 1000, 1500, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={'goal-preset-btn ' + (target === val ? 'active' : '')}
                    onClick={() => handleSaveTarget(val)}
                  >
                    {toBn(val)} {lang === 'bn' ? 'শব্দ' : 'words'}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="custom-goal-form"
              onSubmit={(e) => {
                e.preventDefault();
                const p = parseInt(customInput, 10);
                if (p > 0) handleSaveTarget(p);
              }}
            >
              <label>{lang === 'bn' ? 'অথবা কাস্টম শব্দ সংখ্যা লিখুন:' : 'Or enter custom word count:'}</label>
              <div className="custom-input-group">
                <input
                  type="number"
                  min="50"
                  max="50000"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. 750"
                />
                <button type="submit" className="primary">
                  {lang === 'bn' ? 'সেভ করুন' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
