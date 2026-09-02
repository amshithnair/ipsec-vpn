import { Cpu } from 'lucide-react';
import { ConfidenceMeter } from '../common/Badges';
import type { Classification } from '../../types';

interface ProtocolCardProps {
  classification: Classification;
}

export function ProtocolCard({ classification }: ProtocolCardProps) {
  return (
    <div className="card" id="protocol-card">
      <div className="card-header">
        <span className="card-title">Protocol Intelligence</span>
        <Cpu size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {classification.protocol}
          </div>
          {classification.ike_version && (
            <div style={{ fontSize: '0.857rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {classification.ike_version} · {classification.mode ?? '—'}
            </div>
          )}
        </div>
        <ConfidenceMeter value={classification.protocol_confidence} label="Protocol Confidence" />
        <ConfidenceMeter value={classification.confidence_score} label="Classification Confidence" />
      </div>
    </div>
  );
}
