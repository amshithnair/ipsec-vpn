import { useParams, NavLink } from 'react-router-dom';
import { Shield, Cpu, FileText } from 'lucide-react';
import { useReport } from '../hooks/useApi';
import { ErrorState, NotFoundState } from '../components/common/States';
import { ReportActions } from '../components/reports';

export function TechnicalReportPage() {
  const { id } = useParams<{ id: string }>();
  const captureId = id ?? '';
  const { data: html, loading, error, notFound, refetch } = useReport(captureId);

  if (notFound) return <NotFoundState entity="report" />;
  if (error)    return <ErrorState title="Failed to load report" message={error} onRetry={refetch} />;

  return (
    <div>
      {/* Tab bar */}
      <div className="tab-bar">
        <NavLink to={`/captures/${captureId}`} end className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-overview"><Shield size={14} /> Overview</NavLink>
        <NavLink to={`/captures/${captureId}/security`}  className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-security"><Shield size={14} /> Security</NavLink>
        <NavLink to={`/captures/${captureId}/technical`} className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-technical"><Cpu size={14} /> Technical</NavLink>
        <NavLink to={`/captures/${captureId}/report`}    className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-report"><FileText size={14} /> Report</NavLink>
      </div>

      {/* Report actions */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="page-title" style={{ fontSize: '1.1rem' }}>Technical Report</h1>
          <p className="page-subtitle">Capture <span style={{ fontFamily: 'var(--font-mono)' }}>{captureId}</span></p>
        </div>
        {!loading && html && <ReportActions html={html} captureId={captureId} />}
      </div>

      {/* Report iframe */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 14, width: `${60 + (i % 4) * 10}%` }} />
            ))}
          </div>
        ) : (
          <iframe
            id="report-iframe"
            srcDoc={html ?? ''}
            title="Technical Report"
            style={{ width: '100%', height: 'calc(100vh - 220px)', border: 'none', display: 'block' }}
            sandbox="allow-same-origin allow-popups"
          />
        )}
      </div>
    </div>
  );
}
