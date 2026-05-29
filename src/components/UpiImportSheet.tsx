import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from './BottomSheet';
import Button from './ui/Button';
import { formatCurrency } from '../lib/format';
import {
  addTransaction,
  clearPendingUpiImport,
  markSmsProcessed,
} from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export default function UpiImportSheet() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pending = useAppSelector((state) => state.app.pendingUpiImport);
  const { settings, categories, accounts } = useAppSelector((state) => state.app);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!pending) return null;

  const displayNote = note || pending.merchant;
  const defaultCategory = categories[0];
  const defaultAccount = accounts[0];

  const dismiss = () => {
    void dispatch(markSmsProcessed(pending.dedupeKey));
    dispatch(clearPendingUpiImport());
  };

  const save = async () => {
    if (!defaultAccount || (pending.type === 'expense' && !defaultCategory)) {
      navigate(
        `/add-expense?amount=${pending.amount}&merchant=${encodeURIComponent(displayNote)}&type=${pending.type}`,
      );
      dismiss();
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        addTransaction({
          merchant: displayNote,
          amount:
            pending.type === 'expense'
              ? -Math.abs(pending.amount)
              : Math.abs(pending.amount),
          icon:
            pending.type === 'income'
              ? 'arrow_downward'
              : (defaultCategory?.icon ?? 'payments'),
          iconColor: pending.type === 'income' ? 'secondary' : 'white',
          categoryId: pending.type === 'expense' ? defaultCategory?.id : undefined,
          accountId: defaultAccount.id,
          type: pending.type,
        }),
      );
      await dispatch(markSmsProcessed(pending.dedupeKey));
      dispatch(clearPendingUpiImport());
    } finally {
      setSaving(false);
    }
  };

  const editInForm = () => {
    navigate(
      `/add-expense?amount=${pending.amount}&merchant=${encodeURIComponent(displayNote)}&type=${pending.type}`,
    );
    dismiss();
  };

  return (
    <BottomSheet
      open
      title="UPI transaction detected"
      onClose={dismiss}
      maxWidthClassName="max-w-md"
    >
      <div className="px-4 pb-4 flex flex-col gap-4">
        <div className="rounded-2xl bg-surface-2 border border-border p-4">
          <p className="text-muted text-[12px] uppercase tracking-wide">Amount</p>
          <p className="text-display font-bold text-fg tabular-nums mt-1">
            {formatCurrency(
              pending.type === 'expense' ? -pending.amount : pending.amount,
              settings.currency,
            )}
          </p>
          <p className="text-muted text-[13px] mt-2 capitalize">{pending.type}</p>
          {pending.sender ? (
            <p className="text-subtle text-[12px] mt-2 truncate">From {pending.sender}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="upi-note" className="text-fg text-[13px] font-medium">
            Name / note
          </label>
          <input
            id="upi-note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={pending.merchant}
            className="input-field"
          />
        </div>

        <p className="text-subtle text-[12px] line-clamp-3">{pending.body}</p>

        <div className="flex flex-col gap-2">
          <Button fullWidth disabled={saving} onClick={() => void save()}>
            Save transaction
          </Button>
          <Button variant="secondary" fullWidth onClick={editInForm}>
            Edit details
          </Button>
          <Button variant="ghost" fullWidth onClick={dismiss}>
            Ignore
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
