import { useNavigate } from 'react-router-dom';
import { Upload, Bell } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';

export function Topbar() {
  const navigate = useNavigate();

  return (
    <header className="app-topbar">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Right actions */}
      <div className="topbar-actions">
        <button
          className="btn btn-ghost btn-icon btn-sm"
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
          style={{ borderRadius: 'var(--radius-pill)', padding: '6px 18px' }}
        >
          <Upload size={13} />
          Analyze PCAP
        </button>
      </div>
    </header>
  );
}
