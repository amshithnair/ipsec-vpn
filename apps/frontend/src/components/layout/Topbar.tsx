import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Bell } from 'lucide-react';

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

      if (parts[2] === 'analyzing')         crumbs.push({ label: 'Analysis Progress' });
      else if (parts[2] === 'security')     crumbs.push({ label: 'Security Assessment' });
      else if (parts[2] === 'technical')    crumbs.push({ label: 'Technical Details' });
      else if (parts[2] === 'report')       crumbs.push({ label: 'Technical Report' });
    }
  } else if (parts[0] === 'posture') {
    crumbs.push({ label: 'Security Posture' });
  } else if (parts[0] === 'remediation') {
    crumbs.push({ label: 'Remediation Center' });
  } else if (parts[0] === 'compare') {
    crumbs.push({ label: 'Capture Comparison' });
  } else if (parts[0] === 'models') {
    crumbs.push({ label: 'Model Center' });
  } else if (parts[0] === 'demo') {
    crumbs.push({ label: 'Demo Lab' });
  }

  return crumbs;
}

export function Topbar() {
  const crumbs = useBreadcrumbs();
  const navigate = useNavigate();

  return (
    <header className="app-topbar">
      {/* Breadcrumbs */}
      <nav className="topbar-breadcrumb">
        <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => navigate('/')}>
          Home
        </span>
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="crumb-sep" style={{ color: 'var(--text-disabled)' }}>›</span>
            {crumb.to ? (
              <span
                style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
                onClick={() => navigate(crumb.to!)}
              >
                {crumb.label}
              </span>
            ) : (
              <span className="crumb-current">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Security Status Pill (Securify Reference) */}
      <div className="securify-pill-badge" style={{ display: 'flex', alignItems: 'center' }}>
        <span className="badge-pulse-dot" />
        <span>Military-Grade Security VPN</span>
      </div>

      {/* Right actions */}
      <div className="topbar-actions">
        <button
          className="btn btn-secondary btn-icon btn-sm"
          title="Notifications"
          aria-label="Notifications"
          id="topbar-notifications-btn"
        >
          <Bell size={15} />
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/captures/new')}
          id="topbar-analyze-btn"
        >
          <Upload size={14} />
          <span>Analyze PCAP</span>
        </button>
      </div>
    </header>
  );
}
