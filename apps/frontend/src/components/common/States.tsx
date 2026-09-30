import type { ReactNode } from 'react';
import { AlertTriangle, ServerOff, FileX, WifiOff, RefreshCw, Radio } from 'lucide-react';

// ── Loading state (skeleton) ────────────────────────────────
export function LoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-hud" style={{ width: `${70 + (i % 3) * 10}%`, height: 18 }} />
      ))}
    </div>
  );
}

// ── Card skeleton ───────────────────────────────────────────
export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div className="hud-corner-box card skeleton-hud" style={{ minHeight: height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />
      <div style={{ height: 12, width: '40%', marginBottom: 'var(--space-4)', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ height: 32, width: '60%', marginBottom: 'var(--space-3)', background: 'rgba(0,255,157,0.1)' }} />
      <div style={{ height: 10, width: '30%', background: 'rgba(255,255,255,0.06)' }} />
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
  title = 'System Connection Interrupted',
  message = 'Gateway server timed out or returned an invalid status (502 Bad Gateway). Please retry execution.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="hud-corner-box state-container error-hud">
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      {/* Ambient Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255, 30, 66, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 30, 66, 0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }}
      />

      {/* Animated Radar Pulse Icon */}
      <div className="state-radar-ring">
        <ServerOff size={28} />
      </div>

      {/* Status Header Badge */}
      <div className="state-tag-header" style={{ color: '#ff3b5c' }}>
        <Radio size={14} className="spin-slow" />
        <span>[ ERR_GATEWAY // CONNECTION_TIMEOUT ]</span>
      </div>

      <h3 className="state-title">{title}</h3>
      <p className="state-message">{message}</p>

      {onRetry && (
        <button
          className="btn btn-primary spin-on-hover"
          onClick={onRetry}
          id="error-state-retry-btn"
          style={{
            background: 'linear-gradient(135deg, #ff3b5c, #ff1e42)',
            color: '#ffffff',
            boxShadow: '0 0 25px rgba(255, 30, 66, 0.5)',
            border: 'none',
          }}
        >
          <RefreshCw size={14} />
          <span>RECONNECT GATEWAY ▶</span>
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
  title = 'No Telemetry Data Ingested',
  message = 'No active PCAP records or logs found in the security storage matrix.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="hud-corner-box state-container empty-hud">
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      {/* Ambient Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(0, 255, 157, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }}
      />

      {/* Animated Radar Pulse Icon */}
      <div className="state-radar-ring green">
        {icon ?? <FileX size={28} />}
      </div>

      {/* Status Header Badge */}
      <div className="state-tag-header" style={{ color: 'var(--accent-primary)' }}>
        <Radio size={14} className="spin-slow" />
        <span>[ SYSTEM_MATRIX // NULL_RECORD ]</span>
      </div>

      <h3 className="state-title">{title}</h3>
      <p className="state-message">{message}</p>
      {action}
    </div>
  );
}

// ── Not-found state ─────────────────────────────────────────
export function NotFoundState({ entity = 'capture' }: { entity?: string }) {
  return (
    <div className="hud-corner-box state-container warning-hud">
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      <div className="state-radar-ring amber">
        <AlertTriangle size={28} />
      </div>

      <div className="state-tag-header" style={{ color: '#ff9f1c' }}>
        <span>[ ERR_404 // ENTITY_NOT_FOUND ]</span>
      </div>

      <h3 className="state-title">
        {entity.charAt(0).toUpperCase() + entity.slice(1)} Record Missing
      </h3>
      <p className="state-message">
        This target {entity} does not exist in active memory or may have been pruned.
      </p>
    </div>
  );
}

// ── Unsupported analysis state ──────────────────────────────
export function UnsupportedState() {
  return (
    <div className="hud-corner-box state-container warning-hud">
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      <div className="state-radar-ring amber">
        <WifiOff size={28} />
      </div>

      <div className="state-tag-header" style={{ color: '#ff9f1c' }}>
        <span>[ INSUFFICIENT_PAYLOAD // PROTOCOL_WARN ]</span>
      </div>

      <h3 className="state-title">Insufficient IPsec Handshake Data</h3>
      <p className="state-message">
        This capture does not contain sufficient or supported IPsec payloads to generate a full analysis. Ensure the PCAP contains IKE/ESP headers.
      </p>
    </div>
  );
}

// ── Unavailable field ───────────────────────────────────────
export function UnavailableField({ reason = 'Not available from capture' }: { reason?: string }) {
  return (
    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.781rem' }}>
      [ N/A: {reason} ]
    </span>
  );
}
