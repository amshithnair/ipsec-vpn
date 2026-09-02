import { getSeverityColor, getSeverityBg } from '../../utils/format';
import type { Recommendation } from '../../types';

interface RecommendationCardProps {
  rec: Recommendation;
}

export function RecommendationCard({ rec }: RecommendationCardProps) {
  const color = getSeverityColor(rec.priority);
  const bg    = getSeverityBg(rec.priority);
  return (
    <div className="rec-card" id={`rec-${rec.id}`}>
      <div className="rec-card-priority-bar" style={{ background: color }} />
      <div className="rec-card-content">
        <div className="flex items-center gap-3 mb-2">
          <span style={{
            fontSize: '0.714rem', fontWeight: 700, padding: '2px 8px',
            borderRadius: 4, background: bg, color,
            border: `1px solid ${color}40`,
          }}>
            {rec.priority}
          </span>
          <span className="rec-card-title" style={{ margin: 0 }}>{rec.title}</span>
        </div>
        <div className="rec-card-desc">{rec.description}</div>
      </div>
    </div>
  );
}
