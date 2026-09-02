import type { ReportMeta } from '../../types';
import { formatDate } from '../../utils/format';

interface ReportHeaderProps {
  meta: ReportMeta;
}

export function ReportHeader({ meta }: ReportHeaderProps) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {meta.title}
      </div>
      <div style={{ fontSize: '0.857rem', color: 'var(--text-muted)' }}>
        AI-Powered IPsec VPN Protocol Analyzer
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
        {[
          ['Capture ID',  meta.capture_id],
          ['Filename',    meta.filename],
          ['Generated',   formatDate(meta.generated_at)],
          ...(meta.ruleset_version ? [['Ruleset', meta.ruleset_version]] : []),
          ...(meta.model_version   ? [['Model',   meta.model_version]]   : []),
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.714rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {label}
            </span>
            <span style={{ fontSize: '0.786rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
