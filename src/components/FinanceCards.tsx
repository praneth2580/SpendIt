import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Account, Category, Transaction } from '../store/types';
import { formatCurrency, formatTransactionDate } from '../lib/format';
import { categoryStyles, iconColorStyles } from '../lib/styles';
import Card from './ui/Card';

type TransactionRowProps = {
  transaction: Transaction;
  currency: string;
  category?: Category;
  account?: Account;
  to?: string;
  onClick?: () => void;
  showChevron?: boolean;
};

const rowInteractiveClass =
  'w-full text-left px-1 py-3 hover:bg-surface-2 rounded-2xl transition-colors block';

export default function TransactionRow({
  transaction,
  currency,
  category,
  account,
  to,
  onClick,
  showChevron = false,
}: TransactionRowProps) {
  const iconStyle = iconColorStyles[transaction.iconColor];
  const isIncome = transaction.amount > 0;
  const showNavAffordance = showChevron || Boolean(to);

  const inner = (
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={clsx(
              'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border',
              iconStyle.bg,
              iconStyle.border,
            )}
          >
            <span className={clsx('material-symbols-outlined', iconStyle.text)}>
              {transaction.icon}
            </span>
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-fg font-medium truncate">{transaction.merchant}</span>
            <span className="text-muted text-[12px] truncate">
              {formatTransactionDate(transaction.createdAt)}
              {category ? ` · ${category.name}` : ''}
              {account ? ` · ${account.name}` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={clsx(
              'font-semibold tabular-nums text-[15px]',
              isIncome ? 'text-success' : 'text-fg',
            )}
          >
            {formatCurrency(transaction.amount, currency, { showSign: true })}
          </span>
          {showNavAffordance ? (
            <span className="material-symbols-outlined text-muted text-[18px]">
              chevron_right
            </span>
          ) : null}
        </div>
      </div>
  );

  if (to) {
    return (
      <Link to={to} className={rowInteractiveClass}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowInteractiveClass}>
        {inner}
      </button>
    );
  }

  return <div className="flex items-center justify-between group w-full py-1">{inner}</div>;
}

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: 'brand' | 'success' | 'danger';
};

export function StatCard({ label, value, hint, accent = 'brand' }: StatCardProps) {
  const valueColor =
    accent === 'success'
      ? 'text-success'
      : accent === 'danger'
        ? 'text-danger'
        : 'text-fg';

  return (
    <Card padding="md" className="!p-4">
      <span className="section-label">{label}</span>
      <div className={clsx('text-h1 font-semibold mt-2 tabular-nums tracking-tight', valueColor)}>
        {value}
      </div>
      {hint ? <div className="text-muted text-[12px] mt-1">{hint}</div> : null}
    </Card>
  );
}

type CategoryChipProps = {
  category: Category;
  currency: string;
  to?: string;
};

export function CategoryChip({ category, currency, to }: CategoryChipProps) {
  const styles = categoryStyles[category.color];
  const percent =
    category.budget > 0 ? Math.min(100, (category.spent / category.budget) * 100) : 0;

  const content = (
    <>
      <div
        className={clsx(
          'w-10 h-10 rounded-2xl flex items-center justify-center border',
          styles.bg,
          styles.border,
        )}
      >
        <span className={clsx('material-symbols-outlined text-[20px]', styles.text)}>
          {category.icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted truncate">
          {category.name}
        </div>
        <div className="text-fg font-semibold tabular-nums mt-0.5">
          {formatCurrency(category.spent, currency, { maximumFractionDigits: 0 })}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className={clsx('h-full rounded-full', styles.bar)} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </>
  );

  const className =
    'snap-start shrink-0 w-44 bg-surface rounded-3xl border border-border p-4 flex gap-3 hover:bg-elevated transition-colors shadow-card';

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
