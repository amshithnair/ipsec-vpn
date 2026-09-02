import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  id: string;
}

export function MetricCard({ label, value, icon, iconBg, iconColor, id }: MetricCardProps) {
  return (
    <div className="metric-card" id={id}>
      <div className="metric-card-header">
        <span className="metric-card-label">{label}</span>
        <div className="metric-card-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="metric-card-value">{value.toLocaleString()}</div>
    </div>
  );
}
