import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText, AlertTriangle, ShieldAlert, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchDashboardSummary } from '@/services/api';
import { SeverityBadge, StatusBadge } from '@/components/common/Badges';
import { ErrorState, EmptyState, CardSkeleton } from '@/components/common/States';
import type { DashboardSummary } from '@/types';

const COLORS = ['var(--sev-low-solid)', 'var(--sev-medium-solid)', 'var(--sev-high-solid)', 'var(--sev-critical-solid)'];

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
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} height={100} />)}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        <KpiCard icon={<FileText size={18} />} label="Total Captures" value={data.total_captures} color="var(--accent-primary)" />
        <KpiCard icon={<BarChart3 size={18} />} label="Analyzed" value={data.analyzed} color="var(--sev-low-solid)" />
        <KpiCard icon={<AlertTriangle size={18} />} label="High Risk" value={data.high_risk} color="var(--sev-high-solid)" />
        <KpiCard icon={<ShieldAlert size={18} />} label="Critical" value={data.critical} color="var(--sev-critical-solid)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Risk Distribution Chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>Risk Distribution</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
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

        {/* Quick Actions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Upload size={32} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Analyze New PCAP</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.813rem', textAlign: 'center', maxWidth: 300 }}>
            Upload a packet capture to run deterministic IPsec analysis and security assessment.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/captures/new')}>
            <Upload size={14} /> Upload PCAP
          </button>
        </div>
      </div>

      {/* Recent Captures */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Recent Captures</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/captures')}>View All</button>
        </div>
        {data.recent_captures.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.813rem' }}>No captures yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Protocol</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_captures.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/captures/${c.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{c.filename}</td>
                  <td><code style={{ fontSize: '0.75rem' }}>{c.protocol || '—'}</code></td>
                  <td>{c.risk_score ?? '—'}</td>
                  <td><SeverityBadge severity={c.severity} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ padding: 'var(--space-3)', background: `${color}15`, borderRadius: 'var(--radius-md)', color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}
