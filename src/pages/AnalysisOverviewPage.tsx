import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { Shield, Cpu, FileText, ExternalLink } from 'lucide-react';
import { useFullAnalysis } from '../hooks/useApi';
import { StatusBadge, ConfidenceMeter } from '../components/common/Badges';
import { CardSkeleton, ErrorState, NotFoundState, UnsupportedState } from '../components/common/States';
import { RiskScoreCard, ProtocolCard, SecurityParameterTable } from '../components/analysis';
import { RecommendationCard } from '../components/security';
import { SeverityBadge } from '../components/common/Badges';
import { formatDate } from '../utils/format';

export function AnalysisOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const captureId = id ?? '';
  const { data, loading, error, notFound, refetch } = useFullAnalysis(captureId);

  if (notFound) return <NotFoundState entity="capture" />;
  if (error)    return <ErrorState title="Failed to load analysis" message={error} onRetry={refetch} />;

  const nonIPsec = data?.classification.protocol !== 'IPsec';

  return (
    <div>
      {/* Capture header */}
      <div className="page-header">
        <div className="page-header-text">
          {loading ? (
            <div className="skeleton" style={{ height: 24, width: 260, marginBottom: 8 }} />
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="page-title" style={{ margin: 0 }}>{data!.capture.filename}</h1>
                <StatusBadge status={data!.capture.status} />
              </div>
              <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.786rem' }}>
                {data!.capture.id} · Analyzed {formatDate(data!.capture.analyzed_at)}
              </p>
            </>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/captures')} id="overview-back-btn">
          ← All Captures
        </button>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <NavLink to={`/captures/${captureId}`} end className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-overview"><Shield size={14} /> Overview</NavLink>
        <NavLink to={`/captures/${captureId}/security`}  className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-security"><Shield size={14} /> Security</NavLink>
        <NavLink to={`/captures/${captureId}/technical`} className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-technical"><Cpu size={14} /> Technical</NavLink>
        <NavLink to={`/captures/${captureId}/report`}    className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-report"><FileText size={14} /> Report</NavLink>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} height={140} />)}
        </div>
      ) : (
        <>
          {/* Non-IPsec notice */}
          {nonIPsec && <div style={{ marginBottom: 'var(--space-5)' }}><UnsupportedState /></div>}

          {/* Risk + Protocol row */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            <RiskScoreCard
              score={data!.security.risk_score}
              severity={data!.security.severity}
              cryptoStrengthScore={data!.security.crypto_strength_score}
            />
            <ProtocolCard classification={data!.classification} />
          </div>

          {!nonIPsec && (
            <>
              {/* Security Parameters */}
              <div className="mb-5">
                <SecurityParameterTable classification={data!.classification} />
              </div>

              {/* Findings + Confidence row */}
              <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Findings summary */}
                <div className="card" id="findings-summary-card">
                  <div className="card-header">
                    <span className="card-title">Findings</span>
                    <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
                      {data!.security.findings.length} total
                    </span>
                  </div>
                  {data!.security.findings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.857rem' }}>No findings identified.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {data!.security.findings.slice(0, 3).map(f => (
                        <div key={f.id} className="flex items-center gap-3">
                          <SeverityBadge severity={f.severity} showDot={false} />
                          <span style={{ fontSize: '0.857rem', color: 'var(--text-secondary)' }}>{f.title}</span>
                        </div>
                      ))}
                      {data!.security.findings.length > 3 && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ alignSelf: 'flex-start', marginTop: 4 }}
                          onClick={() => navigate(`/captures/${captureId}/security`)}
                          id="view-all-findings-btn"
                        >
                          +{data!.security.findings.length - 3} more →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Analysis confidence */}
                <div className="card" id="confidence-card">
                  <div className="card-header"><span className="card-title">Analysis Confidence</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <ConfidenceMeter value={data!.security.ai_confidence_score} label="Security Assessment (AI)" />
                    <ConfidenceMeter value={data!.classification.protocol_confidence} label="Protocol Classification" />
                  </div>
                </div>
              </div>

              {/* ── Recommendations (spec §8 requirement) ────────── */}
              {data!.security.recommendations.length > 0 && (
                <div className="card mb-5" id="overview-recommendations-card">
                  <div className="card-header">
                    <span className="card-title">Recommendations</span>
                    <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
                      {data!.security.recommendations.length} items
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {/* Show top 3 recommendations on overview, link to security page for all */}
                    {data!.security.recommendations.slice(0, 3).map(r => (
                      <RecommendationCard key={r.id} rec={r} />
                    ))}
                    {data!.security.recommendations.length > 3 && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ alignSelf: 'flex-start', marginTop: 4 }}
                        onClick={() => navigate(`/captures/${captureId}/security`)}
                        id="view-all-recs-btn"
                      >
                        View all {data!.security.recommendations.length} recommendations →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={() => navigate(`/captures/${captureId}/security`)}  id="go-security-btn"><Shield size={14} /> Security Assessment</button>
            <button className="btn btn-secondary" onClick={() => navigate(`/captures/${captureId}/technical`)} id="go-technical-btn"><Cpu size={14} /> Technical Details</button>
            <button className="btn btn-ghost"     onClick={() => navigate(`/captures/${captureId}/report`)}    id="go-report-btn"><ExternalLink size={14} /> View Report</button>
          </div>
        </>
      )}
    </div>
  );
}
