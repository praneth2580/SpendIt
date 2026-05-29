import { useMemo } from 'react';
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

export default function Transactions() {
  const { transactions, settings, categories, accounts, user } = useAppSelector(
    (state) => state.app,
  );
  const currency = settings.currency;

  const categoryMap = useMemo(() => getCategoryMap(categories), [categories]);
  const accountMap = useMemo(() => getAccountMap(accounts), [accounts]);
  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions],
  );
  const monthlyIncome = useMemo(
    () => computeMonthlyIncome(transactions),
    [transactions],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-muted text-[14px] mt-1">
            {transactions.length} total
          </p>
        </div>
      </div>

      {transactions.length > 0 ? (
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
        {transactions.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No transactions"
            description="Start tracking by adding your first entry."
            action={{ label: 'Add transaction', to: '/add' }}
          />
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
                      transaction.accountId
                        ? accountMap.get(transaction.accountId)
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
    </div>
  );
}
