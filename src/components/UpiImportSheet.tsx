import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from './BottomSheet';
import PickerTile, { PickerRail } from './PickerTile';
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
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [saving, setSaving] = useState(false);

  const action = pending?.action;

  useEffect(() => {
    if (!pending || !action) return;
    setNote(action.promptNote ? '' : action.merchant);
    setCategoryId(
      action.categoryId ?? (pending.type === 'expense' ? (categories[0]?.id ?? '') : ''),
    );
    setAccountId(action.accountId ?? accounts[0]?.id ?? '');
  }, [pending?.id, action, categories, accounts]);

  if (!pending || !action) return null;

  const showCategory =
    pending.type === 'expense' && (action.promptCategory || !action.categoryId);
  const showAccount = action.promptAccount || !action.accountId;
  const showNote = action.promptNote;

  const selectedCategory = categories.find((item) => item.id === categoryId);
  const displayNote = (showNote ? note : action.merchant).trim() || action.merchant;

  const dismiss = () => {
    void dispatch(markSmsProcessed(pending.dedupeKey));
    dispatch(clearPendingUpiImport());
  };

  const save = async () => {
    const resolvedAccountId = accountId || action.accountId;
    const resolvedCategoryId =
      pending.type === 'expense' ? categoryId || action.categoryId : undefined;

    if (!resolvedAccountId || (pending.type === 'expense' && !resolvedCategoryId)) {
      navigate(
        `/add-expense?amount=${pending.amount}&merchant=${encodeURIComponent(displayNote)}&type=${action.type}`,
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
            action.type === 'expense'
              ? -Math.abs(pending.amount)
              : Math.abs(pending.amount),
          icon:
            action.type === 'income'
              ? 'arrow_downward'
              : (selectedCategory?.icon ?? 'payments'),
          iconColor: action.type === 'income' ? 'secondary' : 'white',
          categoryId: resolvedCategoryId,
          accountId: resolvedAccountId,
          type: action.type,
        }),
      );
      await dispatch(markSmsProcessed(pending.dedupeKey));
      dispatch(clearPendingUpiImport());
    } finally {
      setSaving(false);
    }
  };

  const editInForm = () => {
    const params = new URLSearchParams({
      amount: String(pending.amount),
      merchant: displayNote,
      type: action.type,
    });
    if (categoryId) params.set('categoryId', categoryId);
    if (accountId) params.set('accountId', accountId);
    navigate(`/add-expense?${params.toString()}`);
    dismiss();
  };

  const canSave =
    Boolean(accountId || action.accountId) &&
    (pending.type !== 'expense' || Boolean(categoryId || action.categoryId));

  return (
    <BottomSheet
      open
      title="UPI transaction detected"
      onClose={dismiss}
      maxWidthClassName="max-w-md"
    >
      <div className="px-4 pb-4 flex flex-col gap-4">
        {action.ruleName ? (
          <div className="rounded-xl bg-brand-muted border border-brand/25 px-3 py-2 text-[12px] text-brand">
            Matched rule: <span className="font-semibold">{action.ruleName}</span>
          </div>
        ) : null}

        <div className="rounded-2xl bg-surface-2 border border-border p-4">
          <p className="text-muted text-[12px] uppercase tracking-wide">Amount</p>
          <p className="text-display font-bold text-fg tabular-nums mt-1">
            {formatCurrency(
              action.type === 'expense' ? -pending.amount : pending.amount,
              settings.currency,
            )}
          </p>
          <p className="text-muted text-[13px] mt-2 capitalize">{action.type}</p>
          {pending.sender ? (
            <p className="text-subtle text-[12px] mt-2 truncate">From {pending.sender}</p>
          ) : null}
        </div>

        {showAccount ? (
          <div>
            <p className="section-label mb-2">
              Account
              {action.promptAccount && action.accountId ? (
                <span className="text-brand font-normal"> · confirm</span>
              ) : null}
            </p>
            {accounts.length === 0 ? (
              <p className="text-muted text-[13px]">Add an account in Settings first.</p>
            ) : (
              <PickerRail>
                {accounts.map((account) => (
                  <PickerTile
                    key={account.id}
                    active={account.id === accountId}
                    onClick={() => setAccountId(account.id)}
                    icon={account.icon}
                    label={account.name}
                  />
                ))}
              </PickerRail>
            )}
          </div>
        ) : null}

        {showCategory ? (
          <div>
            <p className="section-label mb-2">
              Category
              {action.promptCategory && action.categoryId ? (
                <span className="text-brand font-normal"> · confirm</span>
              ) : null}
            </p>
            {categories.length === 0 ? (
              <p className="text-muted text-[13px]">Add a category in Settings first.</p>
            ) : (
              <PickerRail>
                {categories.map((category) => (
                  <PickerTile
                    key={category.id}
                    active={category.id === categoryId}
                    onClick={() => setCategoryId(category.id)}
                    icon={category.icon}
                    label={category.name}
                  />
                ))}
              </PickerRail>
            )}
          </div>
        ) : null}

        {showNote ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="upi-note" className="text-fg text-[13px] font-medium">
              Name / note
              {action.promptNote ? (
                <span className="text-brand font-normal"> · required</span>
              ) : null}
            </label>
            <input
              id="upi-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={action.merchant}
              className="input-field"
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-2 border border-border px-4 py-3">
            <p className="text-subtle text-[12px]">Note</p>
            <p className="text-fg text-[14px] mt-1">{action.merchant}</p>
          </div>
        )}

        <p className="text-subtle text-[12px] line-clamp-3">{pending.body}</p>

        <div className="flex flex-col gap-2">
          <Button fullWidth disabled={saving || !canSave} onClick={() => void save()}>
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
