import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FeatureSectionProps {
  rawFeatures: Record<string, unknown> | null | undefined;
}

export function FeatureSection({ rawFeatures }: FeatureSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!rawFeatures) return null;

  return (
    <div className="card" id="raw-features-card">
      <button
        className="card-header"
        style={{
          width: '100%', cursor: 'pointer', background: 'none',
          border: 'none', textAlign: 'left', padding: 0,
          marginBottom: expanded ? 'var(--space-4)' : 0,
        }}
        onClick={() => setExpanded(e => !e)}
        id="raw-features-toggle"
        aria-expanded={expanded}
      >
        <span className="card-title">Raw / Advanced Features</span>
        {expanded
          ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        }
      </button>
      {expanded && (
        <pre style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          fontSize: '0.786rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          overflowX: 'auto',
          lineHeight: 1.7,
          margin: 0,
        }}>
          {JSON.stringify(rawFeatures, null, 2)}
        </pre>
      )}
    </div>
  );
}
