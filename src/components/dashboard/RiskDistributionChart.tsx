import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { RiskDistribution } from '../../types';

const RISK_COLORS: Record<string, string> = {
  LOW:      '#33cc66',
  MEDIUM:   '#ffcc00',
  HIGH:     '#ff7733',
  CRITICAL: '#ff3355',
};

interface RiskDistributionChartProps {
  distribution: RiskDistribution;
}

export function RiskDistributionChart({ distribution }: RiskDistributionChartProps) {
  const data = [
    { name: 'Low',      value: distribution.low,      key: 'LOW'      },
    { name: 'Medium',   value: distribution.medium,   key: 'MEDIUM'   },
    { name: 'High',     value: distribution.high,     key: 'HIGH'     },
    { name: 'Critical', value: distribution.critical, key: 'CRITICAL' },
  ];

  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-muted)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map(entry => (
              <Cell key={entry.key} fill={RISK_COLORS[entry.key]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {data.map(entry => (
          <div key={entry.key} className="flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2,
              background: RISK_COLORS[entry.key],
              flexShrink: 0, display: 'inline-block',
            }} />
            <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{entry.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
