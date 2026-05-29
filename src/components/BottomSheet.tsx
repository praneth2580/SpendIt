import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

type BottomSheetProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
};

export default function BottomSheet({
  open,
  title,
  children,
  onClose,
  maxWidthClassName = 'max-w-md',
}: BottomSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0"
        style={{ background: 'var(--overlay)' }}
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={`${maxWidthClassName} w-full bg-surface border border-border rounded-t-[1.75rem] shadow-float overflow-hidden animate-[sheetUp_220ms_ease-out]`}
        >
          <div className="px-5 pt-4 pb-2">
            <div className="mx-auto h-1 w-10 rounded-full bg-border-strong" />
            {title ? (
              <div className="mt-3 flex items-center justify-between">
                <h2 id={titleId} className="text-h2 font-semibold text-fg">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 w-9 rounded-xl hover:bg-surface-2 active:bg-elevated transition-colors flex items-center justify-center"
                  aria-label="Close sheet"
                >
                  <span className="material-symbols-outlined text-[20px] text-muted">
                    close
                  </span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="max-h-[85dvh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
