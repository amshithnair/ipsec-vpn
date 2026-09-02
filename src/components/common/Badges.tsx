import type { Severity, CaptureStatus } from '../../types';

// ── SeverityBadge ────────────────────────────────────────────
interface SeverityBadgeProps {
  severity: Severity;
  showDot?: boolean;
}

const SEV_CLASS: Record<Severity, string> = {
  CRITICAL: 'badge-critical',
  HIGH:     'badge-high',
  MEDIUM:   'badge-medium',
  LOW:      'badge-low',
};

export function SeverityBadge({ severity, showDot = true }: SeverityBadgeProps) {
  return (
    <span className={`badge ${SEV_CLASS[severity]}`}>
      {showDot && <span className="badge-dot" />}
      {severity}
    </span>
  );
}

// ── StatusBadge ──────────────────────────────────────────────
const STATUS_LABELS: Record<CaptureStatus, string> = {
  completed:  'Completed',
  processing: 'Processing',
  uploaded:   'Uploaded',
  failed:     'Failed',
};

const STATUS_DOTS: Record<CaptureStatus, string> = {
  completed:  'var(--status-completed-text)',
  processing: 'var(--status-processing-text)',
  uploaded:   'var(--status-uploaded-text)',
  failed:     'var(--status-failed-text)',
};

export function StatusBadge({ status }: { status: CaptureStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      <span
        className="badge-dot"
        style={{
          background: STATUS_DOTS[status],
          ...(status === 'processing' ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}),
        }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── ConfidenceMeter ──────────────────────────────────────────
interface ConfidenceMeterProps {
  value: number; // 0-1 or 0-100
  label: string;
}

export function ConfidenceMeter({ value, label }: ConfidenceMeterProps) {
  // Normalise: if ≤1 treat as fraction, else as percentage
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);

  return (
    <div className="confidence-meter">
      <div className="confidence-header">
        <span className="confidence-label">{label}</span>
        <span className="confidence-value">{pct}%</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── ProgressIndicator ────────────────────────────────────────
interface ProgressIndicatorProps {
  value: number; // 0–100
  label?: string;
}

export function ProgressIndicator({ value, label }: ProgressIndicatorProps) {
  return (
    <div className="progress-indicator">
      <div className="progress-ind-header">
        {label && <span className="progress-ind-label">{label}</span>}
        <span className="progress-ind-pct">{value}%</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
