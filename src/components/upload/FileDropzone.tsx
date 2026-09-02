import { useRef, type ReactNode } from 'react';
import { UploadCloud } from 'lucide-react';

// ── FileDropzone ─────────────────────────────────────────────
// Spec §16 Upload requirement.
// Handles drag-and-drop and file browse. Does NOT hold file state
// itself — it calls onFileSelect so the parent page controls state.

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  dragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  accept?: string;
  children?: ReactNode;
  id?: string;
}

export function FileDropzone({
  onFileSelect,
  dragOver,
  onDragOver,
  onDragLeave,
  accept = '.pcap,.pcapng',
  children,
  id = 'pcap-dropzone',
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    onDragLeave();
    const f = e.dataTransfer.files[0];
    if (f) onFileSelect(f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFileSelect(f);
  }

  return (
    <div
      className={`drop-zone${dragOver ? ' drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      id={id}
      role="button"
      tabIndex={0}
      aria-label="Upload PCAP file drop zone"
      onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
        id="pcap-file-input"
      />

      {children ?? (
        <>
          <div className="drop-zone-icon">
            <UploadCloud size={32} />
          </div>
          <div className="drop-zone-title">Drop your PCAP file here</div>
          <div className="drop-zone-sub">or click to browse files</div>
          <div className="drop-zone-hint">Accepts .pcap and .pcapng · Max 100 MB</div>
        </>
      )}
    </div>
  );
}
