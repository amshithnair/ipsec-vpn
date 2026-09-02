import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchAnalysisStatus } from '@/services/api';
import { ErrorState } from '@/components/common/States';
import { ProgressIndicator } from '@/components/common/Badges';
import type { AnalysisStatus, AnalysisStage } from '@/types';

const STAGE_ORDER: AnalysisStage[] = ['upload', 'validate', 'parse', 'feature_extraction', 'classify', 'security_assessment', 'report'];
const STAGE_LABELS: Record<AnalysisStage, string> = {
  upload: 'Uploading',
  validate: 'Validating',
  parse: 'Parsing Packets',
  feature_extraction: 'Extracting Features',
  classify: 'Classifying Protocol',
  security_assessment: 'Assessing Security',
  report: 'Generating Report',
};

function stageProgress(stage: AnalysisStage): number {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 ? Math.round(((idx + 1) / STAGE_ORDER.length) * 100) : 10;
}

export function AnalysisProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const poll = async () => {
      try {
        const s = await fetchAnalysisStatus(id);
        setStatus(s);

        if (s.status === 'completed') {
          navigate(`/captures/${id}`, { replace: true });
          return;
        }
        if (s.status === 'failed') {
          setError(s.error_message || 'Analysis failed on the server.');
          return;
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to fetch status.');
        return;
      }

      timer = setTimeout(poll, 2000);
    };

    let timer: ReturnType<typeof setTimeout>;
    poll();
    return () => clearTimeout(timer);
  }, [id, navigate]);

  if (error) return <ErrorState title="Analysis Failed" message={error} />;

  const progress = status ? stageProgress(status.stage) : 5;
  const stageName = status ? STAGE_LABELS[status.stage] || status.stage : 'Starting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 'var(--space-6)' }}>
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <Loader2 size={64} style={{ color: 'var(--accent-primary)', animation: 'spin 2s linear infinite' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 var(--space-2)' }}>Analyzing Traffic...</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{stageName}</p>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <ProgressIndicator value={progress} label="Progress" />
      </div>

      {/* Stage pipeline */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {STAGE_ORDER.map((s) => {
          const current = status?.stage;
          const currentIdx = current ? STAGE_ORDER.indexOf(current) : -1;
          const idx = STAGE_ORDER.indexOf(s);
          const done = idx < currentIdx;
          const active = idx === currentIdx;

          return (
            <span
              key={s}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.688rem',
                fontWeight: 500,
                background: done ? 'var(--sev-low-bg)' : active ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                color: done ? 'var(--sev-low-text)' : active ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: `1px solid ${done ? 'var(--sev-low-border)' : active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              }}
            >
              {STAGE_LABELS[s]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
