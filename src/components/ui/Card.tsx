import clsx from 'clsx';
import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'gradient';
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({
  children,
  className,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  return (
    <section
      className={clsx(
        'rounded-3xl border border-border transition-colors',
        paddingMap[padding],
        variant === 'default' && 'bg-surface shadow-card',
        variant === 'elevated' && 'bg-elevated shadow-card',
        variant === 'gradient' &&
          'bg-gradient-to-br from-brand/15 via-surface to-surface border-brand/20 shadow-card',
        className,
      )}
    >
      {children}
    </section>
  );
}
