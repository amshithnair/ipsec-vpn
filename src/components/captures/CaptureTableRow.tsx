import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { SeverityBadge, StatusBadge } from '../common/Badges';
import { formatRelativeDate, formatDate } from '../../utils/format';
import type { CaptureListItem } from '../../types';

interface CaptureTableRowProps {
  capture: CaptureListItem;
}

export function CaptureTableRow({ capture }: CaptureTableRowProps) {
  const navigate = useNavigate();
  const severityColor =
    capture.severity === 'CRITICAL' ? 'var(--sev-critical-text)' :
    capture.severity === 'HIGH'     ? 'var(--sev-high-text)'     :
    capture.severity === 'MEDIUM'   ? 'var(--sev-medium-text)'   :
                                      'var(--sev-low-text)';

  return (
    <tr
      className="clickable"
      onClick={() => navigate(`/captures/${capture.id}`)}
      id={`history-row-${capture.id}`}
    >
      <td className="td-primary">
        <div className="flex items-center gap-2">
          <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div className="truncate" style={{ maxWidth: 220 }}>{capture.filename}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.714rem', color: 'var(--text-disabled)' }}>
              {capture.id}
            </div>
          </div>
        </div>
      </td>
      <td className="td-mono">{capture.protocol}</td>
      <td>
        {capture.risk_score > 0 ? (
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.857rem', color: severityColor }}>
            {capture.risk_score}
          </span>
        ) : (
          <span style={{ color: 'var(--text-disabled)' }}>—</span>
        )}
      </td>
      <td><SeverityBadge severity={capture.severity} /></td>
      <td><StatusBadge status={capture.status} /></td>
      <td style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
        {capture.analyzed_at ? formatRelativeDate(capture.analyzed_at) : '—'}
      </td>
      <td style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
        {formatDate(capture.created_at)}
      </td>
    </tr>
  );
}
