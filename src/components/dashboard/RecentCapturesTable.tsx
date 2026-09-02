import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { SeverityBadge, StatusBadge } from '../common/Badges';
import { EmptyState } from '../common/States';
import { formatRelativeDate } from '../../utils/format';
import type { RecentCapture } from '../../types';

interface RecentCapturesTableProps {
  captures: RecentCapture[];
  onViewAll: () => void;
}

export function RecentCapturesTable({ captures, onViewAll }: RecentCapturesTableProps) {
  const navigate = useNavigate();

  if (captures.length === 0) {
    return (
      <EmptyState
        title="No captures yet"
        message="Upload your first PCAP file to begin analysis."
        action={
          <button
            className="btn btn-primary"
            onClick={() => navigate('/captures/new')}
            id="dashboard-empty-analyze-btn"
          >
            <FileText size={14} /> Analyze PCAP
          </button>
        }
      />
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Filename</th>
          <th>Protocol</th>
          <th>Risk Score</th>
          <th>Severity</th>
          <th>Status</th>
          <th>Analyzed</th>
        </tr>
      </thead>
      <tbody>
        {captures.map(capture => (
          <tr
            key={capture.id}
            className="clickable"
            onClick={() => navigate(`/captures/${capture.id}`)}
            id={`dashboard-capture-row-${capture.id}`}
          >
            <td className="td-primary">
              <div className="flex items-center gap-2">
                <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span className="truncate" style={{ maxWidth: 180 }}>{capture.filename}</span>
              </div>
            </td>
            <td className="td-mono">{capture.protocol}</td>
            <td><RiskScoreCell score={capture.risk_score} severity={capture.severity} /></td>
            <td><SeverityBadge severity={capture.severity} /></td>
            <td><StatusBadge status={capture.status} /></td>
            <td style={{ color: 'var(--text-muted)', fontSize: '0.786rem' }}>
              {formatRelativeDate(capture.analyzed_at ?? capture.created_at)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RiskScoreCell({ score, severity }: { score: number; severity: string }) {
  const color =
    severity === 'CRITICAL' ? 'var(--sev-critical-text)' :
    severity === 'HIGH'     ? 'var(--sev-high-text)'     :
    severity === 'MEDIUM'   ? 'var(--sev-medium-text)'   :
                              'var(--sev-low-text)';
  if (score === 0) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-mono)', fontSize: '0.857rem' }}>
        {score}
      </span>
      <div style={{ width: 48, height: 4, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}
