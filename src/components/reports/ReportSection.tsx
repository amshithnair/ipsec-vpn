import type { ReactNode } from 'react';

interface ReportSectionProps {
  title: string;
  children: ReactNode;
  id?: string;
}

export function ReportSection({ title, children, id }: ReportSectionProps) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }} id={id}>
      <div style={{
        fontSize: '0.714rem', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
