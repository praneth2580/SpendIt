import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

type BottomSheetProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  /** Tailwind max width for sheet container */
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
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={`${maxWidthClassName} w-full bg-surface-container border border-white/10 border-t-white/15 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.65)] overflow-hidden animate-[sheetUp_220ms_ease-out]`}
        >
          <div className="px-4 pt-3 pb-2">
            <div className="mx-auto h-1 w-10 rounded-full bg-white/15" />
            {title ? (
              <div className="mt-2 flex items-center justify-between">
                <h2 id={titleId} className="text-white font-h2 text-[16px]">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center"
                  aria-label="Close sheet"
                >
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="max-h-[85dvh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

