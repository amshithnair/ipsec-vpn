import { useNavigate } from 'react-router-dom';
import { BarChart2, ShieldAlert, CheckCircle2, AlertTriangle, Upload, ArrowRight, Database } from 'lucide-react';
import { useDashboard } from '../hooks/useApi';
import { CardSkeleton, ErrorState } from '../components/common/States';
import { MetricCard, RiskDistributionChart, RecentCapturesTable } from '../components/dashboard';

export function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();
  const navigate = useNavigate();

  if (error) return <ErrorState title="Failed to load dashboard" message={error} onRetry={refetch} />;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          {/* Pill label like Securify "Military-Grade Security VPN" */}
          <div className="pill-label" style={{ marginBottom: 'var(--space-3)', display: 'inline-flex' }}>
            <span className="pill-label-dot" />
            IPsec Protocol Analysis &amp; Security Assessment
          </div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', letterSpacing: '-0.03em' }}>
            Security Intelligence{' '}
            <span style={{ color: 'var(--accent-primary)', textShadow: '0 0 24px rgba(232,24,60,0.5)' }}>
              Dashboard
            </span>
          </h1>
          <p className="page-subtitle">Real-time IPsec capture analysis activity and security posture overview</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/captures/new')}
            id="dashboard-analyze-btn"
            style={{ borderRadius: 'var(--radius-pill)', padding: '9px 22px' }}
          >
            <Upload size={15} /> Analyze PCAP
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} height={110} />)
        ) : (
          <>
            <MetricCard
              label="Total Captures"
              value={data!.total_captures}
              icon={<Database size={16} />}
              iconBg="rgba(232,24,60,0.12)"
              iconColor="var(--accent-primary)"
              id="kpi-total"
            />
            <MetricCard
              label="Analyzed"
              value={data!.analyzed}
              icon={<CheckCircle2 size={16} />}
              iconBg="rgba(51,204,102,0.12)"
              iconColor="var(--sev-low-text)"
              id="kpi-analyzed"
            />
            <MetricCard
              label="High Risk"
              value={data!.high_risk}
              icon={<AlertTriangle size={16} />}
              iconBg="rgba(255,119,51,0.12)"
              iconColor="var(--sev-high-text)"
              id="kpi-high"
            />
            <MetricCard
              label="Critical"
              value={data!.critical}
              icon={<ShieldAlert size={16} />}
              iconBg="rgba(255,51,85,0.12)"
              iconColor="var(--sev-critical-text)"
              id="kpi-critical"
            />
          </>
        )}
      </div>

      {/* Charts + Recent Captures */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '320px 1fr' }}>
        {/* Risk Distribution Chart */}
        <div className="card" id="risk-dist-card" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Red glow effect like Securify */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(232,24,60,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="card-header">
            <span className="card-title">Risk Distribution</span>
            <BarChart2 size={15} style={{ color: 'var(--text-muted)' }} />
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 180 }} />
          ) : (
            <RiskDistributionChart distribution={data!.risk_distribution} />
          )}
        </div>

        {/* Recent Captures Table */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-2)',
          }}>
            <span className="card-title">Recent Captures</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/captures')}
              id="dashboard-view-all-btn"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          {loading ? (
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-text" style={{ width: `${70 + (i % 3) * 12}%` }} />
              ))}
            </div>
          ) : (
            <RecentCapturesTable
              captures={data!.recent_captures}
              onViewAll={() => navigate('/captures')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
