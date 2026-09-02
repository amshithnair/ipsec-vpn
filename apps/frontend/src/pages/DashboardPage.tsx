import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  ShieldAlert,
  Upload,
  Activity,
  FlaskConical,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchDashboardSummary } from '@/services/api';
import { SeverityBadge, SecurifyPill } from '@/components/common/Badges';
import { ErrorState, EmptyState, CardSkeleton } from '@/components/common/States';
import type { DashboardSummary } from '@/types';

const COLORS = [
  '#00E699', // Low - Emerald
  '#FFD043', // Medium - Gold
  '#FF8C38', // High - Warm Amber
  '#FF2D55', // Critical - Crimson Red
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
          <CardSkeleton key={i} height={120} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Product Hero Banner (Securify Reference Design) */}
      <div
        className="card"
        style={{
          position: 'relative',
          padding: 'var(--space-8) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 45, 85, 0.22) 0%, rgba(15, 14, 22, 0.9) 70%)',
          border: '1px solid rgba(255, 45, 85, 0.3)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Ambient Grid overlay inside Hero */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        {/* Securify Security Badge Pill */}
        <div style={{ marginBottom: 16, zIndex: 1 }}>
          <SecurifyPill text="Military-Grade Security VPN Protocol Analyzer" />
        </div>

        {/* Hero Title with Highlight Box */}
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            maxWidth: 820,
            lineHeight: 1.15,
            marginBottom: 16,
            zIndex: 1,
            letterSpacing: '-0.03em',
          }}
        >
          Most <span className="highlight-box">Secure</span> VPN For Total Online Freedom
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            maxWidth: 640,
            marginBottom: 28,
            zIndex: 1,
            lineHeight: 1.6,
          }}
        >
          Passive IPsec/VPN protocol auditing, NIST SP 800-131A cryptographic compliance, and Isolation Forest ML behavioral anomaly detection.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 16, zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/captures/new')}>
            <Upload size={16} />
            <span>Ingest PCAP Capture</span>
            <ArrowRight size={16} />
          </button>

          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/demo')}>
            <FlaskConical size={16} />
            <span>Explore Demo Lab</span>
          </button>
        </div>

        {/* Bottom Arc Glow Accent */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            width: '80%',
            height: 120,
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 45, 85, 0.4) 0%, transparent 70%)',
            pointerEvents: 'none',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Marquee Ticker Ribbon (Securify Reference) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '12px 24px',
          background: 'rgba(255, 45, 85, 0.08)',
          border: '1px solid rgba(255, 45, 85, 0.2)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.786rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span>BROWSE FREELY</span>
        <span style={{ color: 'var(--accent-primary)' }}>✱</span>
        <span>SECURE ANYWHERE</span>
        <span style={{ color: 'var(--accent-primary)' }}>✱</span>
        <span>DIGITAL SHIELD</span>
        <span style={{ color: 'var(--accent-primary)' }}>✱</span>
        <span>SAFE AUDITING</span>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <KpiCard
          icon={<FileText size={20} />}
          label="Total Captures"
          value={data.total_captures}
          color="#FF2D55"
        />
        <KpiCard
          icon={<BarChart3 size={20} />}
          label="Analyzed Captures"
          value={data.analyzed}
          color="#00E699"
        />
        <KpiCard
          icon={<ShieldAlert size={20} />}
          label="High / Critical Risks"
          value={data.high_risk + data.critical}
          color="#FF2D55"
        />
        <KpiCard
          icon={<Activity size={20} />}
          label="Behavioral Anomalies"
          value={data.anomalies_count ?? 0}
          color="#FF8C38"
        />
      </div>

      {/* Visualizations & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-5)' }}>
        {/* Risk Distribution Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
              System Risk Distribution
            </h3>
            <span className="badge badge-pending" style={{ fontSize: '0.72rem' }}>
              {totalRiskValues} evaluated captures
            </span>
          </div>

          <div style={{ height: 210 }}>
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
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(22, 20, 31, 0.95)',
                      border: '1px solid rgba(255, 45, 85, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      color: '#FFF',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-5)', marginTop: 'var(--space-2)' }}>
            {chartData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.786rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i], display: 'inline-block', boxShadow: `0 0 8px ${COLORS[i]}` }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* Security Posture & Quick Links */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 var(--space-4) 0', fontWeight: 700 }}>
              Security Posture Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '12px 18px', borderRadius: 'var(--radius-md)' }}
                onClick={() => navigate('/posture')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={16} color="#FF2D55" />
                  <span>Enterprise Security Posture</span>
                </div>
                <ArrowRight size={15} />
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '12px 18px', borderRadius: 'var(--radius-md)' }}
                onClick={() => navigate('/remediation')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={16} color="#FF2D55" />
                  <span>Remediation Center</span>
                </div>
                <ArrowRight size={15} />
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '12px 18px', borderRadius: 'var(--radius-md)' }}
                onClick={() => navigate('/compare')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Activity size={16} color="#FF2D55" />
                  <span>Capture Comparison Matrix</span>
                </div>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div style={{ padding: 'var(--space-4)', background: 'rgba(255, 45, 85, 0.08)', border: '1px solid rgba(255, 45, 85, 0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.786rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#FFF' }}>Cryptographic Integrity:</strong> Rules engine & ML models isolate anomalous packet handshake vectors in real-time.
          </div>
        </div>
      </div>

      {/* Recent Captures Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
            Recent Captures & Investigations
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/captures')}>
            View All Captures →
          </button>
        </div>

        {data.recent_captures.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
                    <code>{c.filename}</code>
                  </td>
                  <td>
                    <strong style={{ color: '#FFF', fontSize: '1rem' }}>{c.risk_score}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
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
                      className="btn btn-primary btn-sm"
                      style={{ padding: '4px 12px', fontSize: '0.75rem' }}
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
    <div className="card metric-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          {label}
        </span>
        <span style={{ color, filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
        {value}
      </div>
    </div>
  );
}
