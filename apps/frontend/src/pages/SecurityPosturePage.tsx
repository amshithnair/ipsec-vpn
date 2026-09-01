import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import { fetchSecurityPosture } from '@/services/api';
import { SeverityBadge, SourceBadge } from '@/components/common/Badges';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import type { SecurityPostureSummary } from '@/types';

export function SecurityPosturePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<SecurityPostureSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchSecurityPosture()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingState rows={8} />;
  if (error) return <ErrorState title="Failed to load security posture" message={error} onRetry={load} />;
  if (!data || data.total_audited_captures === 0) {
    return (
      <EmptyState
        title="No Security Posture Data Available"
        message="Upload and analyze VPN packet captures or run Demo Lab scenarios to generate an organizational posture assessment."
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" onClick={() => navigate('/captures/new')}>Upload Capture</button>
            <button className="btn btn-secondary" onClick={() => navigate('/demo')}>Open Demo Lab</button>
          </div>
        }
      />
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--sev-low-solid)';
    if (score >= 60) return 'var(--sev-medium-solid)';
    if (score >= 40) return 'var(--sev-high-solid)';
    return 'var(--sev-critical-solid)';
  };

  const pfsPct = Math.round(data.pfs_adoption_rate * 100);
  const replayPct = Math.round(data.replay_protection_rate * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Enterprise Security Posture</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0' }}>
            Aggregated cryptographic security, protocol compliance, and behavioral risk across {data.total_audited_captures} audited VPN captures.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/remediation')}>
            View Remediation Center →
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/captures/new')}>
            + Audit New PCAP
          </button>
        </div>
      </div>

      {/* Posture Score Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ borderTop: `4px solid ${getScoreColor(data.overall_posture_score)}` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Overall Security Posture
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: getScoreColor(data.overall_posture_score), marginTop: 4 }}>
            {data.overall_posture_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <SourceBadge source="HYBRID_RISK" />
          </div>
        </div>

        <div className="card" style={{ borderTop: `4px solid ${getScoreColor(data.crypto_score)}` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cryptographic Assurance
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: getScoreColor(data.crypto_score), marginTop: 4 }}>
            {data.crypto_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <SourceBadge source="RULE_BASED" />
          </div>
        </div>

        <div className="card" style={{ borderTop: `4px solid ${getScoreColor(data.protocol_score)}` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Protocol Modernization
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: getScoreColor(data.protocol_score), marginTop: 4 }}>
            {data.protocol_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <SourceBadge source="DETERMINISTIC" />
          </div>
        </div>

        <div className="card" style={{ borderTop: `4px solid ${getScoreColor(data.behavioral_score)}` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Behavioral Stability
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: getScoreColor(data.behavioral_score), marginTop: 4 }}>
            {data.behavioral_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <SourceBadge source="ML_ANOMALY" />
          </div>
        </div>
      </div>

      {/* Posture Metrics & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Cryptographic Hygiene */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <Lock size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Cryptographic & Protocol Adoption</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem' }}>Perfect Forward Secrecy (PFS) Adoption</span>
              <strong style={{ color: pfsPct >= 70 ? 'var(--sev-low-solid)' : 'var(--sev-high-solid)' }}>{pfsPct}%</strong>
            </div>
            <div className="progress-bar-wrap" style={{ height: 6 }}>
              <div className="progress-bar-fill" style={{ width: `${pfsPct}%`, background: pfsPct >= 70 ? 'var(--sev-low-solid)' : 'var(--sev-high-solid)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '0.875rem' }}>Anti-Replay Protection Rate</span>
              <strong style={{ color: replayPct >= 70 ? 'var(--sev-low-solid)' : 'var(--sev-medium-solid)' }}>{replayPct}%</strong>
            </div>
            <div className="progress-bar-wrap" style={{ height: 6 }}>
              <div className="progress-bar-fill" style={{ width: `${replayPct}%`, background: replayPct >= 70 ? 'var(--sev-low-solid)' : 'var(--sev-medium-solid)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deprecated Ciphers (3DES/DES)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.weak_cipher_count > 0 ? 'var(--sev-critical-solid)' : 'var(--sev-low-solid)', marginTop: 2 }}>
                  {data.weak_cipher_count}
                </div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Weak DH Groups (&lt; 14)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.weak_dh_count > 0 ? 'var(--sev-high-solid)' : 'var(--sev-low-solid)', marginTop: 2 }}>
                  {data.weak_dh_count}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IKE Version Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>IKE Version Distribution</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {Object.entries(data.ike_version_counts || {}).map(([ver, count]) => {
              const pct = Math.round((count / data.total_audited_captures) * 100);
              const isV2 = ver.toLowerCase().includes('2');
              return (
                <div key={ver} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>{ver || 'Unknown'}</span>
                    <span>{count} captures ({pct}%)</span>
                  </div>
                  <div className="progress-bar-wrap" style={{ height: 6 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: isV2 ? 'var(--sev-low-solid)' : 'var(--sev-critical-solid)' }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
              <strong>NIST Guidance:</strong> IKEv1 is deprecated due to weak key exchange mechanics. IKEv2 with authenticated AEAD ciphers (AES-GCM) is required for critical infrastructure.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Findings Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Security & Compliance Findings</h3>
          <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{data.recent_findings.length} findings logged</span>
        </div>

        {data.recent_findings.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--sev-low-solid)' }}>
            <CheckCircle2 size={24} style={{ marginBottom: 4 }} />
            <div>No high-priority findings detected across audited captures.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Finding Title</th>
                <th>Capture Source</th>
                <th>Severity</th>
                <th>Analysis Origin</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_findings.map((f, idx) => (
                <tr key={`${f.capture_id}-${f.finding_id}-${idx}`}>
                  <td style={{ fontWeight: 600 }}>{f.title}</td>
                  <td><code style={{ fontSize: '0.75rem' }}>{f.filename}</code></td>
                  <td><SeverityBadge severity={f.severity as any} /></td>
                  <td><SourceBadge source={f.source} /></td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => navigate(`/investigations/${f.capture_id}`)}
                    >
                      Investigate <ArrowRight size={12} style={{ marginLeft: 4 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
