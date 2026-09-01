import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Network, Server, Activity } from 'lucide-react';
import { fetchTechnicalDetails } from '@/services/api';
import { LoadingState, ErrorState, EmptyState, UnavailableField } from '@/components/common/States';
import type { TechnicalDetails } from '@/types';

export function TechnicalDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TechnicalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchTechnicalDetails(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <LoadingState rows={8} />;
  if (error) return <ErrorState title="Technical Details Unavailable" message={error} onRetry={load} />;
  if (!data) return <EmptyState />;

  const { ike, esp_ah, flow_stats } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 var(--space-2)' }}>Technical Details</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Raw cryptographic and network flow data extracted from the PCAP.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        
        {/* IKE Parameters */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <Server size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>IKE Parameters</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <DetailRow label="IKE Version" value={ike.version} />
            <DetailRow label="Exchange Type" value={ike.exchange_type} />
            <DetailRow label="DH Group" value={ike.dh_group ? `Group ${ike.dh_group}` : null} />
            <DetailRow label="Nonce Length" value={ike.nonce_length ? `${ike.nonce_length} bytes` : null} />
            <DetailRow label="Initiator ID" value={ike.initiator_identity} />
            <DetailRow label="Responder ID" value={ike.responder_identity} />
          </div>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <h4 style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Proposals</h4>
            {ike.proposals.length === 0 ? <UnavailableField reason="No proposals extracted" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {ike.proposals.map((p, i) => (
                  <div key={i} style={{ padding: 'var(--space-2)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.813rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.encryption}</span> / <span>{p.auth}</span> / <span>DH {p.dh_group}</span>
                    {p.prf && <span> / PRF {p.prf}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ESP/AH Details */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <Network size={18} style={{ color: 'var(--sev-high-solid)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>ESP / AH Details</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <DetailRow label="Protocol Used" value={esp_ah.protocol_used?.toUpperCase()} />
            <DetailRow label="SPI Detected" value={esp_ah.spi ? <code style={{ fontSize: '0.75rem' }}>{esp_ah.spi}</code> : null} />
            <DetailRow label="Sequence Numbers" value={esp_ah.sequence_numbers} />
            <DetailRow label="ICV Length" value={esp_ah.icv_length ? `${esp_ah.icv_length} bytes` : null} />
            <DetailRow label="Padding Detected" value={esp_ah.padding_detected === null ? null : esp_ah.padding_detected ? 'Yes' : 'No'} />
            <DetailRow label="Next Header" value={esp_ah.next_header} />
          </div>
        </div>

        {/* Flow Statistics */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <Activity size={18} style={{ color: 'var(--sev-low-solid)' }} />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Network Flow Statistics</h3>
          </div>
          
          {!flow_stats ? (
            <UnavailableField reason="Flow statistics not calculated for this capture." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
              <StatBox label="Flow Duration" value={flow_stats.flow_duration_seconds ? `${flow_stats.flow_duration_seconds.toFixed(2)}s` : null} />
              <StatBox label="Total Volume" value={flow_stats.byte_volume ? `${(flow_stats.byte_volume / 1024).toFixed(1)} KB` : null} />
              <StatBox label="Avg Packet Size" value={flow_stats.packet_size_avg ? `${Math.round(flow_stats.packet_size_avg)} bytes` : null} />
              <StatBox label="Inter-arrival Time" value={flow_stats.inter_arrival_avg_ms ? `${flow_stats.inter_arrival_avg_ms.toFixed(1)} ms` : null} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
        {value === null || value === undefined ? <UnavailableField /> : value}
      </span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{value === null || value === undefined ? '—' : value}</div>
    </div>
  );
}
