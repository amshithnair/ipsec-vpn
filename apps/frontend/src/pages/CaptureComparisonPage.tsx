import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchCaptures, fetchCaptureComparison } from '@/services/api';
import { LoadingState, ErrorState } from '@/components/common/States';
import type { CaptureListItem, CaptureComparison } from '@/types';

export function CaptureComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [captures, setCaptures] = useState<CaptureListItem[]>([]);
  const [baseId, setBaseId] = useState<string>(searchParams.get('base') || '');
  const [targetId, setTargetId] = useState<string>(searchParams.get('target') || '');

  const [comparison, setComparison] = useState<CaptureComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available captures for selection dropdowns
  useEffect(() => {
    fetchCaptures()
      .then((data) => {
        setCaptures(data);
        if (!baseId && data.length > 0) {
          setBaseId(data[0].id);
        }
        if (!targetId && data.length > 1) {
          setTargetId(data[1].id);
        }
      })
      .catch((e) => console.error('Failed to load captures', e));
  }, []);

  // Run comparison when base and target IDs change
  useEffect(() => {
    if (!baseId || !targetId || baseId === targetId) {
      setComparison(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchParams({ base: baseId, target: targetId });

    fetchCaptureComparison(baseId, targetId)
      .then(setComparison)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [baseId, targetId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <GitCompare size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Capture Hardening & Comparison Matrix</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0' }}>
            Direct Before vs. After security comparison between two analyzed VPN packet captures.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-4)', alignItems: 'center' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
            Base Capture (Before Hardening)
          </label>
          <select
            className="input"
            value={baseId}
            onChange={(e) => setBaseId(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            <option value="">Select baseline capture...</option>
            {captures.map((c) => (
              <option key={c.id} value={c.id}>
                {c.filename} ({c.id.substring(0, 8)}...)
              </option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <ArrowRight size={24} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
            Target Capture (After Hardening)
          </label>
          <select
            className="input"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            <option value="">Select target capture...</option>
            {captures.map((c) => (
              <option key={c.id} value={c.id}>
                {c.filename} ({c.id.substring(0, 8)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingState rows={6} />}
      {error && <ErrorState title="Comparison Failed" message={error} onRetry={() => {}} />}

      {baseId === targetId && baseId !== '' && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Please select two different captures to evaluate configuration delta.
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Delta Banner */}
          <div
            className="card"
            style={{
              background: comparison.posture_improvement === 'IMPROVED'
                ? 'rgba(34, 197, 94, 0.08)'
                : comparison.posture_improvement === 'DEGRADED'
                ? 'rgba(239, 68, 68, 0.08)'
                : 'var(--bg-card)',
              border: `1px solid ${
                comparison.posture_improvement === 'IMPROVED'
                  ? 'var(--sev-low-solid)'
                  : comparison.posture_improvement === 'DEGRADED'
                  ? 'var(--sev-critical-solid)'
                  : 'var(--border-subtle)'
              }`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {comparison.posture_improvement === 'IMPROVED' ? (
                <TrendingUp size={28} style={{ color: 'var(--sev-low-solid)' }} />
              ) : comparison.posture_improvement === 'DEGRADED' ? (
                <TrendingDown size={28} style={{ color: 'var(--sev-critical-solid)' }} />
              ) : (
                <Minus size={28} style={{ color: 'var(--text-muted)' }} />
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
                  Security Posture Status: <strong>{comparison.posture_improvement}</strong>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {comparison.score_difference > 0
                    ? `System Risk reduced by ${comparison.score_difference} points after cryptographic hardening.`
                    : comparison.score_difference < 0
                    ? `System Risk increased by ${Math.abs(comparison.score_difference)} points.`
                    : 'Both configurations have equivalent risk scoring.'}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Risk Delta</div>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: comparison.score_difference > 0 ? 'var(--sev-low-solid)' : comparison.score_difference < 0 ? 'var(--sev-critical-solid)' : 'var(--text-muted)',
                }}
              >
                {comparison.score_difference > 0 ? `-${comparison.score_difference}` : `+${Math.abs(comparison.score_difference)}`}
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Parameter / Metric</th>
                  <th style={{ width: '36%', color: 'var(--accent-primary)' }}>
                    Base: <code>{comparison.base_filename}</code>
                  </th>
                  <th style={{ width: '36%', color: 'var(--sev-low-solid)' }}>
                    Target: <code>{comparison.target_filename}</code>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>System Risk Score</td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                      {String(comparison.base_security?.risk_score ?? '—')} / 100
                    </span>{' '}
                    ({String(comparison.base_security?.severity ?? '')})
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--sev-low-solid)' }}>
                      {String(comparison.target_security?.risk_score ?? '—')} / 100
                    </span>{' '}
                    ({String(comparison.target_security?.severity ?? '')})
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600 }}>Cryptographic Strength</td>
                  <td>{String(comparison.base_security?.crypto_strength ?? '—')} / 100</td>
                  <td style={{ fontWeight: 700, color: 'var(--sev-low-solid)' }}>
                    {String(comparison.target_security?.crypto_strength ?? '—')} / 100
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600 }}>IKE Version</td>
                  <td>{String(comparison.base_classification?.ike_version ?? 'Not detected')}</td>
                  <td>{String(comparison.target_classification?.ike_version ?? 'Not detected')}</td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600 }}>Encryption Cipher</td>
                  <td style={{ color: String(comparison.base_classification?.encryption_algo || '').includes('3DES') ? 'var(--sev-critical-solid)' : 'var(--text-primary)' }}>
                    {String(comparison.base_classification?.encryption_algo ?? 'Unknown')}
                  </td>
                  <td style={{ color: 'var(--sev-low-solid)', fontWeight: 600 }}>
                    {String(comparison.target_classification?.encryption_algo ?? 'Unknown')}
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600 }}>Integrity / Auth Algorithm</td>
                  <td>{String(comparison.base_classification?.auth_algo ?? 'Unknown')}</td>
                  <td>{String(comparison.target_classification?.auth_algo ?? 'Unknown')}</td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600 }}>Diffie-Hellman Group</td>
                  <td>Group {String(comparison.base_classification?.dh_group ?? 'None')}</td>
                  <td style={{ fontWeight: 600 }}>Group {String(comparison.target_classification?.dh_group ?? 'None')}</td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600 }}>Perfect Forward Secrecy (PFS)</td>
                  <td>{comparison.base_classification?.pfs_detected ? 'Enabled' : 'Disabled'}</td>
                  <td style={{ color: comparison.target_classification?.pfs_detected ? 'var(--sev-low-solid)' : 'var(--sev-high-solid)', fontWeight: 600 }}>
                    {comparison.target_classification?.pfs_detected ? 'Enabled' : 'Disabled'}
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: 600 }}>Behavioral Anomaly Score</td>
                  <td>
                    {comparison.base_anomaly ? `${comparison.base_anomaly.anomaly_score}/100 (${comparison.base_anomaly.severity})` : '—'}
                  </td>
                  <td>
                    {comparison.target_anomaly ? `${comparison.target_anomaly.anomaly_score}/100 (${comparison.target_anomaly.severity})` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
