import { useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  computeMonthlyIncome,
  getAccountMap,
  getCategoryMap,
} from '../lib/aggregates';
import { formatCurrency, groupTransactionsByDate } from '../lib/format';
import EmptyState from '../components/EmptyState';
import TransactionRow, { StatCard } from '../components/FinanceCards';
import Card from '../components/ui/Card';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/ui/Button';
import { useSearchParams } from 'react-router-dom';
import {
  applyTransactionFilters,
  defaultTransactionFilters,
  getDefaultCustomStartEnd,
  parseTransactionFiltersFromSearchParams,
  sanitizeTransactionFilters,
  writeTransactionFiltersToSearchParams,
  type TransactionFilters,
} from '../lib/transactionFilters';

export default function Transactions() {
  const { transactions, settings, categories, accounts, user } = useAppSelector(
    (state) => state.app,
  );
  const currency = settings.currency;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilters = useMemo(
    () => sanitizeTransactionFilters(parseTransactionFiltersFromSearchParams(searchParams)),
    [searchParams],
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(activeFilters);

  const categoryMap = useMemo(() => getCategoryMap(categories), [categories]);
  const accountMap = useMemo(() => getAccountMap(accounts), [accounts]);
  const filteredTransactions = useMemo(
    () => applyTransactionFilters(transactions, activeFilters),
    [transactions, activeFilters],
  );
  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );
  const monthlyIncome = useMemo(
    () => computeMonthlyIncome(filteredTransactions),
    [filteredTransactions],
  );
  const hasActiveFilters = useMemo(() => {
    const d = defaultTransactionFilters();
    const f = activeFilters;
    return (
      f.preset !== d.preset ||
      (f.q ?? '') !== (d.q ?? '') ||
      (f.type ?? 'all') !== (d.type ?? 'all') ||
      (f.categoryId ?? '') !== (d.categoryId ?? '') ||
      (f.accountId ?? '') !== (d.accountId ?? '') ||
      (f.fromAccountId ?? '') !== (d.fromAccountId ?? '') ||
      (f.toAccountId ?? '') !== (d.toAccountId ?? '') ||
      (f.amountMin ?? null) !== (d.amountMin ?? null) ||
      (f.amountMax ?? null) !== (d.amountMax ?? null) ||
      (f.start ?? '') !== (d.start ?? '') ||
      (f.end ?? '') !== (d.end ?? '') ||
      (f.recurring ?? 'all') !== (d.recurring ?? 'all')
    );
  }, [activeFilters]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-muted text-[14px] mt-1">
            {filteredTransactions.length} of {transactions.length}
          </p>
        </div>
        <Button
          variant={hasActiveFilters ? 'secondary' : 'ghost'}
          onClick={() => {
            setDraftFilters(activeFilters);
            setFilterSheetOpen(true);
          }}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Filters{hasActiveFilters ? ' •' : ''}
        </Button>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Income"
            value={formatCurrency(monthlyIncome, currency, { maximumFractionDigits: 0 })}
            accent="success"
          />
          <StatCard
            label="Expenses"
            value={formatCurrency(user.monthlySpent, currency, { maximumFractionDigits: 0 })}
          />
        </div>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div>
            <EmptyState
              icon="receipt_long"
              title={transactions.length === 0 ? 'No transactions' : 'No matches'}
              description={
                transactions.length === 0
                  ? 'Start tracking by adding your first entry.'
                  : 'Try adjusting your filters to see more results.'
              }
              action={transactions.length === 0 ? { label: 'Add transaction', to: '/add' } : undefined}
            />
            {transactions.length > 0 ? (
              <div className="px-4 pb-6 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
                >
                  Clear filters
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          groupedTransactions.map(([label, items]) => (
            <div key={label}>
              <div className="px-4 py-2.5 bg-surface-2 border-b border-border">
                <span className="section-label">{label}</span>
              </div>
              <div className="px-3 py-1">
                {items.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    currency={currency}
                    category={
                      transaction.categoryId
                        ? categoryMap.get(transaction.categoryId)
                        : undefined
                    }
                    account={
                      transaction.accountId ? accountMap.get(transaction.accountId) : undefined
                    }
                    fromAccount={
                      transaction.fromAccountId
                        ? accountMap.get(transaction.fromAccountId)
                        : undefined
                    }
                    toAccount={
                      transaction.toAccountId
                        ? accountMap.get(transaction.toAccountId)
                        : undefined
                    }
                    showChevron
                    to={`/transactions/${transaction.id}`}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </Card>

      <BottomSheet
        open={filterSheetOpen}
        title="Filters"
        onClose={() => setFilterSheetOpen(false)}
        maxWidthClassName="max-w-lg"
      >
        <div className="px-5 pb-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Date</span>
              <select
                className="input-field"
                value={draftFilters.preset}
                onChange={(e) => {
                  const preset = e.target.value as TransactionFilters['preset'];
                  setDraftFilters((prev) => {
                    if (preset === 'custom') {
                      const { start, end } = getDefaultCustomStartEnd();
                      return { ...prev, preset, start: prev.start ?? start, end: prev.end ?? end };
                    }
                    return { ...prev, preset, start: undefined, end: undefined };
                  });
                }}
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
                <option value="last30">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Type</span>
              <select
                className="input-field"
                value={draftFilters.type ?? 'all'}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    type:
                      e.target.value === 'expense' ||
                      e.target.value === 'income' ||
                      e.target.value === 'transfer'
                        ? e.target.value
                        : 'all',
                    categoryId: e.target.value === 'transfer' ? undefined : prev.categoryId,
                    fromAccountId: e.target.value === 'transfer' ? prev.fromAccountId : undefined,
                    toAccountId: e.target.value === 'transfer' ? prev.toAccountId : undefined,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>
          </div>

          {draftFilters.preset === 'custom' ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-fg text-[13px] font-medium">From</span>
                <input
                  type="date"
                  className="input-field"
                  value={draftFilters.start ?? ''}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, start: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-fg text-[13px] font-medium">To</span>
                <input
                  type="date"
                  className="input-field"
                  value={draftFilters.end ?? ''}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, end: e.target.value }))}
                />
              </label>
            </div>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-medium">Search</span>
            <input
              className="input-field"
              placeholder="Merchant or note text…"
              value={draftFilters.q ?? ''}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, q: e.target.value }))}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Min amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={draftFilters.amountMin ?? ''}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    amountMin: e.target.value === '' ? undefined : Number.parseFloat(e.target.value),
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Max amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={draftFilters.amountMax ?? ''}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    amountMax: e.target.value === '' ? undefined : Number.parseFloat(e.target.value),
                  }))
                }
              />
            </label>
          </div>

          {draftFilters.type !== 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-fg text-[13px] font-medium">Account</span>
                <select
                  className="input-field"
                  value={draftFilters.accountId ?? ''}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      accountId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-fg text-[13px] font-medium">Category</span>
                <select
                  className="input-field"
                  value={draftFilters.categoryId ?? ''}
                  disabled={draftFilters.type !== 'expense'}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      categoryId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {draftFilters.type !== 'expense' ? (
                  <span className="text-subtle text-[12px]">Category applies to expenses only.</span>
                ) : null}
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-fg text-[13px] font-medium">From account</span>
                <select
                  className="input-field"
                  value={draftFilters.fromAccountId ?? ''}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      fromAccountId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-fg text-[13px] font-medium">To account</span>
                <select
                  className="input-field"
                  value={draftFilters.toAccountId ?? ''}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      toAccountId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 col-span-2">
                <span className="text-fg text-[13px] font-medium">Any account</span>
                <select
                  className="input-field"
                  value={draftFilters.accountId ?? ''}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      accountId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <span className="text-subtle text-[12px]">
                  Matches either “from” or “to”. Use the fields above to match specifically.
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => {
                setDraftFilters(defaultTransactionFilters());
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              fullWidth
              onClick={() => {
                const sanitized = sanitizeTransactionFilters(draftFilters);
                const nextParams = writeTransactionFiltersToSearchParams(
                  searchParams,
                  sanitized,
                );
                setSearchParams(nextParams, { replace: true });
                setFilterSheetOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
