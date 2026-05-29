import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import Button from './ui/Button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [loading, onClose, open]);

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0"
        style={{ background: 'var(--overlay)' }}
        onClick={loading ? undefined : onClose}
        aria-label="Close dialog"
        disabled={loading}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-float animate-fade-in"
      >
        <div className="flex flex-col gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger-muted">
            <span className="material-symbols-outlined text-danger text-[22px]">
              warning
            </span>
          </div>

          <div>
            <h2 id={titleId} className="text-h2 font-semibold text-fg">
              {title}
            </h2>
            <p id={descriptionId} className="text-muted text-[14px] mt-2 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="danger"
              fullWidth
              disabled={loading}
              onClick={onConfirm}
            >
              {loading ? 'Please wait…' : confirmLabel}
            </Button>
            <Button variant="ghost" fullWidth disabled={loading} onClick={onClose}>
              {cancelLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
