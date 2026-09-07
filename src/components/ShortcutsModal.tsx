type ShortcutRow = { keys: string[]; label: string };

export function ShortcutsModal({
  title,
  hint,
  closeLabel,
  groups,
  onClose,
  replayLabel,
  replayHint,
  onReplayTour,
}: {
  title: string;
  hint: string;
  closeLabel: string;
  groups: Array<{ heading: string; rows: ShortcutRow[] }>;
  onClose: () => void;
  replayLabel?: string;
  replayHint?: string;
  onReplayTour?: () => void;
}) {
  return (
    <div className="shortcuts-backdrop" role="presentation" onClick={onClose}>
      <div
        className="shortcuts-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-head">
          <div>
            <h2 id="shortcuts-title">{title}</h2>
            <p>{hint}</p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        <div className="shortcuts-grid">
          {groups.map((group) => (
            <section key={group.heading}>
              <h3>{group.heading}</h3>
              <ul>
                {group.rows.map((row) => (
                  <li key={row.label}>
                    <span>{row.label}</span>
                    <span className="shortcuts-keys">
                      {row.keys.map((key) => (
                        <kbd key={key}>{key}</kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {onReplayTour && replayLabel && (
          <div className="shortcuts-foot">
            {replayHint && <p>{replayHint}</p>}
            <button type="button" className="secondary" onClick={onReplayTour}>
              {replayLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
