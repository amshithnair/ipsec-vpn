import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Activity,
  Cpu,
  FileText,
  GitCompare,
  CheckCircle2,
} from 'lucide-react';
import { fetchAnalysisResults, fetchAnomalies, generateReport } from '@/services/api';
import { SeverityBadge, SourceBadge } from '@/components/common/Badges';
import { LoadingState, ErrorState } from '@/components/common/States';
import type { FullAnalysis, AnomalyAssessment } from '@/types';

export function InvestigationWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerating, setReportGenerating] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      fetchAnalysisResults(id),
      fetchAnomalies(id),
    ])
      .then(([analysisRes, anomalyRes]) => {
        if (analysisRes.status === 'fulfilled') {
          setAnalysis(analysisRes.value);
        } else {
          throw new Error(analysisRes.reason?.message || 'Failed to load analysis');
        }

        if (anomalyRes.status === 'fulfilled') {
          setAnomaly(anomalyRes.value);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleGenerateReport = async () => {
    if (!id) return;
    setReportGenerating(true);
    try {
      await generateReport(id);
      navigate(`/captures/${id}/report`);
    } catch (e: any) {
      alert(e.message || 'Report generation failed');
    } finally {
      setReportGenerating(false);
    }
  };

  if (loading) return <LoadingState rows={10} />;
  if (error) return <ErrorState title="Investigation Workspace Unavailable" message={error} onRetry={load} />;
  if (!analysis) return null;

  const { capture, classification, security } = analysis;
  const isAnomalous = anomaly?.is_anomalous || false;

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'var(--sev-low-solid)';
    if (score <= 50) return 'var(--sev-medium-solid)';
    if (score <= 75) return 'var(--sev-high-solid)';
    return 'var(--sev-critical-solid)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header & Quick Action Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-overlay)', borderRadius: 4, color: 'var(--text-muted)' }}>
              INVESTIGATION WORKSPACE
            </span>
            <code style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{capture.filename}</code>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0' }}>
            ID: <span style={{ fontFamily: 'monospace' }}>{capture.id}</span> · Packets: {capture.packet_count ?? '—'} · Captured: {new Date(capture.created_at).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/compare?base=${capture.id}`)}>
            <GitCompare size={14} style={{ marginRight: 4 }} /> Compare Capture
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleGenerateReport} disabled={reportGenerating}>
            <FileText size={14} style={{ marginRight: 4 }} />
            {reportGenerating ? 'Generating...' : 'View Technical Report'}
          </button>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        {/* System Risk Score */}
        <div className="card" style={{ borderTop: `4px solid ${getRiskColor(security.risk_score)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>System Risk Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getRiskColor(security.risk_score), lineHeight: 1.1, marginTop: 4 }}>
                {security.risk_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
            <SeverityBadge severity={security.severity} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security Evaluation</span>
            <SourceBadge source="HYBRID_RISK" />
          </div>
        </div>

        {/* Cryptographic Strength */}
        <div className="card" style={{ borderTop: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cryptographic Strength</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1.1, marginTop: 4 }}>
                {security.crypto_strength_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
            <Lock size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIST SP 800-131A</span>
            <SourceBadge source="RULE_BASED" />
          </div>
        </div>

        {/* Behavioral Anomaly */}
        <div className="card" style={{ borderTop: `4px solid ${isAnomalous ? 'var(--sev-high-solid)' : 'var(--sev-low-solid)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Behavioral Anomaly Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: isAnomalous ? 'var(--sev-high-solid)' : 'var(--sev-low-solid)', lineHeight: 1.1, marginTop: 4 }}>
                {anomaly ? `${anomaly.anomaly_score}` : '—'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
            <Activity size={20} style={{ color: isAnomalous ? 'var(--sev-high-solid)' : 'var(--sev-low-solid)' }} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isAnomalous ? 'Anomaly Detected' : 'Normal Flow Baseline'}</span>
            <SourceBadge source="ML_ANOMALY" />
          </div>
        </div>

        {/* ML Traffic Classification */}
        <div className="card" style={{ borderTop: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Encrypted Traffic Class</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#38bdf8', lineHeight: 1.2, marginTop: 8 }}>
                {classification.traffic_inference?.traffic_type || 'Unknown'}
              </div>
            </div>
            <Cpu size={20} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Random Forest v1.0</span>
            <SourceBadge source="ML_CLASSIFIER" />
          </div>
        </div>
      </div>

      {/* Protocol & Negotiation Evidence Grid */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>Observed Protocol & Cryptographic Negotiation</h3>
          <SourceBadge source="DETERMINISTIC" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Protocol & Mode</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{classification.protocol || 'Unknown'} · {classification.mode || 'ESP'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IKE Version</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{classification.ike_version || 'Not Detected'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Encryption Cipher</div>
            <div style={{ fontWeight: 600, marginTop: 2, color: classification.encryption_algo?.includes('3DES') ? 'var(--sev-critical-solid)' : 'var(--text-primary)' }}>
              {classification.encryption_algo || 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Authentication / Hash</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{classification.auth_algo || 'Unknown'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Diffie-Hellman Group</div>
            <div style={{ fontWeight: 600, marginTop: 2, color: (classification.dh_group ?? 14) < 14 ? 'var(--sev-high-solid)' : 'var(--text-primary)' }}>
              {classification.dh_group ? `Group ${classification.dh_group}` : 'None'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Perfect Forward Secrecy (PFS)</div>
            <div style={{ fontWeight: 600, marginTop: 2, color: classification.pfs_detected ? 'var(--sev-low-solid)' : 'var(--sev-high-solid)' }}>
              {classification.pfs_detected ? 'Enabled' : 'Disabled / Not Detected'}
            </div>
          </div>
        </div>
      </div>

      {/* Behavioral Anomaly & Signals Breakdown */}
      {anomaly && anomaly.status === 'EVALUATED' && (
        <div className="card" style={{ borderLeft: `4px solid ${isAnomalous ? 'var(--sev-high-solid)' : 'var(--sev-low-solid)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Activity size={18} style={{ color: isAnomalous ? 'var(--sev-high-solid)' : 'var(--sev-low-solid)' }} />
              <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>Behavioral Anomaly Analysis (Isolation Forest)</h3>
            </div>
            <SourceBadge source="ML_ANOMALY" />
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 var(--space-4) 0' }}>
            {anomaly.explanation}
          </p>

          {anomaly.contributing_signals && anomaly.contributing_signals.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.813rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                Top Contributing Feature Deviations from Learned Normal Baseline
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                {anomaly.contributing_signals.map((sig, idx) => (
                  <div key={idx} style={{ padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{sig.feature_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{sig.observed_value}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sev-high-solid)' }}>
                        {sig.deviation_z_score}σ ({sig.direction})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Baseline norm: {sig.baseline_mean}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Findings with Provenance & Evidence */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>
            Security Findings & Deterministic Evidence ({security.findings.length})
          </h3>
          <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>Traceable from observed packet bytes</span>
        </div>

        {security.findings.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--sev-low-solid)', padding: 'var(--space-3)' }}>
            <CheckCircle2 size={20} /> No high-risk security findings detected.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {security.findings.map((f) => (
              <div key={f.id} className="card" style={{ background: 'var(--bg-elevated)', borderLeft: `4px solid var(--sev-${(f.severity || 'low').toLowerCase()}-solid)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.938rem' }}>{f.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <SourceBadge source={f.source || 'RULE_BASED'} />
                    <SeverityBadge severity={f.severity} />
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                  {f.explanation}
                </p>

                <div style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Impact:</strong> {f.impact}
                </div>

                {f.evidence && (
                  <div style={{ marginTop: 'var(--space-2)', padding: '6px 10px', background: 'var(--bg-overlay)', borderRadius: 4, border: '1px solid var(--border-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Observed Packet Evidence:</span> {typeof f.evidence === 'object' ? JSON.stringify(f.evidence) : String(f.evidence)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actionable Recommendations */}
      <div className="card">
        <div style={{ marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>Actionable Remediation Guidance</h3>
        </div>

        {security.recommendations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pending configuration actions.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
            {security.recommendations.map((r) => (
              <div key={r.id} className="card" style={{ background: 'var(--bg-elevated)', borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                {r.action && (
                  <div style={{ marginTop: 8, padding: '4px 8px', background: 'var(--bg-overlay)', borderRadius: 4, fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    <strong>Action:</strong> {r.action}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
