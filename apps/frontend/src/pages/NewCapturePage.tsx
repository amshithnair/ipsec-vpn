import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, AlertCircle, Radio, Cpu, ShieldCheck, Database, Layers, ArrowRight } from 'lucide-react';
import { uploadPcap, startAnalysis } from '@/services/api';

export function NewCapturePage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.pcap') && !ext.endsWith('.pcapng')) {
      return 'Only .pcap and .pcapng files are supported.';
    }
    if (file.size > 100 * 1024 * 1024) {
      return 'File size must be under 100 MB.';
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }

    setSelectedFile(file);
    setError(null);
    setUploading(true);

    try {
      const capture = await uploadPcap(file);
      await startAnalysis(capture.id);
      navigate(`/captures/${capture.id}/analyzing`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1080, margin: '0 auto' }}>
      
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div
        className="hud-corner-box card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.08), #0e1115)',
          border: '1px solid var(--border-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div>
          <div style={{ fontSize: '0.687rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
            [ TELEMETRY INGESTION CENTER ]
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Ingest Packet Capture Payload
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.843rem', margin: '4px 0 0 0' }}>
            Upload PCAP / PCAPNG network captures containing IPsec IKEv1, IKEv2, or ESP encrypted tunnel traffic.
          </p>
        </div>

        <div className="badge badge-completed" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
          <span className="badge-pulse-dot" />
          <span>INGESTION ENGINE READY</span>
        </div>
      </div>

      {/* ── ERROR MESSAGE ────────────────────────────────────────── */}
      {error && (
        <div className="hud-corner-box" style={{ padding: '14px 18px', background: 'var(--sev-critical-bg)', border: '1px solid var(--sev-critical-border)', borderRadius: 'var(--radius-sm)', color: 'var(--sev-critical-text)', fontSize: '0.843rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{error}</span>
        </div>
      )}

      {/* ── HOLOGRAPHIC LASER DROPZONE ───────────────────────────── */}
      <label
        className={`hud-corner-box hud-ingest-dropzone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={onDrop}
        style={{ cursor: uploading ? 'wait' : 'pointer' }}
      >
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '20px 0' }}>
            <div className="state-radar-ring green">
              <Radio size={32} className="spin-slow" />
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              {"INGESTING & PARSING PACKET PAYLOAD..."}
            </div>

            <div style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.843rem' }}>
              <code>{selectedFile?.name}</code>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              DISPATCHING REDIS PIPELINE JOB // INITIATING SCAPY DISSECTOR
            </div>
          </div>
        ) : (
          <>
            <div className="state-radar-ring green">
              <UploadCloud size={32} />
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                {"Drag & Drop PCAP File Here"}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                or click to browse local file system
              </div>
            </div>

            {/* Formats Badges Bar */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span className="badge badge-pending" style={{ fontSize: '0.72rem' }}>
                FORMAT: .PCAP / .PCAPNG
              </span>
              <span className="badge badge-pending" style={{ fontSize: '0.72rem' }}>
                MAX SIZE: 100 MB
              </span>
              <span className="badge badge-completed" style={{ fontSize: '0.72rem' }}>
                NIST SP 800-77 READY
              </span>
            </div>

            <input type="file" accept=".pcap,.pcapng" style={{ display: 'none' }} onChange={onFileSelect} />
          </>
        )}
      </label>

      {/* ── 5-STAGE PIPELINE MATRIX ("What happens next?") ────────── */}
      <div className="hud-corner-box card">
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '0.687rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.08em' }}>
              [ AUTOMATED WORKFLOW MATRIX ]
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '2px 0 0 0', fontWeight: 700 }}>
              Analysis Pipeline Stages
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            5 END-TO-END PHASES
          </span>
        </div>

        <div className="hud-pipeline-grid">

          {/* Stage 1 */}
          <div className="hud-pipeline-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hud-pipeline-stage">STAGE 01</span>
              <Database size={14} color="var(--accent-primary)" />
            </div>
            <div className="hud-pipeline-title">REST Ingestion</div>
            <div className="hud-pipeline-desc">
              {"Go 1.23 REST Gateway ingests & hashes PCAP payload."}
            </div>
          </div>

          {/* Stage 2 */}
          <div className="hud-pipeline-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hud-pipeline-stage">STAGE 02</span>
              <Layers size={14} color="#38bdf8" />
            </div>
            <div className="hud-pipeline-title">Redis Queue</div>
            <div className="hud-pipeline-desc">
              Worker queue dispatches job to AI micro-service.
            </div>
          </div>

          {/* Stage 3 */}
          <div className="hud-pipeline-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hud-pipeline-stage">STAGE 03</span>
              <Cpu size={14} color="var(--accent-primary)" />
            </div>
            <div className="hud-pipeline-title">Scapy Parsing</div>
            <div className="hud-pipeline-desc">
              {"Deterministic parser extracts IKE proposals & transforms."}
            </div>
          </div>

          {/* Stage 4 */}
          <div className="hud-pipeline-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hud-pipeline-stage">STAGE 04</span>
              <ShieldCheck size={14} color="#ffd000" />
            </div>
            <div className="hud-pipeline-title">NIST SP 800-77</div>
            <div className="hud-pipeline-desc">
              {"Compliance engine audits cipher strength & DH groups."}
            </div>
          </div>

          {/* Stage 5 */}
          <div className="hud-pipeline-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hud-pipeline-stage">STAGE 05</span>
              <ArrowRight size={14} color="var(--accent-primary)" />
            </div>
            <div className="hud-pipeline-title">{"AI & Report"}</div>
            <div className="hud-pipeline-desc">
              {"XGBoost predicts ESP traffic & generates report."}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
