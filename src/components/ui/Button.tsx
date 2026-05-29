import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-fg shadow-brand hover:opacity-90 active:scale-[0.98]',
  secondary:
    'bg-surface-2 text-fg border border-border hover:bg-elevated active:scale-[0.98]',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2 active:scale-[0.98]',
  danger: 'bg-danger-muted text-danger hover:opacity-90 active:scale-[0.98]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-xl gap-1.5',
  md: 'h-11 px-4 text-[14px] rounded-2xl gap-2',
  lg: 'h-12 px-5 text-[15px] rounded-2xl gap-2',
};

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  to?: string;
  fullWidth?: boolean;
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  type = 'button',
  onClick,
  to,
  fullWidth,
}: ButtonProps) {
  const classes = clsx(
    'inline-flex items-center justify-center font-medium transition-all',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    disabled && 'opacity-50 pointer-events-none',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
