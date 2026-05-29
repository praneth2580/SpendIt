import clsx from 'clsx';

const LOGO_SRC = `${import.meta.env.BASE_URL}new_logo.png`;

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  /** Optional line beside the mark (e.g. page title). Brand name is in the image. */
  subtitle?: string;
  className?: string;
};

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-28 w-28',
} as const;

export default function Logo({ size = 'sm', subtitle, className }: LogoProps) {
  return (
    <div className={clsx('flex items-center gap-3 min-w-0', className)}>
      <img
        src={LOGO_SRC}
        alt="SpendIt"
        width={size === 'lg' ? 112 : size === 'md' ? 56 : 40}
        height={size === 'lg' ? 112 : size === 'md' ? 56 : 40}
        className={clsx(sizeClasses[size], 'shrink-0 rounded-2xl object-cover')}
        decoding="async"
      />

      {subtitle ? (
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-fg font-semibold tracking-tight text-[16px] truncate">
            {subtitle}
          </span>
        </div>
      ) : null}
    </div>
  );
}
