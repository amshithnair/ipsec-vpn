import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search } from 'lucide-react';
import { useCaptureList } from '../hooks/useApi';
import { ErrorState, EmptyState } from '../components/common/States';
import { CaptureTableRow } from '../components/captures';
import type { Severity, CaptureStatus } from '../types';

const SEVERITY_OPTIONS: Array<{ label: string; value: Severity | 'ALL' }> = [
  { label: 'All Severities', value: 'ALL'      },
  { label: 'Critical',       value: 'CRITICAL' },
  { label: 'High',           value: 'HIGH'     },
  { label: 'Medium',         value: 'MEDIUM'   },
  { label: 'Low',            value: 'LOW'      },
];

const STATUS_OPTIONS: Array<{ label: string; value: CaptureStatus | 'ALL' }> = [
  { label: 'All Statuses', value: 'ALL'        },
  { label: 'Completed',    value: 'completed'  },
  { label: 'Processing',   value: 'processing' },
  { label: 'Uploaded',     value: 'uploaded'   },
  { label: 'Failed',       value: 'failed'     },
];

export function CaptureHistoryPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useCaptureList();
  const [search, setSearch]         = useState('');
  const [sevFilter, setSevFilter]   = useState<Severity | 'ALL'>('ALL');
  const [statFilter, setStatFilter] = useState<CaptureStatus | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.filename.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      const matchSev    = sevFilter  === 'ALL' || c.severity === sevFilter;
      const matchStat   = statFilter === 'ALL' || c.status   === statFilter;
      return matchSearch && matchSev && matchStat;
    });
  }, [data, search, sevFilter, statFilter]);

  if (error) return <ErrorState title="Failed to load captures" message={error} onRetry={refetch} />;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Capture History</h1>
          <p className="page-subtitle">{loading ? 'Loading…' : `${data?.length ?? 0} captures`}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/captures/new')} id="history-analyze-btn">
            <Upload size={15} /> Analyze PCAP
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: 200 }}>
          <Search size={14} className="input-icon" />
          <input
            className="input"
            placeholder="Search by filename or capture ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="history-search-input"
          />
        </div>
        <select
          className="select"
          value={sevFilter}
          onChange={e => setSevFilter(e.target.value as Severity | 'ALL')}
          id="history-severity-filter"
          style={{ width: 160 }}
        >
          {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          className="select"
          value={statFilter}
          onChange={e => setStatFilter(e.target.value as CaptureStatus | 'ALL')}
          id="history-status-filter"
          style={{ width: 150 }}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-text" style={{ width: `${75 + (i % 3) * 8}%` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={data?.length === 0 ? 'No captures yet' : 'No results match your filters'}
            message={data?.length === 0
              ? 'Upload your first PCAP file to begin analysis.'
              : 'Try adjusting your search terms or filters.'}
            action={data?.length === 0
              ? <button className="btn btn-primary" onClick={() => navigate('/captures/new')} id="history-empty-analyze-btn"><Upload size={14} /> Analyze PCAP</button>
              : <button className="btn btn-ghost" onClick={() => { setSearch(''); setSevFilter('ALL'); setStatFilter('ALL'); }} id="history-clear-filters-btn">Clear Filters</button>
            }
          />
        ) : (
          <table className="data-table" id="history-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Protocol</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Analyzed</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => <CaptureTableRow key={c.id} capture={c} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* Result count */}
      {!loading && filtered.length > 0 && (
        <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)', textAlign: 'right' }}>
          Showing {filtered.length} of {data?.length} captures
        </div>
      )}
    </div>
  );
}
