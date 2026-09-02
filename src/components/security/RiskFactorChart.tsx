import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { SecurityFinding, Severity } from '../../types';

interface RiskFactorChartProps {
  findings: SecurityFinding[];
  riskScore: number;
  cryptoStrengthScore: number;
}

const SEV_WEIGHT: Record<Severity, number> = {
  CRITICAL: 100,
  HIGH:     70,
  MEDIUM:   40,
  LOW:      15,
};

export function RiskFactorChart({ findings, riskScore, cryptoStrengthScore }: RiskFactorChartProps) {
  // Build radar axes from findings severity distribution
  const counts: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  findings.forEach(f => counts[f.severity]++);

  // Normalize counts into 0-100 scores for radar axes
  const maxCount = Math.max(...Object.values(counts), 1);

  const radarData = [
    { axis: 'Risk Score',      value: riskScore },
    { axis: 'Crypto Strength', value: 100 - cryptoStrengthScore }, // invert — higher = worse
    { axis: 'Critical Issues', value: Math.round((counts.CRITICAL / maxCount) * 100) },
    { axis: 'High Issues',     value: Math.round((counts.HIGH     / maxCount) * 100) },
    { axis: 'Medium Issues',   value: Math.round((counts.MEDIUM   / maxCount) * 100) },
  ];

  // Severity breakdown bar chart
  const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const totalFindings = findings.length;

  const severityColors: Record<Severity, string> = {
    CRITICAL: '#f87171',
    HIGH:     '#fb923c',
    MEDIUM:   '#fbbf24',
    LOW:      '#4ade80',
  };

  if (totalFindings === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: '0.857rem' }}>
        No findings to display in risk factor chart.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Radar chart */}
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="var(--border-subtle)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Radar
            name="Risk"
            dataKey="value"
            stroke="#f87171"
            fill="#f87171"
            fillOpacity={0.18}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-muted)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Severity distribution breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ fontSize: '0.714rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
          Findings by Severity
        </div>
        {severities.map(sev => {
          const count = counts[sev];
          if (count === 0) return null;
          const pct = Math.round((count / totalFindings) * 100);
          return (
            <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 56, fontSize: '0.714rem', fontWeight: 700, color: severityColors[sev], flexShrink: 0 }}>
                {sev}
              </div>
              <div style={{ flex: 1, height: 6, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: severityColors[sev], borderRadius: 99 }} />
              </div>
              <div style={{ width: 28, fontSize: '0.786rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
