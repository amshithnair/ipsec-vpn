import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';
import { fetchReport, generateReport, getReportDownloadUrl } from '@/services/api';
import { LoadingState, ErrorState } from '@/components/common/States';
import type { ReportMeta } from '@/types';

export function TechnicalReportPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ReportMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchReport(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const report = await generateReport(id);
      setData(report);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingState rows={4} />;
  
  if (error && (error.includes('404') || error.toLowerCase().includes('not found') || error.toLowerCase().includes('no rows'))) {
    return (
      <div className="state-container">
        <div className="state-icon info">
          <FileText size={22} />
        </div>
        <div className="state-title">No Report Generated</div>
        <p className="state-message">A technical HTML report has not been generated for this capture yet.</p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    );
  }

  if (error) return <ErrorState title="Report Error" message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 var(--space-2)' }}>{data.title}</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Generated on {new Date(data.generated_at).toLocaleString()}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {data.ruleset_version && <span>Rules: {data.ruleset_version}</span>}
            {data.model_version && <span>Model: {data.model_version}</span>}
          </div>
        </div>
        <a 
          href={getReportDownloadUrl(id!)} 
          download 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary"
        >
          <Download size={16} />
          Download HTML Report
        </a>
      </div>

      <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <FileText size={48} style={{ color: 'var(--border-muted)', marginBottom: 'var(--space-4)' }} />
        <h3 style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Report Ready</h3>
        <p style={{ maxWidth: 400, margin: '0 auto', fontSize: '0.875rem' }}>
          The standalone HTML report contains the complete deterministic analysis, flow statistics, and security findings. Download it to share with stakeholders or attach to compliance audits.
        </p>
      </div>
    </div>
  );
}
