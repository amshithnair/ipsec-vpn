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
  Radio,
  RefreshCw,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchDashboardSummary } from '@/services/api';
import { SeverityBadge } from '@/components/common/Badges';
import { ErrorState, EmptyState, CardSkeleton } from '@/components/common/States';
import type { DashboardSummary } from '@/types';

const COLORS = [
  '#00ff9d', // Low - Neon Green
  '#ffd000', // Medium - Gold
  '#ff9f1c', // High - Warm Amber
  '#ff1e42', // Critical - Crimson Red
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

  if (error) return <ErrorState title="Dashboard Telemetry Unavailable" message={error} onRetry={load} />;
  if (!data) return <EmptyState title="No Telemetry Data" message="Dashboard summary is empty." />;

  const chartData = [
    { name: 'Low', value: data.risk_distribution.low },
    { name: 'Medium', value: data.risk_distribution.medium },
    { name: 'High', value: data.risk_distribution.high },
    { name: 'Critical', value: data.risk_distribution.critical },
  ];

  const totalRiskValues = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* ── COMMAND CENTER HEADER ────────────────────────────────────── */}
      <div
        className="hud-corner-box card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.06), #0e1115)',
          border: '1px solid var(--border-muted)',
        }}
      >
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', color: '#ffffff' }}>
              [ VANTAGE // COMMAND CENTER ]
            </h2>
            <span className="badge badge-completed" style={{ fontSize: '0.687rem' }}>
              ● LIVE TELEMETRY
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
            Real-time IPsec protocol dissection, NIST SP 800-77 compliance, & XGBoost ML side-channel inference.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh Telemetry">
            <RefreshCw size={13} />
            <span>REFRESH</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/demo')}>
            <FlaskConical size={13} />
            <span>DEMO LAB</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/captures/new')}>
            <Upload size={13} />
            <span>+ INGEST PCAP {'▶'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRIC WIDGET BAR ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--space-4)' }}>
        <KpiCard
          icon={<FileText size={18} />}
          label="Total Captures"
          value={data.total_captures}
          color="#00ff9d"
          subText="Stored PCAP Captures"
        />
        <KpiCard
          icon={<BarChart3 size={18} />}
          label="Analyzed Captures"
          value={data.analyzed}
          color="#38bdf8"
          subText="Fully Evaluated Tunnels"
        />
        <KpiCard
          icon={<ShieldAlert size={18} />}
          label="High / Critical Risks"
          value={data.high_risk + data.critical}
          color="#ff1e42"
          subText="NIST Non-Compliant Flags"
        />
        <KpiCard
          icon={<Activity size={18} />}
          label="Behavioral Anomalies"
          value={data.anomalies_count ?? 0}
          color="#ff9f1c"
          subText="Side-Channel Anomalies"
        />
      </div>

      {/* ── VISUALIZATIONS & POSTURE ACTION MATRIX ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 'var(--space-5)' }}>
        
        {/* Risk Distribution Chart Card */}
        <div className="hud-corner-box card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: '0.687rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.08em' }}>
                [ SYSTEM CRYPTOGRAPHIC AUDIT ]
              </div>
              <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '2px 0 0 0', fontWeight: 700 }}>
                NIST SP 800-77 Risk Distribution
              </h3>
            </div>
            <span className="badge badge-pending" style={{ fontSize: '0.72rem' }}>
              {totalRiskValues} EVALUATED TUNNELS
            </span>
          </div>

          <div style={{ height: 210 }}>
            {totalRiskValues === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', gap: 8 }}>
                <Radio size={24} style={{ opacity: 0.5 }} />
                <span>No analyzed captures in memory database.</span>
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
                      <Cell key={i} fill={COLORS[i]} stroke="rgba(0,0,0,0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#090b0e',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFF',
                      fontFamily: 'var(--font-mono)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
            {chartData.map((d, i) => (
              <div key={d.name} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.687rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[i] }} />
                  {d.name.toUpperCase()}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Posture & Quick Links */}
        <div className="hud-corner-box card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div>
            <div style={{ fontSize: '0.687rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
              [ SECURITY POSTURE ACTIONS ]
            </div>
            <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 var(--space-4) 0', fontWeight: 700 }}>
              Command & Assessment Matrix
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '12px 16px', textTransform: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.843rem' }}
                onClick={() => navigate('/posture')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={16} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 600 }}>Enterprise Security Posture</span>
                </div>
                <ArrowRight size={14} color="var(--accent-primary)" />
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '12px 16px', textTransform: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.843rem' }}
                onClick={() => navigate('/remediation')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={16} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 600 }}>Remediation Center</span>
                </div>
                <ArrowRight size={14} color="var(--accent-primary)" />
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', width: '100%', padding: '12px 16px', textTransform: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.843rem' }}
                onClick={() => navigate('/compare')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Activity size={16} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 600 }}>Capture Comparison Matrix</span>
                </div>
                <ArrowRight size={14} color="var(--accent-primary)" />
              </button>
            </div>
          </div>

          <div style={{ padding: '14px', background: 'rgba(0, 255, 157, 0.05)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.781rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>CRYPTOGRAPHIC INTEGRITY:</strong> Scapy proposal parsing & XGBoost side-channel classifiers active in real-time.
          </div>
        </div>
      </div>

      {/* ── RECENT CAPTURES & INVESTIGATIONS HUD TABLE ────────────────── */}
      <div className="hud-corner-box card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <div style={{ fontSize: '0.687rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.08em' }}>
              [ AUDIT LOG TELEMETRY ]
            </div>
            <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '2px 0 0 0', fontWeight: 700 }}>
              Recent Packet Captures & Investigations
            </h3>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/captures')}>
            <span>VIEW ALL CAPTURES {'→'}</span>
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
                <th>System Risk Score</th>
                <th>Severity Status</th>
                <th>Behavioral ML Status</th>
                <th>Ingestion Date</th>
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
                    <strong style={{ color: 'var(--accent-primary)', fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{c.risk_score}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
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
                  <td style={{ fontSize: '0.813rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ padding: '4px 12px', fontSize: '0.72rem' }}
                      onClick={() => navigate(`/investigations/${c.id}`)}
                    >
                      <span>INVESTIGATE {'▶'}</span>
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

function KpiCard({ icon, label, value, color, subText }: { icon: React.ReactNode; label: string; value: number | string; color: string; subText?: string }) {
  return (
    <div className="hud-corner-box card metric-card" style={{ borderLeft: `3px solid ${color}`, padding: '16px 20px' }}>
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.718rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <span style={{ color, filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</span>
      </div>

      <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
        {value}
      </div>

      {subText && (
        <div style={{ fontSize: '0.687rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {subText}
        </div>
      )}
    </div>
  );
}
