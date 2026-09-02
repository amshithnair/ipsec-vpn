import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, AlertCircle } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 640, margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 var(--space-2)' }}>Analyze New PCAP</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.813rem', margin: 0 }}>
          Upload a packet capture containing IPsec/IKE traffic for automated security analysis.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--sev-critical-bg)', border: '1px solid var(--sev-critical-border)', borderRadius: 'var(--radius-md)', color: 'var(--sev-critical-text)', fontSize: '0.813rem' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <label
        className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={onDrop}
        style={{
          border: '2px dashed var(--border-muted)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-12) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          cursor: uploading ? 'wait' : 'pointer',
          background: isDragging ? 'var(--accent-glow)' : 'var(--bg-surface)',
          borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border-muted)',
          transition: 'var(--transition-base)',
          textAlign: 'center',
        }}
      >
        {uploading ? (
          <>
            <div className="spinner" />
            <div style={{ fontWeight: 600 }}>Uploading & Starting Analysis...</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.813rem' }}>{selectedFile?.name}</div>
          </>
        ) : (
          <>
            <UploadCloud size={40} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop a PCAP file here</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.813rem' }}>or click to browse — .pcap, .pcapng up to 100 MB</div>
            </div>
            <input type="file" accept=".pcap,.pcapng" style={{ display: 'none' }} onChange={onFileSelect} />
          </>
        )}
      </label>

      <div className="card" style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
        <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>What happens next?</div>
        <ol style={{ paddingLeft: 'var(--space-5)', margin: 0, lineHeight: 1.8 }}>
          <li>Your file is uploaded to the Go backend and stored securely.</li>
          <li>The Python AI service parses the packets using Scapy.</li>
          <li>Deterministic IPsec/IKE classification extracts protocols and crypto params.</li>
          <li>The rules engine evaluates cryptographic strength and generates findings.</li>
          <li>You see the full security assessment and technical report.</li>
        </ol>
      </div>
    </div>
  );
}
