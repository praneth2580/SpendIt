import clsx from 'clsx';

export function pickerTileClass(active: boolean, className?: string) {
  return clsx(
    'shrink-0 rounded-2xl border-2 box-border p-3 flex flex-col items-center justify-center gap-2 transition-all min-w-[80px] max-w-[112px]',
    active
      ? 'border-brand bg-brand-muted shadow-[0_4px_14px_-4px] shadow-brand/25'
      : 'border-border bg-surface-2 hover:bg-elevated hover:border-strong',
    className,
  );
}

