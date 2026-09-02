import { UnavailableField } from '../common/States';
import { formatDate, formatDuration, formatFileSize } from '../../utils/format';
import type { Capture } from '../../types';

interface MetadataTableProps {
  capture: Capture;
}

export function MetadataTable({ capture }: MetadataTableProps) {
  return (
    <div className="card" id="capture-metadata-card">
      <div className="card-header"><span className="card-title">Capture Metadata</span></div>
      <table className="param-table">
        <tbody>
          <TechRow label="Filename"      value={capture.filename} />
          <TechRow label="Source"        value={capture.source} />
          <TechRow label="File Size"     value={formatFileSize(capture.file_size)} />
          <TechRow label="Capture Start" value={formatDate(capture.capture_start)} />
          <TechRow label="Capture End"   value={formatDate(capture.capture_end)} />
          <TechRow label="Duration"      value={formatDuration(capture.duration_seconds)} />
          <TechRow label="Packet Count"  value={capture.packet_count?.toLocaleString() ?? null} />
          <TechRow label="Analyzed"      value={formatDate(capture.analyzed_at)} />
        </tbody>
      </table>
    </div>
  );
}

export function TechRow({ label, value, isBool }: { label: string; value: unknown; isBool?: boolean }) {
  const isNull = value === null || value === undefined || value === '—';
  let cls = 'param-val';
  let display: React.ReactNode = isNull ? <UnavailableField /> : String(value);
  if (isBool && !isNull) {
    cls += value ? ' yes' : ' no';
    display = value ? 'Yes' : 'No';
  }
  return (
    <tr>
      <td className="param-key">{label}</td>
      <td className={cls}>{display}</td>
    </tr>
  );
}
