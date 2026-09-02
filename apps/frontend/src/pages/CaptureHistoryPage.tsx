import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { fetchCaptures } from '@/services/api';
import { SeverityBadge, StatusBadge } from '@/components/common/Badges';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import type { CaptureListItem, Severity, CaptureStatus } from '@/types';

export function CaptureHistoryPage() {
  const navigate = useNavigate();
  const [captures, setCaptures] = useState<CaptureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [statusFilter, setStatusFilter] = useState<CaptureStatus | ''>('');

  const load = () => {
    setLoading(true);
    setError(null);
    fetchCaptures()
      .then(setCaptures)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = captures.filter((c) => {
    if (search && !c.filename.toLowerCase().includes(search.toLowerCase())) return false;
    if (severityFilter && c.severity !== severityFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  if (loading) return <LoadingState rows={8} />;
  if (error) return <ErrorState title="Failed to load captures" message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Capture History</h2>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/captures/new')}>
          + New Capture
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 32, width: '100%' }}
          />
        </div>
        <select className="input" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as Severity | '')} style={{ width: 140 }}>
          <option value="">All Severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CaptureStatus | '')} style={{ width: 140 }}>
          <option value="">All Statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No captures found"
          message={captures.length === 0 ? 'Upload a PCAP to get started.' : 'No captures match your filters.'}
          action={captures.length === 0 ? <button className="btn btn-primary" onClick={() => navigate('/captures/new')}>Upload PCAP</button> : undefined}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Protocol</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/captures/${c.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{c.filename}</td>
                  <td><code style={{ fontSize: '0.75rem' }}>{c.protocol || '—'}</code></td>
                  <td>{c.risk_score ?? '—'}</td>
                  <td><SeverityBadge severity={c.severity} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
