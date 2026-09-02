import { useParams, NavLink } from 'react-router-dom';
import { Shield, Cpu, FileText } from 'lucide-react';
import { useTechnicalDetails } from '../hooks/useApi';
import { CardSkeleton, ErrorState, NotFoundState, UnavailableField } from '../components/common/States';
import { MetadataTable, IKESection, ESPAHSection, FeatureSection } from '../components/technical';
import { formatFileSize, formatDuration } from '../utils/format';

export function TechnicalDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const captureId = id ?? '';
  const { data, loading, error, notFound, refetch } = useTechnicalDetails(captureId);

  if (notFound) return <NotFoundState entity="technical details" />;
  if (error)    return <ErrorState title="Failed to load technical details" message={error} onRetry={refetch} />;

  return (
    <div>
      {/* Tab bar */}
      <div className="tab-bar">
        <NavLink to={`/captures/${captureId}`} end className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-overview"><Shield size={14} /> Overview</NavLink>
        <NavLink to={`/captures/${captureId}/security`}  className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-security"><Shield size={14} /> Security</NavLink>
        <NavLink to={`/captures/${captureId}/technical`} className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-technical"><Cpu size={14} /> Technical</NavLink>
        <NavLink to={`/captures/${captureId}/report`}    className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} id="tab-report"><FileText size={14} /> Report</NavLink>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} height={140} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <MetadataTable capture={data!.capture} />

            {/* Flow Statistics */}
            <div className="card" id="flow-stats-card">
              <div className="card-header"><span className="card-title">Flow Statistics</span></div>
              {!data!.flow_stats ? (
                <UnavailableField reason="Flow statistics not available from this capture" />
              ) : (
                <table className="param-table">
                  <tbody>
                    {[
                      ['Min Packet Size',   data!.flow_stats.packet_size_min   !== null ? `${data!.flow_stats.packet_size_min} bytes`   : null],
                      ['Max Packet Size',   data!.flow_stats.packet_size_max   !== null ? `${data!.flow_stats.packet_size_max} bytes`   : null],
                      ['Avg Packet Size',   data!.flow_stats.packet_size_avg   !== null ? `${data!.flow_stats.packet_size_avg} bytes`   : null],
                      ['Inter-Arrival Avg', data!.flow_stats.inter_arrival_avg_ms !== null ? `${data!.flow_stats.inter_arrival_avg_ms} ms` : null],
                      ['Flow Duration',     formatDuration(data!.flow_stats.flow_duration_seconds)],
                      ['Byte Volume',       formatFileSize(data!.flow_stats.byte_volume)],
                      ['Directionality',    data!.flow_stats.directionality],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td className="param-key">{label}</td>
                        <td className={value ? 'param-val' : 'param-val na'}>
                          {value ?? <UnavailableField />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <IKESection ike={data!.ike} />
            <ESPAHSection espAh={data!.esp_ah} />
          </div>

          <FeatureSection rawFeatures={data!.raw_features as Record<string, unknown> | null} />
        </>
      )}
    </div>
  );
}
