import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Volume2, Coffee, Sparkles, X } from 'lucide-react';
import { type Language } from '../i18n';

interface PomodoroTimerProps {
  lang: Language;
}

type Mode = 'work' | 'shortBreak' | 'longBreak';

const DURATIONS: Record<Mode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ lang }) => {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function playChime() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playChime();

            if (mode === 'work') {
              setSessionsCompleted((s) => s + 1);
              setMode('shortBreak');
              return DURATIONS.shortBreak;
            } else {
              setMode('work');
              return DURATIONS.work;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  function switchMode(newMode: Mode) {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
  }

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(DURATIONS[mode]);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  function toBn(num: number): string {
    return lang === 'bn' ? num.toLocaleString('bn-BD') : num.toLocaleString('en-US');
  }

  return (
    <>
      <button
        type="button"
        className={'pomodoro-pill-btn ' + (isRunning ? 'running' : '')}
        onClick={() => setIsOpen(true)}
        title={lang === 'bn' ? 'পোমোডোরো রাইটিং স্প্রিন্ট টাইমার' : 'Pomodoro Writing Sprint Timer'}
      >
        <Clock size={13} />
        <span>{timeStr}</span>
        {sessionsCompleted > 0 && (
          <span className="pomo-count-tag" title={lang === 'bn' ? `${toBn(sessionsCompleted)}টি সেশন সম্পন্ন` : `${sessionsCompleted} sessions completed`}>
            ✓{toBn(sessionsCompleted)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="modal-box pomodoro-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-flex">
                <Clock size={20} color="#20644f" />
                <h3>{lang === 'bn' ? 'পোমোডোরো স্প্রিন্ট টাইমার' : 'Pomodoro Focus Timer'}</h3>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}><X size={18} /></button>
            </div>

            {/* Mode Tabs */}
            <div className="pomo-mode-tabs">
              <button
                type="button"
                className={'pomo-tab ' + (mode === 'work' ? 'active' : '')}
                onClick={() => switchMode('work')}
              >
                <Sparkles size={14} /> {lang === 'bn' ? 'রাইটিং স্প্রিন্ট (২৫ মি.)' : 'Writing (25m)'}
              </button>
              <button
                type="button"
                className={'pomo-tab ' + (mode === 'shortBreak' ? 'active' : '')}
                onClick={() => switchMode('shortBreak')}
              >
                <Coffee size={14} /> {lang === 'bn' ? 'ছোট বিরতি (৫ মি.)' : 'Short Break (5m)'}
              </button>
              <button
                type="button"
                className={'pomo-tab ' + (mode === 'longBreak' ? 'active' : '')}
                onClick={() => switchMode('longBreak')}
              >
                <Coffee size={14} /> {lang === 'bn' ? 'বড় বিরতি (১৫ মি.)' : 'Long Break (15m)'}
              </button>
            </div>

            {/* Big Countdown Display */}
            <div className="pomo-display-card">
              <div className="pomo-big-digits">{timeStr}</div>
              <div className="pomo-mode-label">
                {mode === 'work'
                  ? (lang === 'bn' ? 'মনোযোগ দিয়ে লিখুন...' : 'Focus & Write...')
                  : (lang === 'bn' ? 'একটু বিশ্রাম নিন ও চা/কফি খান...' : 'Take a breath & stretch...')}
              </div>
            </div>

            {/* Actions */}
            <div className="pomo-control-actions">
              <button
                type="button"
                className={'pomo-main-btn ' + (isRunning ? 'pause' : 'start')}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                <span>{isRunning ? (lang === 'bn' ? 'থামুন' : 'Pause') : (lang === 'bn' ? 'শুরু করুন' : 'Start Focus')}</span>
              </button>

              <button type="button" className="pomo-reset-btn" onClick={handleReset} title="Reset">
                <RotateCcw size={16} />
                <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>
            </div>

            <div className="pomo-stats-footer">
              <span>{lang === 'bn' ? 'আজ সম্পন্ন সেশন:' : 'Completed Sessions:'} <strong>{toBn(sessionsCompleted)}</strong></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
