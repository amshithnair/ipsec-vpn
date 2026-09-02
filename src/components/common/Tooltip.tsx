import { useState, useRef, type ReactNode } from 'react';

// ── Tooltip ─────────────────────────────────────────────────
// Spec §16 Common requirement.
// Pure CSS-driven tooltip with optional controlled placement.

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  id?: string;
}

export function Tooltip({ content, children, placement = 'top', id }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function show() {
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  }

  function hide() {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  const positionStyle: React.CSSProperties =
    placement === 'bottom' ? { top: 'calc(100% + 6px)', bottom: 'auto', left: '50%', transform: 'translateX(-50%)' } :
    placement === 'left'   ? { top: '50%', left: 'auto', right: 'calc(100% + 6px)', transform: 'translateY(-50%)', bottom: 'auto' } :
    placement === 'right'  ? { top: '50%', left: 'calc(100% + 6px)', transform: 'translateY(-50%)', bottom: 'auto' } :
    /* top */                { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' };

  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      id={id}
      role="tooltip"
      aria-describedby={id ? `${id}-content` : undefined}
    >
      {children}
      {visible && (
        <span
          className="tooltip-content"
          id={id ? `${id}-content` : undefined}
          style={{ ...positionStyle, opacity: 1, pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
