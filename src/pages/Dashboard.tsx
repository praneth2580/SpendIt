import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { formatCurrency, getCurrentMonthLabel } from '../lib/format';
import { categoryStyles } from '../lib/styles';
import EmptyState from '../components/EmptyState';
import TransactionRow, { CategoryChip } from '../components/FinanceCards';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { user, categories, transactions, settings, accounts } = useAppSelector(
    (state) => state.app,
  );

  const currency = settings.currency;
  const monthLabel = getCurrentMonthLabel();
  const recentTransactions = transactions.slice(0, 5);
  const sortedCategories = [...categories].sort((a, b) => b.spent - a.spent);
  const budgetUsagePercent =
    user.monthlyBudget > 0
      ? Math.min(100, (user.monthlySpent / user.monthlyBudget) * 100)
      : 0;
  const categorySegments = sortedCategories
    .filter((category) => category.spent > 0)
    .map((category) => ({
      id: category.id,
      width:
        user.monthlySpent > 0
          ? (category.spent / user.monthlySpent) * budgetUsagePercent
          : 0,
      color: category.color,
    }));
  const trendIsPositive = user.netWorthChangePercent >= 0;

  return (
    <>
      <Card variant="gradient" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="section-label">Total balance</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <h1 className="text-display font-bold text-fg tabular-nums tracking-tight">
              {formatCurrency(user.totalNetWorth, currency)}
            </h1>
            <span
              className={`chip mb-1 ${
                trendIsPositive
                  ? 'bg-success-muted text-success'
                  : 'bg-danger-muted text-danger'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {trendIsPositive ? 'trending_up' : 'trending_down'}
              </span>
              {trendIsPositive ? '+' : ''}
              {user.netWorthChangePercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-muted text-[13px] mt-2">{monthLabel}</p>

          <div className="mt-6 flex gap-3">
            <Button to="/add?type=income" size="lg" className="flex-1">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Income
            </Button>
            <Button to="/add?type=expense" variant="secondary" size="lg" className="flex-1">
              <span className="material-symbols-outlined text-[20px]">remove</span>
              Expense
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-h2 font-semibold text-fg">Monthly budget</h2>
              <span className="text-muted text-[12px]">{monthLabel}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Spent', value: user.monthlySpent, tone: 'text-fg' },
                {
                  label: 'Budget',
                  value: user.monthlyBudget,
                  tone: 'text-muted',
                },
                {
                  label: 'Remaining',
                  value: Math.max(0, user.monthlyBudget - user.monthlySpent),
                  tone: 'text-success',
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-surface-2 p-3 border border-border">
                  <div className="section-label">{item.label}</div>
                  <div className={`text-h2 font-semibold tabular-nums mt-1 ${item.tone}`}>
                    {formatCurrency(item.value, currency, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[12px] text-muted mb-2 tabular-nums">
              <span>{budgetUsagePercent.toFixed(0)}% used</span>
              <span>{transactions.length} transactions</span>
            </div>

            <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden flex">
              {categorySegments.length > 0 ? (
                categorySegments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className={`h-full ${categoryStyles[segment.color].bar} ${index > 0 ? '-ml-0.5' : ''}`}
                    style={{ width: `${Math.max(0, segment.width)}%` }}
                  />
                ))
              ) : (
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              )}
            </div>
          </Card>

          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-h2 font-semibold text-fg">Accounts</h2>
              <Link to="/settings" className="text-brand text-[13px] font-medium hover:underline">
                Manage
              </Link>
            </div>
            {accounts.length === 0 ? (
              <Card>
                <EmptyState
                  icon="account_balance"
                  title="No accounts"
                  description="Add accounts to track balances separately."
                  action={{ label: 'Add account', to: '/settings' }}
                />
              </Card>
            ) : (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {accounts.map((account) => {
                  const styles = categoryStyles[account.color];
                  return (
                    <Card key={account.id} padding="md" className="shrink-0 w-44 !p-4">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center border mb-3 ${styles.bg} ${styles.border}`}
                      >
                        <span className={`material-symbols-outlined ${styles.text}`}>
                          {account.icon}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted truncate">
                        {account.name}
                      </div>
                      <div className="text-fg font-semibold tabular-nums mt-1">
                        {formatCurrency(account.balance, currency, {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-h2 font-semibold text-fg">Categories</h2>
              <Link to="/stats" className="text-brand text-[13px] font-medium hover:underline">
                View insights
              </Link>
            </div>
            {sortedCategories.length === 0 ? (
              <Card>
                <EmptyState
                  icon="category"
                  title="No categories"
                  description="Create categories to track spending."
                  action={{ label: 'Add expense', to: '/add' }}
                />
              </Card>
            ) : (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {sortedCategories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    category={category}
                    currency={currency}
                    to="/stats"
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2 font-semibold text-fg">Recent</h2>
              <Link to="/transactions" className="text-brand text-[13px] font-medium hover:underline">
                See all
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <EmptyState
                icon="receipt_long"
                title="No activity yet"
                description="Your latest transactions appear here."
                action={{ label: 'Add transaction', to: '/add' }}
              />
            ) : (
              <div className="flex flex-col gap-1 -mx-1">
                {recentTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    currency={currency}
                    category={
                      transaction.categoryId
                        ? categories.find((c) => c.id === transaction.categoryId)
                        : undefined
                    }
                    account={
                      transaction.accountId
                        ? accounts.find((a) => a.id === transaction.accountId)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
