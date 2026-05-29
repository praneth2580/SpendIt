import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteTransaction, updateTransaction } from '../store/appSlice';
import { formatCurrency, formatTransactionDate, getCurrencySymbol } from '../lib/format';
import PickerTile, { PickerRail } from '../components/PickerTile';
import { categoryStyles, iconColorStyles } from '../lib/styles';

function toDatetimeLocalValue(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { transactions, categories, accounts, settings } = useAppSelector(
    (state) => state.app,
  );

  const transaction = useMemo(
    () => transactions.find((item) => item.id === id),
    [id, transactions],
  );

  const [type, setType] = useState<'expense' | 'income' | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [createdAtLocal, setCreatedAtLocal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const resolvedType = type ?? transaction?.type ?? 'expense';
  const resolvedAmount =
    amount ??
    (transaction ? String(Math.abs(transaction.amount)) : '');
  const resolvedMerchant = merchant ?? transaction?.merchant ?? '';
  const resolvedCategoryId =
    categoryId ?? transaction?.categoryId ?? categories[0]?.id ?? '';
  const resolvedAccountId =
    accountId ?? transaction?.accountId ?? accounts[0]?.id ?? '';
  const resolvedCreatedAt =
    createdAtLocal ??
    (transaction ? toDatetimeLocalValue(transaction.createdAt) : '');

  const currency = settings.currency;
  const currencySymbol = getCurrencySymbol(currency);
  const selectedCategory = categories.find((c) => c.id === resolvedCategoryId);
  const selectedAccount = accounts.find((a) => a.id === resolvedAccountId);
  const parsedAmount = Number.parseFloat(resolvedAmount);
  const amountIsValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  if (!transaction) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-brand text-[14px] font-medium w-fit"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back
        </Link>
        <Card padding="lg" className="text-center">
          <p className="text-fg font-semibold">Transaction not found</p>
          <p className="text-muted text-[14px] mt-2">
            It may have been deleted or the link is invalid.
          </p>
          <Button to="/transactions" className="mt-4">
            View all transactions
          </Button>
        </Card>
      </div>
    );
  }

  const iconStyle = iconColorStyles[transaction.iconColor];

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !amountIsValid ||
      !selectedAccount ||
      (resolvedType === 'expense' && !selectedCategory)
    ) {
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        updateTransaction({
          id: transaction.id,
          merchant:
            resolvedMerchant.trim() ||
            (resolvedType === 'income'
              ? 'Income'
              : (selectedCategory?.name ?? 'Expense')),
          amount:
            resolvedType === 'expense'
              ? -Math.abs(parsedAmount)
              : Math.abs(parsedAmount),
          icon:
            resolvedType === 'income'
              ? 'arrow_downward'
              : (selectedCategory?.icon ?? transaction.icon),
          iconColor: resolvedType === 'income' ? 'secondary' : 'white',
          categoryId: resolvedType === 'expense' ? selectedCategory?.id : undefined,
          accountId: selectedAccount.id,
          type: resolvedType,
          createdAt: fromDatetimeLocalValue(resolvedCreatedAt),
        }),
      ).unwrap();
      navigate('/transactions');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteTransaction(transaction.id)).unwrap();
      navigate('/transactions');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="h-10 w-10 rounded-2xl border border-border bg-surface-2 hover:bg-elevated transition-colors flex items-center justify-center shrink-0"
            aria-label="Back to transactions"
          >
            <span className="material-symbols-outlined text-muted">arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="page-title truncate">Edit transaction</h1>
            <p className="text-muted text-[13px] mt-0.5">
              {formatTransactionDate(transaction.createdAt)}
            </p>
          </div>
        </div>

        <Card padding="md" className="flex items-center gap-4">
          <div
            className={clsx(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border',
              iconStyle.bg,
              iconStyle.border,
            )}
          >
            <span className={clsx('material-symbols-outlined', iconStyle.text)}>
              {transaction.icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-fg font-semibold truncate">{transaction.merchant}</p>
            <p
              className={clsx(
                'text-h2 font-bold tabular-nums mt-0.5',
                transaction.amount > 0 ? 'text-success' : 'text-fg',
              )}
            >
              {formatCurrency(transaction.amount, currency, { showSign: true })}
            </p>
          </div>
        </Card>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex p-1 rounded-2xl bg-surface-2 border border-border">
            {(['expense', 'income'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-[14px] font-medium capitalize transition-all',
                  resolvedType === value
                    ? 'bg-surface text-fg shadow-card'
                    : 'text-muted',
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div>
            <label className="section-label mb-2 block" htmlFor="tx-amount">
              Amount
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 py-3">
              <span className="text-muted text-[15px]">{currencySymbol}</span>
              <input
                id="tx-amount"
                type="text"
                inputMode="decimal"
                value={resolvedAmount}
                onChange={(event) => {
                  const cleaned = event.target.value.replace(/[^\d.]/g, '');
                  const [intPart, ...rest] = cleaned.split('.');
                  const dec = rest.join('');
                  setAmount(
                    rest.length === 0 ? intPart : `${intPart}.${dec.slice(0, 2)}`,
                  );
                }}
                className="flex-1 bg-transparent text-fg text-h2 font-semibold tabular-nums outline-none"
              />
            </div>
          </div>

          <div>
            <label className="section-label mb-2 block" htmlFor="tx-merchant">
              Description
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3">
              <span className="material-symbols-outlined text-muted">edit_note</span>
              <input
                id="tx-merchant"
                type="text"
                value={resolvedMerchant}
                onChange={(event) => setMerchant(event.target.value)}
                className="flex-1 bg-transparent text-fg outline-none placeholder:text-subtle"
                placeholder="Merchant or note"
              />
            </div>
          </div>

          <div>
            <label className="section-label mb-2 block" htmlFor="tx-date">
              Date & time
            </label>
            <input
              id="tx-date"
              type="datetime-local"
              value={resolvedCreatedAt}
              onChange={(event) => setCreatedAtLocal(event.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <p className="section-label mb-2">Account</p>
            {accounts.length === 0 ? (
              <p className="text-muted text-[13px]">
                Add an account in{' '}
                <Link to="/settings" className="text-brand">
                  Settings
                </Link>
                .
              </p>
            ) : (
              <PickerRail>
                {accounts.map((account) => (
                  <PickerTile
                    key={account.id}
                    active={account.id === resolvedAccountId}
                    onClick={() => setAccountId(account.id)}
                    icon={account.icon}
                    label={account.name}
                  />
                ))}
              </PickerRail>
            )}
          </div>

          {resolvedType === 'expense' ? (
            <div>
              <p className="section-label mb-2">Category</p>
              {categories.length === 0 ? (
                <p className="text-muted text-[13px]">
                  Create a category when adding expenses from the home screen.
                </p>
              ) : (
                <PickerRail>
                  {categories.map((category) => {
                    const styles = categoryStyles[category.color];
                    const active = category.id === resolvedCategoryId;
                    return (
                      <PickerTile
                        key={category.id}
                        active={active}
                        onClick={() => setCategoryId(category.id)}
                        icon={category.icon}
                        label={category.name}
                        iconClassName={active ? styles.text : 'text-muted'}
                      />
                    );
                  })}
                </PickerRail>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-success-muted border border-success/20 px-4 py-3 text-success text-[13px]">
              Income is not tied to a spending category.
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              fullWidth
              disabled={
                saving ||
                deleting ||
                !amountIsValid ||
                !selectedAccount ||
                (resolvedType === 'expense' && !selectedCategory)
              }
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              disabled={saving || deleting}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete transaction
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete transaction?"
        description={`"${transaction.merchant}" will be removed permanently. Account balances and category totals will update.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => {
          if (!deleting) setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}
