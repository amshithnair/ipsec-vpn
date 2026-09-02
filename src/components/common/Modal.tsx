import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

// ── Modal ───────────────────────────────────────────────────
// Spec §16 Common requirement.
// Traps focus, closes on Escape and backdrop click.

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  id?: string;
}

export function Modal({ open, onClose, title, children, footer, maxWidth = 480, id }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      id={id ? `${id}-overlay` : 'modal-overlay'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="modal" style={{ maxWidth }} id={id}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: title ? 'var(--space-5)' : 0 }}>
          {title && (
            <div id="modal-title" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {title}
            </div>
          )}
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            id={id ? `${id}-close-btn` : 'modal-close-btn'}
            aria-label="Close modal"
            style={{ marginLeft: 'auto' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>

        {/* Footer */}
        {footer && (
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
