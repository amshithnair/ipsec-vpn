import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  ShieldAlert,
  Upload,
  Activity,
  ShieldCheck,
  FlaskConical,
  ArrowRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchDashboardSummary } from '@/services/api';
import { SeverityBadge } from '@/components/common/Badges';
import { ErrorState, EmptyState, CardSkeleton } from '@/components/common/States';
import type { DashboardSummary } from '@/types';

const COLORS = [
  'var(--sev-low-solid)',
  'var(--sev-medium-solid)',
  'var(--sev-high-solid)',
  'var(--sev-critical-solid)',
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchDashboardSummary()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} height={100} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState title="Dashboard unavailable" message={error} onRetry={load} />;
  if (!data) return <EmptyState title="No data" message="Dashboard summary is empty." />;

  const chartData = [
    { name: 'Low', value: data.risk_distribution.low },
    { name: 'Medium', value: data.risk_distribution.medium },
    { name: 'High', value: data.risk_distribution.high },
    { name: 'Critical', value: data.risk_distribution.critical },
  ];

  const totalRiskValues = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Product Hero Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={24} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Encrypted Traffic Security Intelligence
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0', maxWidth: 650 }}>
            Passive IPsec/VPN protocol auditing, cryptographic compliance against NIST SP 800-131A, and Isolation Forest behavioral anomaly detection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/demo')}>
            <FlaskConical size={14} style={{ marginRight: 4 }} /> Open Demo Lab
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/captures/new')}>
            <Upload size={14} style={{ marginRight: 4 }} /> Ingest PCAP
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KpiCard
          icon={<FileText size={18} />}
          label="Total Captures"
          value={data.total_captures}
          color="var(--accent-primary)"
        />
        <KpiCard
          icon={<BarChart3 size={18} />}
          label="Analyzed Captures"
          value={data.analyzed}
          color="var(--sev-low-solid)"
        />
        <KpiCard
          icon={<ShieldAlert size={18} />}
          label="High / Critical Risks"
          value={data.high_risk + data.critical}
          color="var(--sev-critical-solid)"
        />
        <KpiCard
          icon={<Activity size={18} />}
          label="Behavioral Anomalies"
          value={data.anomalies_count ?? 0}
          color="var(--sev-high-solid)"
        />
      </div>

      {/* Visualizations & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-4)' }}>
        {/* Risk Distribution Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
              System Risk Distribution
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {totalRiskValues} evaluated captures
            </span>
          </div>

          <div style={{ height: 200 }}>
            {totalRiskValues === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No analyzed captures in database.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            {chartData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* Security Posture & Quick Links */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 var(--space-3) 0', fontWeight: 600 }}>
              Security Posture Quick-Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '10px 14px' }}
                onClick={() => navigate('/posture')}
              >
                <span>Enterprise Security Posture</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '10px 14px' }}
                onClick={() => navigate('/remediation')}
              >
                <span>Remediation Center</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '10px 14px' }}
                onClick={() => navigate('/compare')}
              >
                <span>Capture Comparison Matrix</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong>Analysis Integrity:</strong> Deterministic rules and ML inference are strictly separated and labeled across all views.
          </div>
        </div>
      </div>

      {/* Recent Captures */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
            Recent Captures & Investigations
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/captures')}>
            View All Captures →
          </button>
        </div>

        {data.recent_captures.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No recent packet captures.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>System Risk</th>
                <th>Severity</th>
                <th>Behavioral Status</th>
                <th>Ingested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_captures.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>
                    <code style={{ fontSize: '0.813rem' }}>{c.filename}</code>
                  </td>
                  <td>
                    <strong>{c.risk_score}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </td>
                  <td>
                    <SeverityBadge severity={c.severity} />
                  </td>
                  <td>
                    {c.is_anomalous ? (
                      <span className="badge badge-critical" style={{ fontSize: '0.6875rem' }}>
                        Anomaly ({c.anomaly_score})
                      </span>
                    ) : (
                      <span className="badge badge-low" style={{ fontSize: '0.6875rem' }}>
                        Normal ({c.anomaly_score ?? 0})
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => navigate(`/investigations/${c.id}`)}
                    >
                      Investigate <ArrowRight size={12} style={{ marginLeft: 3 }} />
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

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}
