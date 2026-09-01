import type { Severity, CaptureStatus } from '../../types';

// ── Severity Badge ──────────────────────────────────────────
interface SeverityBadgeProps {
  severity: Severity;
  showDot?: boolean;
}

export function SeverityBadge({ severity, showDot = true }: SeverityBadgeProps) {
  const safeSeverity = severity || 'UNKNOWN';
  const cls = safeSeverity.toLowerCase();
  return (
    <span className={`badge badge-${cls}`}>
      {showDot && <span className="badge-dot" />}
      {safeSeverity}
    </span>
  );
}

// ── Status Badge ────────────────────────────────────────────
interface StatusBadgeProps {
  status: CaptureStatus;
}

const STATUS_LABELS: Record<CaptureStatus, string> = {
  uploaded:   'Uploaded',
  processing: 'Processing',
  completed:  'Completed',
  failed:     'Failed',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'processing' && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'currentColor',
            display: 'inline-block',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Confidence Meter ────────────────────────────────────────
interface ConfidenceMeterProps {
  value: number; // 0–1
  label?: string;
}

export function ConfidenceMeter({ value, label = 'Confidence' }: ConfidenceMeterProps) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 90 ? 'var(--sev-low-solid)' :
    pct >= 70 ? 'var(--accent-primary)' :
    pct >= 50 ? 'var(--sev-medium-solid)' :
                'var(--sev-critical-solid)';
  return (
    <div className="confidence-meter">
      <div className="confidence-meter-label">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="progress-bar-wrap">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Progress Indicator (stage-based) ───────────────────────
interface ProgressIndicatorProps {
  value: number; // 0–100
  label?: string;
}

export function ProgressIndicator({ value, label }: ProgressIndicatorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.786rem', color: 'var(--text-secondary)' }}>
          <span>{label}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}%</span>
        </div>
      )}
      <div className="progress-bar-wrap" style={{ height: 6 }}>
        <div className="progress-bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
