import { SeverityBadge } from '../common/Badges';
import type { SecurityFinding } from '../../types';

interface FindingCardProps {
  finding: SecurityFinding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const sev = finding.severity.toLowerCase();
  return (
    <div className={`finding-card ${sev}`} id={`finding-${finding.id}`}>
      <div className="finding-card-header">
        <SeverityBadge severity={finding.severity} showDot={false} />
        <span className="finding-card-title">{finding.title}</span>
        {finding.cve && <span className="finding-card-cve">{finding.cve}</span>}
      </div>
      <div className="finding-card-body">
        <div>
          <div className="finding-card-field-label">Explanation</div>
          <div className="finding-card-field-text">{finding.explanation}</div>
        </div>
        <div>
          <div className="finding-card-field-label">Impact</div>
          <div className="finding-card-field-text">{finding.impact}</div>
        </div>
      </div>
    </div>
  );
}
