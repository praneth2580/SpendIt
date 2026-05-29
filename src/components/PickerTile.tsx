import clsx from 'clsx';
import type { ReactNode } from 'react';

export function pickerTileClass(active: boolean, className?: string) {
  return clsx(
    'shrink-0 rounded-2xl border-2 box-border p-3 flex flex-col items-center justify-center gap-2 transition-all min-w-[80px] max-w-[112px]',
    active
      ? 'border-brand bg-brand-muted shadow-[0_4px_14px_-4px] shadow-brand/25'
      : 'border-border bg-surface-2 hover:bg-elevated hover:border-strong',
    className,
  );
}

type PickerTileProps = {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  iconClassName?: string;
  className?: string;
  'aria-label'?: string;
};

export default function PickerTile({
  active,
  onClick,
  icon,
  label,
  iconClassName,
  className,
  'aria-label': ariaLabel,
}: PickerTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      className={pickerTileClass(active, className)}
    >
      <span
        className={clsx('material-symbols-outlined text-[22px]', iconClassName ?? 'text-muted')}
      >
        {icon}
      </span>
      <span className="text-[11px] text-fg font-medium leading-tight text-center line-clamp-2 w-full">
        {label}
      </span>
    </button>
  );
}

type PickerRailProps = {
  children: ReactNode;
  className?: string;
};

/** Horizontal scroller with padding so tile borders are not clipped. */
export function PickerRail({ children, className }: PickerRailProps) {
  return (
    <div
      className={clsx(
        'overflow-x-auto overflow-y-visible hide-scrollbar overscroll-x-contain',
        className,
      )}
    >
      <div className="inline-flex min-w-full gap-2.5 px-1 py-2.5">{children}</div>
    </div>
  );
}
