import type { ReactNode, ButtonHTMLAttributes } from 'react';

// ── Button ──────────────────────────────────────────────────
// Replaces scattered <button className="btn ..."> usages with
// a typed, accessible component. Pages can still use raw <button>
// with CSS classes — this exists as the spec-required component.

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size    = 'md',
  icon    = false,
  loading = false,
  leftIcon,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    icon ? 'btn-icon' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
          ↻
        </span>
      ) : leftIcon}
      {children}
    </button>
  );
}
