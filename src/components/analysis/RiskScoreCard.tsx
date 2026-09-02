import { SeverityBadge } from '../common/Badges';
import type { Severity } from '../../types';

interface RiskScoreCardProps {
  score: number;
  severity: Severity;
  cryptoStrengthScore: number;
}

export function RiskScoreCard({ score, severity, cryptoStrengthScore }: RiskScoreCardProps) {
  const sev = severity.toLowerCase();
  return (
    <div className={`risk-hero ${sev}`} id="risk-hero-card">
      <div>
        <div className="risk-hero-label">Risk Score</div>
        <div className="risk-hero-score">{score}</div>
        <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)', marginTop: 4 }}>/100</div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="risk-hero-label">Severity</div>
        <div className="risk-hero-severity">{severity}</div>
        <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Crypto strength: {cryptoStrengthScore}/100
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <SeverityBadge severity={severity} />
        </div>
      </div>
    </div>
  );
}
