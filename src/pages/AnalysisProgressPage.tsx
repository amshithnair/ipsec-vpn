import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useCaptureStatus, useCapture } from '../hooks/useApi';
import { PIPELINE_STAGES, STAGE_ORDER } from '../mocks/status.mock';
import { ProgressIndicator } from '../components/common/Badges';
import { ErrorState } from '../components/common/States';
import type { AnalysisStage } from '../types';

export function AnalysisProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const captureId  = id ?? '';

  // Status (polled every 3s)
  const { data: status, loading: statusLoading, error: statusError, refetch } = useCaptureStatus(captureId, 3000);

  // Capture metadata — for displaying filename (spec §7)
  const { data: capture } = useCapture(captureId);

  // Auto-navigate on completion
  useEffect(() => {
    if (status?.status === 'completed') {
      const timer = setTimeout(() => navigate(`/captures/${captureId}`), 1000);
      return () => clearTimeout(timer);
    }
  }, [status?.status, captureId, navigate]);

  if (statusError) return <ErrorState title="Failed to load analysis status" message={statusError} onRetry={refetch} />;

  const currentStage    = status?.stage ?? 'upload';
  const currentStageIdx = STAGE_ORDER[currentStage as AnalysisStage] ?? 0;
  const isFailed        = status?.status === 'failed';
  const isCompleted     = status?.status === 'completed';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header — filename + ID per spec §7 */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Analysis Progress</h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.786rem' }}>
            {/* Show filename when capture metadata is loaded, fallback to ID */}
            {capture?.filename
              ? <>{capture.filename} <span style={{ color: 'var(--text-disabled)' }}>·</span> {captureId}</>
              : captureId
            }
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/captures')} id="progress-back-btn">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="card mb-5">
        <div className="card-header">
          <span className="card-title">
            {isCompleted ? 'Analysis Complete' : isFailed ? 'Analysis Failed' : 'Processing…'}
          </span>
          {statusLoading && (
            <Loader2 size={14} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
          )}
        </div>

        {status && (
          <ProgressIndicator
            value={status.progress}
            label={isCompleted ? 'Complete' : isFailed ? 'Failed' : `Stage: ${currentStage.replace(/_/g, ' ')}`}
          />
        )}

        {/* Failure error */}
        {isFailed && status?.error_message && (
          <div className="upload-error-banner" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={15} />
            {status.error_message}
          </div>
        )}

        {/* Completion redirect notice */}
        {isCompleted && (
          <p style={{ fontSize: '0.857rem', color: 'var(--sev-low-text)', marginTop: 'var(--space-3)' }}>
            ✓ Redirecting to analysis results…
          </p>
        )}
      </div>

      {/* Pipeline stages */}
      <div className="card" id="pipeline-stages">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <span className="card-title">Pipeline</span>
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            let stageState: 'completed' | 'active' | 'failed' | 'pending';
            if (isFailed && idx === currentStageIdx)               stageState = 'failed';
            else if (idx < currentStageIdx || isCompleted)         stageState = 'completed';
            else if (idx === currentStageIdx && !isCompleted)      stageState = 'active';
            else                                                    stageState = 'pending';

            return (
              <div
                key={stage.key}
                className={`pipeline-stage ${stageState}`}
                id={`pipeline-stage-${stage.key}`}
              >
                <div className="pipeline-stage-indicator">
                  {stageState === 'completed' ? <CheckCircle2 size={14} /> :
                   stageState === 'failed'    ? <XCircle size={14} /> :
                   stageState === 'active'    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
                   idx + 1}
                </div>
                <div className="pipeline-stage-content">
                  <div className="pipeline-stage-label">{stage.label}</div>
                  <div className="pipeline-stage-desc">{stage.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions for failure */}
      {isFailed && (
        <div className="flex gap-3 mt-4">
          <button className="btn btn-secondary" onClick={() => navigate('/captures/new')} id="progress-retry-upload-btn">
            <RefreshCw size={14} /> Upload Again
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/captures')} id="progress-history-btn">
            View History
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
