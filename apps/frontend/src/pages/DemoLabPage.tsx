import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Play, ShieldAlert, CheckCircle2, Activity } from 'lucide-react';
import { fetchDemoScenarios, fetchCaptures } from '@/services/api';
import { LoadingState, ErrorState } from '@/components/common/States';
import type { DemoScenario } from '@/types';

export function DemoLabPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoScenarios()
      .then(setScenarios)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLaunchScenario = async (scenario: DemoScenario) => {
    setRunningId(scenario.id);
    try {
      // Find or trigger upload for this demo scenario
      // Fetch current captures to see if already analyzed
      const captures = await fetchCaptures();
      const existing = captures.find((c) => c.filename === scenario.filename);

      if (existing) {
        // Navigate directly to investigation
        navigate(`/investigations/${existing.id}`);
        return;
      }

      // If not yet present in DB, inform analyst to upload fixture or run generator
      alert(`Demo fixture '${scenario.filename}' will be processed. If not uploaded yet, please upload '${scenario.filename}' from data/pcaps/ directory.`);
      navigate('/captures/new');
    } catch (e: any) {
      alert(e.message || 'Failed to start demo scenario');
    } finally {
      setRunningId(null);
    }
  };

  if (loading) return <LoadingState rows={6} />;
  if (error) return <ErrorState title="Failed to load demo scenarios" message={error} onRetry={() => {}} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FlaskConical size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Product Demonstration Lab</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0' }}>
            Pre-configured realistic scenarios to evaluate the full end-to-end security intelligence pipeline.
          </p>
        </div>
      </div>

      {/* Scenario Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {scenarios.map((sc) => {
          const isWeak = sc.id.includes('weak');
          const isStrong = sc.id.includes('strong');

          const borderColor = isWeak ? 'var(--sev-critical-solid)' : isStrong ? 'var(--sev-low-solid)' : 'var(--sev-high-solid)';
          const Icon = isWeak ? ShieldAlert : isStrong ? CheckCircle2 : Activity;

          return (
            <div
              key={sc.id}
              className="card"
              style={{
                borderTop: `4px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4, color: 'var(--text-muted)' }}>
                    {sc.category}
                  </span>
                  <Icon size={18} style={{ color: borderColor }} />
                </div>

                <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.063rem', fontWeight: 600 }}>{sc.title}</h3>

                <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 var(--space-3) 0' }}>
                  {sc.description}
                </p>

                <div style={{ padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Outcome:</span>{' '}
                  <strong style={{ color: borderColor }}>{sc.expected_risk}</strong>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleLaunchScenario(sc)}
                disabled={runningId === sc.id}
              >
                <Play size={14} style={{ marginRight: 6 }} />
                {runningId === sc.id ? 'Loading Scenario...' : 'Execute Scenario Investigation'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Demonstration Flow Explanation */}
      <div className="card" style={{ background: 'var(--bg-elevated)' }}>
        <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.938rem', fontWeight: 600 }}>
          Recommended Jury Demonstration Narrative
        </h4>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.813rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li><strong>Step 1 (Baseline Breach Risk):</strong> Launch the <em>Legacy / Insecure VPN</em> scenario to demonstrate immediate deterministic detection of 3DES, DH Group 2, and missing PFS.</li>
          <li><strong>Step 2 (Hardening Validation):</strong> Launch the <em>Hardened Modern IPsec</em> scenario and open <strong>Capture Comparison</strong> to show the side-by-side risk score drop and posture improvement.</li>
          <li><strong>Step 3 (AI Behavioral Intelligence):</strong> Launch the <em>Suspicious / Anomalous Encrypted Flow</em> scenario to inspect the Isolation Forest anomaly detector identifying irregular burst dynamics without payload decryption.</li>
        </ol>
      </div>
    </div>
  );
}
