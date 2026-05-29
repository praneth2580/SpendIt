import { useState } from 'react';
import clsx from 'clsx';
import { useAppDispatch } from '../store/hooks';
import { addAccount } from '../store/appSlice';
import type { Account } from '../store/types';
import { ACCOUNT_TYPE_OPTIONS, COLOR_OPTIONS } from '../lib/seed';
import { categoryStyles } from '../lib/styles';
import Button from './ui/Button';

type AccountFormProps = {
  onCreated?: (accountId: string) => void;
  onCancel?: () => void;
};

export default function AccountForm({ onCreated, onCancel }: AccountFormProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('checking');
  const [startingBalance, setStartingBalance] = useState('0');
  const [color, setColor] = useState<Account['color']>('primary');
  const [saving, setSaving] = useState(false);

  const selectedType = ACCOUNT_TYPE_OPTIONS.find((option) => option.value === type);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedBalance = Number.parseFloat(startingBalance);
    if (!trimmedName || !Number.isFinite(parsedBalance)) return;

    setSaving(true);
    const result = await dispatch(
      addAccount({
        name: trimmedName,
        type,
        icon: selectedType?.icon ?? 'account_balance',
        color,
        startingBalance: parsedBalance,
      }),
    );
    setSaving(false);

    if (addAccount.fulfilled.match(result)) {
      onCreated?.(result.payload.accountId);
      setName('');
      setStartingBalance('0');
      setType('checking');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-2">
        <label htmlFor="account-name" className="text-fg text-[13px] font-medium">
          Account name
        </label>
        <input
          id="account-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Main Checking"
          className="input-field"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-medium">Type</span>
        <div className="grid grid-cols-2 gap-2">
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={clsx(
                'py-3 rounded-2xl border flex flex-col items-center gap-1 transition-colors',
                type === option.value
                  ? 'border-brand/40 bg-brand-muted'
                  : 'border-border bg-surface-2 hover:bg-elevated',
              )}
            >
              <span className="material-symbols-outlined text-[20px] text-muted">
                {option.icon}
              </span>
              <span className="text-[11px] text-fg font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="account-balance" className="text-fg text-[13px] font-medium">
          Starting balance
        </label>
        <input
          id="account-balance"
          type="number"
          step="0.01"
          value={startingBalance}
          onChange={(event) => setStartingBalance(event.target.value)}
          className="input-field"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-medium">Accent</span>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((option) => {
            const styles = categoryStyles[option];
            return (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                className={clsx(
                  'flex-1 py-2 rounded-xl border text-[12px] font-medium capitalize transition-colors',
                  color === option
                    ? `${styles.border} ${styles.bg} text-fg`
                    : 'border-border text-muted hover:bg-surface-2',
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" fullWidth disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
