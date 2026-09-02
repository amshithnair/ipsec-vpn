import { useLocation, useNavigate } from 'react-router-dom';

// ── Breadcrumbs ──────────────────────────────────────────────
// Spec §16 Layout requirement.
// Extracted from Topbar into its own reusable component so it
// can be tested and styled independently.

interface Crumb {
  label: string;
  to?: string;
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return [{ label: 'Dashboard' }];

  const crumbs: Crumb[] = [];

  if (parts[0] === 'captures') {
    crumbs.push({ label: 'Capture History', to: '/captures' });

    if (parts[1] === 'new') {
      crumbs.push({ label: 'New Capture' });
    } else if (parts[1]) {
      const id = parts[1];
      const short = id.length > 12 ? `${id.slice(0, 8)}…` : id;
      crumbs.push({ label: short, to: `/captures/${id}` });

      if (parts[2] === 'analyzing')       crumbs.push({ label: 'Analysis Progress' });
      else if (parts[2] === 'security')   crumbs.push({ label: 'Security Assessment' });
      else if (parts[2] === 'technical')  crumbs.push({ label: 'Technical Details' });
      else if (parts[2] === 'report')     crumbs.push({ label: 'Technical Report' });
    }
  }

  return crumbs;
}

export function Breadcrumbs() {
  const crumbs = useBreadcrumbs();
  const navigate = useNavigate();

  return (
    <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
      <span
        style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
        onClick={() => navigate('/')}
        role="link"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate('/')}
      >
        Home
      </span>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="crumb-sep" style={{ color: 'var(--text-disabled)' }}>›</span>
          {crumb.to ? (
            <span
              style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
              onClick={() => navigate(crumb.to!)}
              role="link"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(crumb.to!)}
            >
              {crumb.label}
            </span>
          ) : (
            <span className="crumb-current" aria-current="page">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
