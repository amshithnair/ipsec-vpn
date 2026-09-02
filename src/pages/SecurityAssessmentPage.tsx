import { useParams, NavLink } from 'react-router-dom';
import { Shield, Cpu, FileText } from 'lucide-react';
import { useSecurityAssessment } from '../hooks/useApi';
import { SeverityBadge, ConfidenceMeter } from '../components/common/Badges';
import { CardSkeleton, ErrorState, NotFoundState, EmptyState } from '../components/common/States';
import { FindingCard, RecommendationCard, RiskFactorChart } from '../components/security';
import { getSeverityColor } from '../utils/format';
import type { SecurityFinding, Severity } from '../types';

export function SecurityAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const captureId = id ?? '';
  const { data, loading, error, notFound, refetch } = useSecurityAssessment(captureId);

  if (notFound) return <NotFoundState entity="security assessment" />;
  if (error)    return <ErrorState title="Failed to load security assessment" message={error} onRetry={refetch} />;

  const sev = data?.severity.toLowerCase() ?? 'low';

  // Group findings by severity
  const grouped: Record<Severity, SecurityFinding[]> = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
  data?.findings.forEach(f => grouped[f.severity].push(f));

  return (
    <div>
      {/* Tab bar */}
      <div className="tab-bar">
        <NavLink to={`/captures/${captureId}`} end className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-overview"><Shield size={14} /> Overview</NavLink>
        <NavLink to={`/captures/${captureId}/security`}  className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-security"><Shield size={14} /> Security</NavLink>
        <NavLink to={`/captures/${captureId}/technical`} className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-technical"><Cpu size={14} /> Technical</NavLink>
        <NavLink to={`/captures/${captureId}/report`}    className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-report"><FileText size={14} /> Report</NavLink>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} height={120} />)}
        </div>
      ) : (
        <>
          {/* Score + strength + confidence row */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className={`risk-hero ${sev}`} id="security-risk-hero" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div className="risk-hero-label">Risk Score</div>
              <div className="risk-hero-score">{data!.risk_score}</div>
              <SeverityBadge severity={data!.severity} />
            </div>

            <div className="card" id="crypto-strength-card">
              <div className="card-title mb-3">Crypto Strength</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {data!.crypto_strength_score}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
              </div>
              <div style={{ marginTop: 'var(--space-3)' }}>
                <div className="progress-bar-wrap" style={{ height: 6 }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${data!.crypto_strength_score}%`,
                      background: data!.crypto_strength_score >= 70 ? 'var(--sev-low-solid)' :
                                  data!.crypto_strength_score >= 40 ? 'var(--sev-medium-solid)' :
                                  'var(--sev-critical-solid)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="card" id="ai-confidence-card">
              <div className="card-title mb-3">AI Confidence</div>
              <ConfidenceMeter value={data!.ai_confidence_score} label="Security Assessment" />
            </div>
          </div>

          {/* ── Risk Factor Chart (spec §9 requirement) ────────── */}
          <div className="card mb-5" id="risk-factor-chart-card">
            <div className="card-header">
              <span className="card-title">Risk Factor Breakdown</span>
            </div>
            <RiskFactorChart
              findings={data!.findings}
              riskScore={data!.risk_score}
              cryptoStrengthScore={data!.crypto_strength_score}
            />
          </div>

          {/* Compliance baselines */}
          {data!.compliance_baseline && data!.compliance_baseline.length > 0 && (
            <div className="card mb-5" id="compliance-card">
              <div className="card-header"><span className="card-title">Compliance Baseline</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data!.compliance_baseline.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                    padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: c.pass ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                      color: c.pass ? 'var(--sev-low-text)' : 'var(--sev-critical-text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, marginTop: 2,
                    }}>
                      {c.pass ? '✓' : '✗'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.857rem', color: 'var(--text-primary)' }}>{c.name}</div>
                      {c.details && <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.details}</div>}
                    </div>
                    <span style={{
                      fontSize: '0.714rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: c.pass ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                      color: c.pass ? 'var(--sev-low-text)' : 'var(--sev-critical-text)',
                      border: `1px solid ${c.pass ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
                    }}>
                      {c.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings grouped by severity */}
          <div className="card mb-5" id="findings-card">
            <div className="card-header">
              <span className="card-title">Security Findings</span>
              <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>{data!.findings.length} total</span>
            </div>
            {data!.findings.length === 0 ? (
              <EmptyState title="No findings" message="No security issues were identified in this capture." />
            ) : (
              (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s =>
                grouped[s].length > 0 && (
                  <div key={s} style={{ marginBottom: 'var(--space-5)' }}>
                    <div style={{ fontSize: '0.786rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: getSeverityColor(s), marginBottom: 'var(--space-3)' }}>
                      {s} ({grouped[s].length})
                    </div>
                    {grouped[s].map(f => <FindingCard key={f.id} finding={f} />)}
                  </div>
                )
              )
            )}
          </div>

          {/* Recommendations */}
          <div className="card mb-5" id="recommendations-card">
            <div className="card-header">
              <span className="card-title">Recommendations</span>
              <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>{data!.recommendations.length} items</span>
            </div>
            {data!.recommendations.length === 0 ? (
              <EmptyState title="No recommendations" message="No remediations were generated for this capture." />
            ) : (
              data!.recommendations.map(r => <RecommendationCard key={r.id} rec={r} />)
            )}
          </div>

          {/* Threat matrix */}
          {data!.threat_matrix && data!.threat_matrix.length > 0 && (
            <div className="card" id="threat-matrix-card">
              <div className="card-header"><span className="card-title">Threat Matrix</span></div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Threat</th>
                    <th>Likelihood</th>
                    <th>Impact</th>
                    <th>Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.threat_matrix.map((t, i) => (
                    <tr key={i}>
                      <td className="td-primary">{t.threat}</td>
                      <td><span style={{ color: getSeverityColor(t.likelihood), fontWeight: 600, fontSize: '0.786rem' }}>{t.likelihood}</span></td>
                      <td><span style={{ color: getSeverityColor(t.impact),     fontWeight: 600, fontSize: '0.786rem' }}>{t.impact}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.857rem' }}>{t.mitigation ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
