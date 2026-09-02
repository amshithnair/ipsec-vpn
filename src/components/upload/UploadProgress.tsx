import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

// ── UploadProgress ───────────────────────────────────────────
// Spec §16 Upload requirement.
// Shows uploading / success / error state with progress bar.

type UploadPhase = 'uploading' | 'success' | 'error';

interface UploadProgressProps {
  phase: UploadPhase;
  progress: number;       // 0–100
  filename?: string;
  errorMessage?: string;
  onRetry?: () => void;
  id?: string;
}

export function UploadProgress({
  phase,
  progress,
  filename,
  errorMessage,
  onRetry,
  id = 'upload-progress',
}: UploadProgressProps) {
  return (
    <div className="upload-progress-container" id={id}>
      <div
        className="upload-progress-icon"
        style={
          phase === 'success' ? { background: 'rgba(22,163,74,0.1)', color: 'var(--sev-low-text)' } :
          phase === 'error'   ? { background: 'var(--sev-critical-bg)', color: 'var(--sev-critical-text)' } :
          undefined
        }
      >
        {phase === 'success' ? <CheckCircle2 size={28} /> :
         phase === 'error'   ? <AlertCircle  size={28} /> :
                               <UploadCloud  size={28} />}
      </div>

      <div className="upload-progress-title">
        {phase === 'success' ? 'Upload complete' :
         phase === 'error'   ? 'Upload failed'   :
                               'Uploading capture…'}
      </div>

      {filename && (
        <div className="upload-progress-filename">{filename}</div>
      )}

      {/* Progress bar — only during uploading */}
      {phase === 'uploading' && (
        <div style={{ width: '100%', marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.786rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            <span>Uploading</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-wrap" style={{ height: 6 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
            />
          </div>
          <p style={{ fontSize: '0.786rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
            Please wait — do not close this tab
          </p>
        </div>
      )}

      {/* Redirecting notice */}
      {phase === 'success' && (
        <div className="upload-progress-filename">Redirecting to analysis…</div>
      )}

      {/* Error message + retry */}
      {phase === 'error' && (
        <>
          {errorMessage && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.857rem', textAlign: 'center', maxWidth: 380 }}>
              {errorMessage}
            </p>
          )}
          {onRetry && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={onRetry}
              id="upload-retry-btn"
            >
              Try Again
            </button>
          )}
        </>
      )}
    </div>
  );
}
