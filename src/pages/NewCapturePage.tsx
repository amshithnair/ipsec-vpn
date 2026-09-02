import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { uploadCapture, startAnalysis } from '../services/api';
import { FileDropzone }   from '../components/upload/FileDropzone';
import { FilePreview }    from '../components/upload/FilePreview';
import { UploadProgress } from '../components/upload/UploadProgress';
import { PageHeader }     from '../components/layout/PageHeader';

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

const ALLOWED_EXTENSIONS = ['.pcap', '.pcapng'];
const MAX_SIZE_MB    = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateFile(f: File): string {
  const ext = '.' + f.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type "${ext}". Only .pcap and .pcapng files are accepted.`;
  }
  if (f.size > MAX_SIZE_BYTES) {
    return `File too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`;
  }
  return '';
}

export function NewCapturePage() {
  const navigate = useNavigate();
  const [file, setFile]               = useState<File | null>(null);
  const [state, setState]             = useState<UploadState>('idle');
  const [progress, setProgress]       = useState(0);
  const [errorMsg, setErrorMsg]       = useState('');
  const [dragOver, setDragOver]       = useState(false);
  const [validationError, setValidationError] = useState('');

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    if (err) {
      setValidationError(err);
      setFile(null);
      setState('idle');
      return;
    }
    setValidationError('');
    setFile(f);
    setState('selected');
  }

  function removeFile() {
    setFile(null);
    setState('idle');
    setValidationError('');
  }

  async function handleAnalyze() {
    if (!file) return;
    setState('uploading');
    setProgress(0);
    setErrorMsg('');

    const progressInterval = setInterval(() => {
      setProgress(p => p < 85 ? p + Math.random() * 15 : p);
    }, 300);

    try {
      const response = await uploadCapture(file);
      clearInterval(progressInterval);
      setProgress(100);
      setState('success');

      await new Promise(r => setTimeout(r, 800));
      await startAnalysis(response.id);
      navigate(`/captures/${response.id}/analyzing`);
    } catch {
      clearInterval(progressInterval);
      setState('error');
      setErrorMsg('Upload failed. The server did not accept the file. Please check your connection and try again.');
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <PageHeader
        title="New Capture"
        subtitle="Upload a PCAP or PCAPNG file to begin IPsec analysis"
      />

      <div className="card" style={{ padding: 'var(--space-8)' }}>
        {/* Idle: show drop zone */}
        {state === 'idle' && (
          <>
            <FileDropzone
              onFileSelect={handleFileSelect}
              dragOver={dragOver}
              onDragOver={() => setDragOver(true)}
              onDragLeave={() => setDragOver(false)}
            />
            {validationError && (
              <div className="upload-error-banner" id="upload-validation-error">
                <AlertCircle size={15} />
                {validationError}
              </div>
            )}
          </>
        )}

        {/* Selected: show file preview */}
        {state === 'selected' && (
          <>
            <FilePreview file={file!} onRemove={removeFile} />
            {validationError && (
              <div className="upload-error-banner" id="upload-validation-error">
                <AlertCircle size={15} />
                {validationError}
              </div>
            )}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-5)', justifyContent: 'center' }}
              onClick={handleAnalyze}
              id="analyze-capture-btn"
            >
              <UploadCloud size={17} />
              Analyze Capture
            </button>
          </>
        )}

        {/* Uploading */}
        {state === 'uploading' && (
          <UploadProgress
            phase="uploading"
            progress={progress}
            filename={file?.name}
            id="upload-progress"
          />
        )}

        {/* Success */}
        {state === 'success' && (
          <UploadProgress
            phase="success"
            progress={100}
            filename={file?.name}
            id="upload-success"
          />
        )}

        {/* Error */}
        {state === 'error' && (
          <UploadProgress
            phase="error"
            progress={0}
            errorMessage={errorMsg}
            onRetry={() => setState('selected')}
            id="upload-error"
          />
        )}
      </div>

      {/* Pipeline explainer */}
      <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-5)' }}>
        <div className="card-title" style={{ marginBottom: 'var(--space-3)' }}>What happens after upload?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            ['Validate',           'File format and integrity are verified'],
            ['Parse',              'Packets are dissected and decoded'],
            ['Extract Features',   'IPsec and IKE protocol fields are extracted'],
            ['Classify',           'Protocol and configuration are classified'],
            ['Security Assessment','Risk score, findings, and recommendations are generated'],
            ['Report',             'A full technical HTML report is produced'],
          ].map(([stage, desc], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-overlay)',
                border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.643rem', fontWeight: 700,
                color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.857rem', color: 'var(--text-primary)' }}>{stage}</div>
                <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
