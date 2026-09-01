import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { fetchSecurityAssessment } from '@/services/api';
import { SeverityBadge } from '@/components/common/Badges';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import type { SecurityAssessment } from '@/types';

export function SecurityAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SecurityAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchSecurityAssessment(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <LoadingState rows={8} />;
  if (error) return <ErrorState title="Security Assessment Unavailable" message={error} onRetry={load} />;
  if (!data) return <EmptyState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 var(--space-2)' }}>Security Assessment</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Deterministic cryptographic evaluation against NIST standards.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{data.risk_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span></div>
          <div style={{ marginTop: 4 }}><SeverityBadge severity={data.severity} /></div>
        </div>
      </div>

      {/* Findings */}
      <div>
        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-3)' }}>Security Findings ({data.findings.length})</h3>
        {data.findings.length === 0 ? (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--sev-low-solid)' }}>
            <CheckCircle size={20} /> No high-risk security findings detected.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.findings.map((f) => (
              <div key={f.id} className="card" style={{ borderLeft: `4px solid var(--sev-${f.severity.toLowerCase()}-solid)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 600 }}>{f.title}</div>
                  <SeverityBadge severity={f.severity} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>{f.explanation}</p>
                <div style={{ fontSize: '0.813rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Impact:</strong> <span style={{ color: 'var(--text-muted)' }}>{f.impact}</span>
                </div>
                {f.cve && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-overlay)', borderRadius: 4, border: '1px solid var(--border-muted)' }}>{f.cve}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-3)' }}>Recommendations</h3>
        {data.recommendations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No further recommendations.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {data.recommendations.map((r) => (
              <div key={r.id} className="card" style={{ background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ marginTop: 2 }}>
                    {r.priority === 'CRITICAL' || r.priority === 'HIGH' ? <AlertTriangle size={18} style={{ color: 'var(--sev-high-solid)' }} /> : <Info size={18} style={{ color: 'var(--accent-primary)' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
