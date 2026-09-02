import { dhGroupLabel } from '../../utils/format';
import { TechRow } from './MetadataTable';
import type { IKEDetails } from '../../types';

interface IKESectionProps {
  ike: IKEDetails;
}

export function IKESection({ ike }: IKESectionProps) {
  return (
    <div className="card" id="ike-details-card">
      <div className="card-header"><span className="card-title">IKE Details</span></div>
      <table className="param-table">
        <tbody>
          <TechRow label="IKE Version"   value={ike.version} />
          <TechRow label="Exchange Type" value={ike.exchange_type} />
          <TechRow label="DH Group"      value={dhGroupLabel(ike.dh_group)} />
          <TechRow label="Nonce Length"  value={ike.nonce_length !== null ? `${ike.nonce_length} bytes` : null} />
          <TechRow label="Initiator ID"  value={ike.initiator_identity} />
          <TechRow label="Responder ID"  value={ike.responder_identity} />
        </tbody>
      </table>

      {ike.proposals.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.714rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
            Proposals
          </div>
          {ike.proposals.map((p, i) => (
            <div key={i} style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)', marginBottom: 'var(--space-2)',
              fontSize: '0.786rem', fontFamily: 'var(--font-mono)',
            }}>
              <span style={{ color: 'var(--text-primary)' }}>{p.encryption}</span>
              <span style={{ color: 'var(--text-disabled)' }}> / </span>
              <span style={{ color: 'var(--text-secondary)' }}>{p.auth}</span>
              <span style={{ color: 'var(--text-disabled)' }}> / </span>
              <span style={{ color: 'var(--text-muted)' }}>Group {p.dh_group}</span>
              {p.prf && (
                <>
                  <span style={{ color: 'var(--text-disabled)' }}> / </span>
                  <span style={{ color: 'var(--text-muted)' }}>{p.prf}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
