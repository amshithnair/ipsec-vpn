import { useEffect, useState } from 'react';
import { Cpu, Shield } from 'lucide-react';
import { fetchModels } from '@/services/api';
import { LoadingState, ErrorState } from '@/components/common/States';
import type { ModelCard } from '@/types';

export function ModelCenterPage() {
  const [models, setModels] = useState<ModelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchModels()
      .then(setModels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingState rows={8} />;
  if (error) return <ErrorState title="Failed to load model registry" message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Cpu size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>AI / ML Model Center & Transparency Registry</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0' }}>
            Comprehensive model cards documenting architectures, feature schemas, training datasets, and operational limitations.
          </p>
        </div>
      </div>

      {/* Honesty & Data Integrity Alert Banner */}
      <div
        className="card"
        style={{
          background: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'flex-start',
        }}
      >
        <Shield size={20} style={{ color: '#38bdf8', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: '#38bdf8' }}>Scientific Integrity & Validation Policy:</strong> All AI/ML models currently loaded are baseline <strong>Development / Synthetic-Data Validated</strong> models. Their evaluation metrics reflect synthetic split performance only and are not represented as production enterprise ground truth without domain-specific re-training.
        </div>
      </div>

      {/* Model Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {models.map((m) => (
          <div key={m.model_id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Model Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{m.name}</h3>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-overlay)', borderRadius: 4, fontFamily: 'monospace' }}>
                    v{m.version}
                  </span>
                </div>
                <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Framework: <strong>{m.framework}</strong> · Type: <strong>{m.type}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    background: 'rgba(234, 179, 8, 0.15)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {m.validation_status}
                </span>
              </div>
            </div>

            {/* Task Description */}
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              {m.task}
            </p>

            {/* Feature Schema & Classes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                  Input Flow Features ({m.feature_count})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {m.input_features.map((feat) => (
                    <span
                      key={feat}
                      style={{ fontSize: '0.6875rem', fontFamily: 'monospace', padding: '2px 6px', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                  Target Output Classes
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.classes.map((cls) => (
                    <span
                      key={cls}
                      style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: 4 }}
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Accuracy Statement & Evaluation Metrics */}
            <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                Evaluation Statement & Metrics
              </div>
              <p style={{ fontSize: '0.813rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {m.accuracy_statement}
              </p>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {JSON.stringify(m.evaluation_metrics)}
              </div>
            </div>

            {/* Operational Limitations */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                Operational Limitations & Safety
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.813rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {m.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
