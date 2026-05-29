import clsx from 'clsx';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
};

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
} as const;

const wordmarkSizeClasses = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[22px]',
} as const;

export default function Logo({
  size = 'sm',
  showWordmark = true,
  subtitle,
  className,
}: LogoProps) {
  return (
    <div className={clsx('flex items-center gap-2.5 min-w-0', className)}>
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        className={clsx(sizeClasses[size], 'shrink-0 rounded-[9px]')}
      />

      {showWordmark ? (
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className={clsx(
              'text-white font-semibold tracking-tight',
              wordmarkSizeClasses[size],
            )}
          >
            Spendt
          </span>
          {subtitle ? (
            <span className="text-on-surface-variant text-[11px] font-medium truncate">
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
