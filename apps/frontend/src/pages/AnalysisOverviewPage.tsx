import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, Cpu, Activity, Clock, FileText } from 'lucide-react';
import { fetchAnalysisResults } from '@/services/api';
import { SeverityBadge, ConfidenceMeter } from '@/components/common/Badges';
import { LoadingState, ErrorState, UnavailableField } from '@/components/common/States';
import type { FullAnalysis } from '@/types';

export function AnalysisOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchAnalysisResults(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <LoadingState rows={10} />;
  if (error) return <ErrorState title="Analysis Not Found" message={error} onRetry={load} />;
  if (!data) return null;

  const { capture, classification, security } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header Profile */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 var(--space-2)' }}>{capture.filename}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '0.813rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> Analyzed: {new Date(capture.created_at).toLocaleString()}</span>
            {capture.file_size && <span>Size: {(capture.file_size / 1024).toFixed(1)} KB</span>}
            {capture.duration_seconds && <span>Duration: {capture.duration_seconds}s</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Overall Risk Score</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{security.risk_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span></div>
          <div style={{ marginTop: 4 }}><SeverityBadge severity={security.severity} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Classification Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Protocol Classification</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <DetailRow label="Inferred Protocol" value={<strong style={{ color: 'var(--text-primary)' }}>{classification.protocol || 'Unknown'}</strong>} />
            <DetailRow label="IKE Version" value={classification.ike_version} />
            <DetailRow label="IPsec Mode" value={classification.mode} />
            <DetailRow label="Encryption Algorithm" value={classification.encryption_algo} />
            <DetailRow label="Authentication Algorithm" value={classification.auth_algo} />
            <DetailRow label="Diffie-Hellman Group" value={classification.dh_group ? `Group ${classification.dh_group}` : null} />
            
            <div style={{ marginTop: 'var(--space-4)' }}>
              <ConfidenceMeter value={classification.confidence_score} label="Classification Confidence" />
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <ShieldAlert size={18} style={{ color: 'var(--sev-critical-solid)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Security Highlights</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <DetailRow label="Perfect Forward Secrecy" value={classification.pfs_detected === null ? null : classification.pfs_detected ? <span style={{ color: 'var(--sev-low-solid)' }}>Enabled</span> : <span style={{ color: 'var(--sev-critical-solid)' }}>Disabled</span>} />
            <DetailRow label="Replay Protection" value={classification.replay_protection === null ? null : classification.replay_protection ? <span style={{ color: 'var(--sev-low-solid)' }}>Enabled</span> : <span style={{ color: 'var(--sev-critical-solid)' }}>Disabled</span>} />
            <DetailRow label="SA Lifetime" value={classification.sa_lifetime_seconds ? `${classification.sa_lifetime_seconds}s` : null} />
            
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.813rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Findings</span>
                <span style={{ fontWeight: 600 }}>{security.findings.length} issues detected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recommendations</span>
                <span style={{ fontWeight: 600 }}>{security.recommendations.length} action items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Dives */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <button className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'var(--transition-fast)' }} onClick={() => navigate(`/captures/${id}/security`)}>
          <ShieldAlert size={20} style={{ color: 'var(--sev-high-solid)' }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600 }}>Full Security Assessment</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>View all findings and NIST compliance</div>
          </div>
        </button>

        <button className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'var(--transition-fast)' }} onClick={() => navigate(`/captures/${id}/technical`)}>
          <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600 }}>Technical Details</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deep dive into IKE, ESP, and flow stats</div>
          </div>
        </button>

        <button className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'var(--transition-fast)' }} onClick={() => navigate(`/captures/${id}/report`)}>
          <FileText size={20} style={{ color: 'var(--status-completed-text)' }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600 }}>Technical Report</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Exportable summary of the analysis</div>
          </div>
        </button>
      </div>

    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
        {value === null || value === undefined ? <UnavailableField /> : value}
      </span>
    </div>
  );
}
