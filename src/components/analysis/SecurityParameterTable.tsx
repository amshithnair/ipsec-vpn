import { UnavailableField } from '../common/States';
import { dhGroupLabel } from '../../utils/format';
import type { Classification } from '../../types';

interface SecurityParameterTableProps {
  classification: Classification;
}

export function SecurityParameterTable({ classification }: SecurityParameterTableProps) {
  return (
    <div className="card" id="security-params-card">
      <div className="card-header">
        <span className="card-title">Security Parameters</span>
      </div>
      <table className="param-table">
        <tbody>
          <ParamRow label="IKE Version"       value={classification.ike_version} />
          <ParamRow label="IPsec Mode"        value={classification.mode} />
          <ParamRow label="Encryption"        value={classification.encryption_algo} />
          <ParamRow label="Authentication"    value={classification.auth_algo} />
          <ParamRow label="DH Group"          value={dhGroupLabel(classification.dh_group)} />
          <ParamRow label="PFS"               value={classification.pfs_detected}      isBool />
          <ParamRow label="Replay Protection" value={classification.replay_protection} isBool />
          <ParamRow
            label="SA Lifetime"
            value={classification.sa_lifetime_seconds !== null
              ? `${classification.sa_lifetime_seconds}s`
              : null}
          />
        </tbody>
      </table>
    </div>
  );
}

function ParamRow({ label, value, isBool }: { label: string; value: unknown; isBool?: boolean }) {
  const isNull = value === null || value === undefined;
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
