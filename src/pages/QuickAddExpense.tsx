import { useState } from 'react';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addTransaction } from '../store/appSlice';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrencySymbol } from '../lib/format';
import BottomSheet from '../components/BottomSheet';
import CategoryForm from '../components/CategoryForm';
import PickerTile, { PickerRail, pickerTileClass } from '../components/PickerTile';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type QuickAddExpenseProps = {
  embedded?: boolean;
  onDone?: () => void;
};

export default function QuickAddExpense({ embedded = false, onDone }: QuickAddExpenseProps) {
  const [searchParams] = useSearchParams();
  const initialAmount = searchParams.get('amount') ?? '';
  const initialNote =
    searchParams.get('merchant') ??
    searchParams.get('note') ??
    searchParams.get('text') ??
    '';
  const urlType = searchParams.get('type') === 'income' ? 'income' : 'expense';
  const urlCategoryId = searchParams.get('categoryId');
  const urlAccountId = searchParams.get('accountId');
  const hasPrefill = Boolean(initialAmount);

  const [typeOverride, setTypeOverride] = useState<'expense' | 'income' | null>(null);
  const [amount, setAmount] = useState(initialAmount);
  const [note, setNote] = useState(initialNote);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    urlCategoryId,
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(urlAccountId);
  const [showKeypad, setShowKeypad] = useState(!hasPrefill);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const dispatch = useAppDispatch();
  const { categories, accounts, settings } = useAppSelector((state) => state.app);
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol(settings.currency);

  const type = typeOverride ?? urlType;
  const activeCategoryId =
    selectedCategoryId ?? urlCategoryId ?? categories[0]?.id ?? '';
  const activeAccountId = selectedAccountId ?? urlAccountId ?? accounts[0]?.id ?? '';
  const selectedCategory = categories.find((c) => c.id === activeCategoryId);
  const selectedAccount = accounts.find((a) => a.id === activeAccountId);

  const parsedAmount = Number.parseFloat(amount);
  const amountIsValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const clampAmountString = (next: string) => {
    const cleaned = next.replace(/[^\d.]/g, '');
    const [intPart, ...rest] = cleaned.split('.');
    const dec = rest.join('');
    if (rest.length === 0) return intPart;
    return `${intPart}.${dec.slice(0, 2)}`;
  };

  const formatDisplayAmount = (raw: string) => {
    if (!raw) return '0.00';
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return '0.00';
    return n.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountIsValid || (type === 'expense' && !selectedCategory) || !selectedAccount) return;

    await dispatch(
      addTransaction({
        merchant:
          note.trim() ||
          (type === 'income' ? 'Income' : (selectedCategory?.name ?? 'Expense')),
        amount: type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount),
        icon: type === 'income' ? 'arrow_downward' : (selectedCategory?.icon ?? 'payments'),
        iconColor: type === 'income' ? 'secondary' : 'white',
        categoryId: type === 'expense' ? selectedCategory?.id : undefined,
        accountId: selectedAccount.id,
        type,
      }),
    );

    if (onDone) onDone();
    else navigate('/');
  };

  return (
    <div className={embedded ? 'w-full' : 'max-w-md mx-auto w-full'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex p-1 rounded-2xl bg-surface-2 border border-border">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeOverride(t)}
              className={clsx(
                'flex-1 py-2.5 rounded-xl text-[14px] font-medium capitalize transition-all',
                type === t ? 'bg-surface text-fg shadow-card' : 'text-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowKeypad(true)}
          className="w-full rounded-3xl border border-border bg-surface-2 p-6 text-center hover:bg-elevated transition-colors"
        >
          <span className="text-muted text-[15px]">{currencySymbol}</span>
          <div className="text-display font-bold text-fg tabular-nums tracking-tight mt-1">
            {formatDisplayAmount(amount)}
          </div>
          <p className="text-subtle text-[12px] mt-2">Tap to edit amount</p>
        </button>

        {showKeypad ? (
          <Card padding="md">
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'back') setAmount((p) => p.slice(0, -1));
                    else setAmount((p) => clampAmountString(p + (key === '.' ? '.' : key)));
                  }}
                  className="h-12 rounded-2xl bg-surface-2 border border-border text-fg font-medium hover:bg-elevated active:scale-95 transition-all flex items-center justify-center"
                >
                  {key === 'back' ? (
                    <span className="material-symbols-outlined">backspace</span>
                  ) : (
                    key
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button type="button" variant="ghost" fullWidth onClick={() => setAmount('')}>
                Clear
              </Button>
              <Button
                type="button"
                fullWidth
                disabled={!amountIsValid}
                onClick={() => setShowKeypad(false)}
              >
                Continue
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div>
              <p className="section-label mb-2">Account</p>
              {accounts.length === 0 ? (
                <p className="text-muted text-[13px]">Add an account in Settings first.</p>
              ) : (
                <PickerRail>
                  {accounts.map((account) => (
                    <PickerTile
                      key={account.id}
                      active={account.id === activeAccountId}
                      onClick={() => setSelectedAccountId(account.id)}
                      icon={account.icon}
                      label={account.name}
                    />
                  ))}
                </PickerRail>
              )}
            </div>

            {type === 'expense' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="section-label">Category</p>
                  <button
                    type="button"
                    onClick={() => setShowCategorySheet(true)}
                    className="text-brand text-[12px] font-semibold"
                  >
                    + New
                  </button>
                </div>
                {categories.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowCategorySheet(true)}
                    className="w-full py-4 rounded-2xl border border-dashed border-border text-muted text-[13px]"
                  >
                    Create your first category
                  </button>
                ) : (
                  <PickerRail>
                    {categories.map((c) => (
                      <PickerTile
                        key={c.id}
                        active={c.id === activeCategoryId}
                        onClick={() => setSelectedCategoryId(c.id)}
                        icon={c.icon}
                        label={c.name}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCategorySheet(true)}
                      className={pickerTileClass(
                        false,
                        'border-dashed !border-border bg-transparent text-brand hover:bg-brand-muted/50',
                      )}
                    >
                      <span className="material-symbols-outlined text-[22px]">add</span>
                      <span className="text-[11px] font-medium">New</span>
                    </button>
                  </PickerRail>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-success-muted border border-success/20 px-4 py-3 text-success text-[13px]">
                Income will increase your account balance and net worth.
              </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3">
              <span className="material-symbols-outlined text-muted">edit_note</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-transparent text-fg outline-none placeholder:text-subtle"
                placeholder="Note (optional)"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={() => setShowKeypad(true)}>
                Edit amount
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={
                  !amountIsValid || !selectedAccount || (type === 'expense' && !selectedCategory)
                }
              >
                Save {type === 'expense' ? 'expense' : 'income'}
              </Button>
            </div>
          </>
        )}
      </form>

      <BottomSheet
        open={showCategorySheet}
        title="New category"
        onClose={() => setShowCategorySheet(false)}
      >
        <CategoryForm
          onCreated={(id) => {
            setSelectedCategoryId(id);
            setShowCategorySheet(false);
          }}
          onCancel={() => setShowCategorySheet(false)}
        />
      </BottomSheet>
    </div>
  );
}
