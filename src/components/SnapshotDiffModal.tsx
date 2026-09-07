import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { diffStats, diffTexts } from '../lib/text-diff';

type SnapshotLike = { id: string; name: string; text: string; date: string };

export function SnapshotDiffModal({
  currentText,
  snapshots,
  initialId,
  title,
  fromLabel,
  toLabel,
  currentOption,
  emptyLabel,
  addedLabel,
  removedLabel,
  identicalLabel,
  closeLabel,
  onClose,
}: {
  currentText: string;
  snapshots: SnapshotLike[];
  initialId: string;
  title: string;
  fromLabel: string;
  toLabel: string;
  currentOption: string;
  emptyLabel: string;
  addedLabel: (n: number) => string;
  removedLabel: (n: number) => string;
  identicalLabel: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const [fromId, setFromId] = useState(initialId);
  const [toId, setToId] = useState('current');

  const fromText = fromId === 'current' ? currentText : snapshots.find((s) => s.id === fromId)?.text ?? '';
  const toText = toId === 'current' ? currentText : snapshots.find((s) => s.id === toId)?.text ?? '';
  const ops = useMemo(() => diffTexts(fromText, toText), [fromText, toText]);
  const stats = useMemo(() => diffStats(ops), [ops]);
  const identical = fromText === toText;

  return (
    <div className="shortcuts-backdrop" role="presentation" onClick={onClose}>
      <div
        className="snapshot-diff-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-diff-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-head">
          <div>
            <h2 id="snapshot-diff-title">{title}</h2>
            <p>
              {identical
                ? identicalLabel
                : `${addedLabel(stats.added)} · ${removedLabel(stats.removed)}`}
            </p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </div>

        <div className="snapshot-diff-pickers">
          <label>
            {fromLabel}
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="current">{currentOption}</option>
              {snapshots.map((s) => (
                <option key={`from-${s.id}`} value={s.id}>{s.name} · {s.date}</option>
              ))}
            </select>
          </label>
          <label>
            {toLabel}
            <select value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="current">{currentOption}</option>
              {snapshots.map((s) => (
                <option key={`to-${s.id}`} value={s.id}>{s.name} · {s.date}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="snapshot-diff-body">
          {identical ? (
            <p className="snapshot-diff-empty">{emptyLabel}</p>
          ) : (
            <pre>
              {ops.map((op, i) => (
                <span key={`${op.type}-${i}`} className={`diff-${op.type}`}>{op.text}</span>
              ))}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
