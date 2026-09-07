import { useEffect, useState } from 'react';

export type TourStep = {
  target: string;
  title: string;
  body: string;
};

export function OnboardingTour({
  step,
  steps,
  nextLabel,
  backLabel,
  skipLabel,
  doneLabel,
  stepLabel,
  onNext,
  onBack,
  onSkip,
}: {
  step: number;
  steps: TourStep[];
  nextLabel: string;
  backLabel: string;
  skipLabel: string;
  doneLabel: string;
  stepLabel: (current: number, total: number) => string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const current = steps[step];
  const [box, setBox] = useState<DOMRect | null>(null);

  useEffect(() => {
    function measure() {
      if (!current) return;
      const nodes = document.querySelectorAll(`[data-tour="${current.target}"]`);
      let next: DOMRect | null = null;
      nodes.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        const rect = el.getBoundingClientRect();
        if (rect.width > 8 && rect.height > 8) next = rect;
      });
      setBox(next);
    }
    measure();
    const timer = window.setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [current]);

  if (!current) return null;
  const last = step === steps.length - 1;
  const pad = 8;
  const cardLeft = box
    ? Math.min(window.innerWidth - 360, Math.max(16, box.left))
    : Math.max(16, (window.innerWidth - 340) / 2);
  const below = box ? box.bottom + 14 : 80;
  const cardTop = box
    ? (below + 210 > window.innerHeight ? Math.max(16, box.top - 210) : below)
    : Math.max(80, (window.innerHeight - 200) / 2);

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-dim" onClick={onSkip} />
      {box && (
        <div
          className="tour-spot"
          style={{
            top: Math.max(8, box.top - pad),
            left: Math.max(8, box.left - pad),
            width: box.width + pad * 2,
            height: box.height + pad * 2,
          }}
        />
      )}
      <div className="tour-card" style={{ top: cardTop, left: cardLeft }}>
        <p className="tour-step">{stepLabel(step + 1, steps.length)}</p>
        <h2 id="tour-title">{current.title}</h2>
        <p>{current.body}</p>
        <div className="tour-actions">
          <button type="button" className="secondary" onClick={onSkip}>{skipLabel}</button>
          <div>
            {step > 0 && (
              <button type="button" className="secondary" onClick={onBack}>{backLabel}</button>
            )}
            <button type="button" className="primary" onClick={onNext}>
              {last ? doneLabel : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
