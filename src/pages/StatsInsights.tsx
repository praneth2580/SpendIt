import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  computeMonthlyIncome,
  computePreviousMonthSpent,
  getTopCategory,
} from '../lib/aggregates';
import { formatCurrency, getCurrentMonthLabel } from '../lib/format';
import { categoryStyles } from '../lib/styles';
import EmptyState from '../components/EmptyState';
import { StatCard } from '../components/FinanceCards';
import Card from '../components/ui/Card';

export default function StatsInsights() {
  const { categories, transactions, user, settings } = useAppSelector((state) => state.app);
  const currency = settings.currency;
  const monthLabel = getCurrentMonthLabel();

  const monthlyIncome = useMemo(() => computeMonthlyIncome(transactions), [transactions]);
  const previousMonthSpent = useMemo(
    () => computePreviousMonthSpent(transactions),
    [transactions],
  );
  const budgetCategories = useMemo(
    () => categories.filter((c) => c.budgetEnabled),
    [categories],
  );
  const topCategory = useMemo(() => getTopCategory(budgetCategories), [budgetCategories]);
  const sortedCategories = useMemo(
    () => [...budgetCategories].sort((a, b) => b.spent - a.spent),
    [budgetCategories],
  );
  const netSavings = monthlyIncome - user.monthlySpent;
  const spendingChange =
    previousMonthSpent > 0
      ? ((user.monthlySpent - previousMonthSpent) / previousMonthSpent) * 100
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Insights</h1>
        <p className="text-muted text-[14px] mt-1">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Spent"
          value={formatCurrency(user.monthlySpent, currency, { maximumFractionDigits: 0 })}
          hint={
            spendingChange === null
              ? 'No prior month'
              : `${spendingChange >= 0 ? '+' : ''}${spendingChange.toFixed(0)}% vs last month`
          }
        />
        <StatCard
          label="Income"
          value={formatCurrency(monthlyIncome, currency, { maximumFractionDigits: 0 })}
          accent="success"
        />
        <StatCard
          label="Net"
          value={formatCurrency(netSavings, currency, {
            maximumFractionDigits: 0,
            showSign: true,
          })}
          hint={netSavings >= 0 ? 'Saved' : 'Deficit'}
          accent={netSavings >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          label="Budget left"
          value={formatCurrency(
            Math.max(0, user.monthlyBudget - user.monthlySpent),
            currency,
            { maximumFractionDigits: 0 },
          )}
          hint={`${user.monthlyBudget > 0 ? Math.min(100, (user.monthlySpent / user.monthlyBudget) * 100).toFixed(0) : 0}% used`}
        />
      </div>

      {topCategory && topCategory.spent > 0 ? (
        <Card variant="gradient">
          <p className="section-label">Top category</p>
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${categoryStyles[topCategory.color].bg} ${categoryStyles[topCategory.color].border}`}
            >
              <span
                className={`material-symbols-outlined ${categoryStyles[topCategory.color].text}`}
              >
                {topCategory.icon}
              </span>
            </div>
            <div>
              <div className="text-fg font-semibold text-h2">{topCategory.name}</div>
              <div className="text-muted text-[13px] tabular-nums">
                {formatCurrency(topCategory.spent, currency, { maximumFractionDigits: 0 })}{' '}
                this month
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 font-semibold text-fg">By category</h2>
          <span className="text-muted text-[12px]">This month</span>
        </div>

        {sortedCategories.length === 0 ? (
          <EmptyState
            icon="leaderboard"
            title="No data yet"
            description="Add expenses to see category breakdown."
            action={{ label: 'Add expense', to: '/add' }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {sortedCategories.map((category) => {
              const styles = categoryStyles[category.color];
              const percent =
                category.budget > 0
                  ? Math.min(100, (category.spent / category.budget) * 100)
                  : 0;

              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border ${styles.bg} ${styles.border}`}
                      >
                        <span className={`material-symbols-outlined text-[16px] ${styles.text}`}>
                          {category.icon}
                        </span>
                      </div>
                      <span className="text-fg font-medium truncate">{category.name}</span>
                    </div>
                    <div className="text-right text-[13px] tabular-nums">
                      <span className="text-fg font-medium">
                        {formatCurrency(category.spent, currency, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-muted">
                        {' '}
                        /{' '}
                        {formatCurrency(category.budget, currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className={`h-full ${styles.bar}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
