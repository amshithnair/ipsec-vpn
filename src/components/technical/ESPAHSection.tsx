import { UnavailableField } from '../common/States';
import { TechRow } from './MetadataTable';
import type { ESPAHDetails } from '../../types';

interface ESPAHSectionProps {
  espAh: ESPAHDetails;
}

export function ESPAHSection({ espAh }: ESPAHSectionProps) {
  return (
    <div className="card" id="esp-ah-details-card">
      <div className="card-header"><span className="card-title">ESP / AH Details</span></div>
      {!espAh.protocol_used ? (
        <UnavailableField reason="No ESP/AH traffic found in this capture" />
      ) : (
        <table className="param-table">
          <tbody>
            <TechRow label="Protocol Used"    value={espAh.protocol_used} />
            <TechRow label="SPI"              value={espAh.spi} />
            <TechRow label="Sequence Numbers" value={espAh.sequence_numbers} />
            <TechRow label="ICV Length"       value={espAh.icv_length !== null ? `${espAh.icv_length} bytes` : null} />
            <TechRow label="Padding Detected" value={espAh.padding_detected} isBool />
            <TechRow label="Next Header"      value={espAh.next_header} />
          </tbody>
        </table>
      )}
    </div>
  );
}
