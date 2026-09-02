import { Printer } from 'lucide-react';

interface ReportActionsProps {
  html: string;
  captureId: string;
}

export function ReportActions({ html, captureId }: ReportActionsProps) {
  function handlePrint() {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        className="btn btn-secondary"
        onClick={handlePrint}
        id="report-print-btn"
        aria-label="Print or export report"
      >
        <Printer size={14} /> Print / Export
      </button>
      <span style={{ fontSize: '0.786rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {captureId}
      </span>
    </div>
  );
}
