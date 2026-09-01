import type { ReactNode } from 'react';
import { AlertTriangle, ServerOff, FileX, WifiOff, RefreshCw } from 'lucide-react';

// ── Loading state (skeleton) ────────────────────────────────
export function LoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: `${70 + (i % 3) * 10}%`, height: 14 }} />
      ))}
    </div>
  );
}

// ── Card skeleton ───────────────────────────────────────────
export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div className="card" style={{ minHeight: height }}>
      <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 'var(--space-4)' }} />
      <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 'var(--space-3)' }} />
      <div className="skeleton" style={{ height: 10, width: '30%' }} />
    </div>
  );
}

// ── Error state ─────────────────────────────────────────────
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-container">
      <div className="state-icon error">
        <ServerOff size={22} />
      </div>
      <div className="state-title">{title}</div>
      <p className="state-message">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} id="error-state-retry-btn">
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'No data found',
  message = 'There is nothing here yet.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="state-container">
      <div className="state-icon empty">
        {icon ?? <FileX size={22} />}
      </div>
      <div className="state-title">{title}</div>
      <p className="state-message">{message}</p>
      {action}
    </div>
  );
}

// ── Not-found state ─────────────────────────────────────────
export function NotFoundState({ entity = 'capture' }: { entity?: string }) {
  return (
    <div className="state-container">
      <div className="state-icon warning">
        <AlertTriangle size={22} />
      </div>
      <div className="state-title">
        {entity.charAt(0).toUpperCase() + entity.slice(1)} not found
      </div>
      <p className="state-message">
        This {entity} does not exist or may have been deleted.
      </p>
    </div>
  );
}

// ── Unsupported analysis state ──────────────────────────────
export function UnsupportedState() {
  return (
    <div className="state-container">
      <div className="state-icon warning">
        <WifiOff size={22} />
      </div>
      <div className="state-title">Insufficient IPsec data</div>
      <p className="state-message">
        This capture does not contain sufficient or supported IPsec
        information to produce a full analysis. The file may be non-IPsec
        traffic or lacks enough packets for classification.
      </p>
    </div>
  );
}

// ── Unavailable field ───────────────────────────────────────
export function UnavailableField({ reason = 'Not available from capture' }: { reason?: string }) {
  return (
    <span style={{ color: 'var(--text-disabled)', fontStyle: 'italic', fontSize: '0.786rem' }}>
      {reason}
    </span>
  );
}
