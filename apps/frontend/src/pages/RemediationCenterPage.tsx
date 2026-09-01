import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ExternalLink } from 'lucide-react';
import { fetchRemediations } from '@/services/api';
import { SeverityBadge, SourceBadge } from '@/components/common/Badges';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import type { RemediationItem } from '@/types';

export function RemediationCenterPage() {
  const navigate = useNavigate();
  const [remediations, setRemediations] = useState<RemediationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const load = () => {
    setLoading(true);
    setError(null);
    fetchRemediations()
      .then(setRemediations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingState rows={8} />;
  if (error) return <ErrorState title="Failed to load remediations" message={error} onRetry={load} />;
  if (remediations.length === 0) {
    return (
      <EmptyState
        title="No Active Remediation Actions"
        message="All analyzed captures comply with standard NIST guidelines or no captures have been uploaded yet."
        action={<button className="btn btn-primary" onClick={() => navigate('/captures/new')}>Audit a PCAP</button>}
      />
    );
  }

  const filtered = remediations.filter((r) => {
    if (filter === 'ALL') return true;
    return r.priority === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Wrench size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Remediation Center</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0' }}>
            Actionable cryptographic and protocol hardening recommendations mapped to detected vulnerabilities.
          </p>
        </div>

        {/* Priority Filter Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', background: 'var(--bg-elevated)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${filter === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 10px', fontSize: '0.75rem', border: 'none' }}
              onClick={() => setFilter(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Remediation Action Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            className="card"
            style={{
              borderLeft: `4px solid var(--sev-${(item.priority || 'medium').toLowerCase()}-solid)`,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <SeverityBadge severity={item.priority} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{item.title}</h3>
              </div>
              <SourceBadge source={item.source || 'NIST_SP_800_131A'} />
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {item.description}
            </p>

            {item.action && (
              <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Recommended Configuration:
                </span>
                <div style={{ fontSize: '0.813rem', color: 'var(--text-primary)', marginTop: 2, fontFamily: 'monospace' }}>
                  {item.action}
                </div>
              </div>
            )}

            {/* Affected Captures */}
            {item.affected_captures && item.affected_captures.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Impacts {item.affected_captures.length} capture(s):</span>
                {item.affected_captures.map((capId) => (
                  <button
                    key={capId}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 6px', fontSize: '0.6875rem' }}
                    onClick={() => navigate(`/investigations/${capId}`)}
                  >
                    <code>{capId.substring(0, 8)}...</code> <ExternalLink size={10} style={{ marginLeft: 3 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
