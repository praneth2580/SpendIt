import clsx from 'clsx';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
};

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
} as const;

const wordmarkSizeClasses = {
  sm: 'text-[16px]',
  md: 'text-[18px]',
  lg: 'text-[24px]',
} as const;

export default function Logo({
  size = 'sm',
  showWordmark = true,
  subtitle,
  className,
}: LogoProps) {
  return (
    <div className={clsx('flex items-center gap-3 min-w-0', className)}>
      <div
        className={clsx(
          sizeClasses[size],
          'shrink-0 rounded-2xl bg-gradient-to-br from-brand to-accent-violet flex items-center justify-center shadow-brand',
        )}
      >
        <span className="text-brand-fg font-bold text-[15px]">S</span>
      </div>

      {showWordmark ? (
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className={clsx(
              'text-fg font-semibold tracking-tight',
              wordmarkSizeClasses[size],
            )}
          >
            Spendt
          </span>
          {subtitle ? (
            <span className="text-muted text-[11px] font-medium truncate">
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
