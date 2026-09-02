import type { ReactNode } from 'react';

// ── PageHeader ───────────────────────────────────────────────
// Spec §16 Layout requirement.
// Standardises the title / subtitle / actions row used at the
// top of every page. Pages that need a custom header still can,
// but this component handles the 90% case.

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  id?: string;
}

export function PageHeader({ title, subtitle, actions, id }: PageHeaderProps) {
  return (
    <div className="page-header" id={id}>
      <div className="page-header-text">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div className="page-actions">{actions}</div>
      )}
    </div>
  );
}
