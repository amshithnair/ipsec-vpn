import { FileText, X } from 'lucide-react';
import { formatFileSize } from '../../utils/format';

// ── FilePreview ──────────────────────────────────────────────
// Spec §16 Upload requirement.
// Shows the selected file name, size, extension with a remove button.

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  id?: string;
}

export function FilePreview({ file, onRemove, id = 'file-preview' }: FilePreviewProps) {
  const ext = file.name.split('.').pop()?.toUpperCase() ?? '';

  return (
    <div className="drop-zone has-file" id={id}>
      <div className="file-preview">
        <div className="file-preview-icon">
          <FileText size={22} />
        </div>
        <div className="file-preview-info">
          <div className="file-preview-name" title={file.name}>{file.name}</div>
          <div className="file-preview-meta">
            {formatFileSize(file.size)} · {ext}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          id="remove-file-btn"
          title="Remove file"
          aria-label="Remove selected file"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
