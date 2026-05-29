import type { Transaction } from '../store/types';

export function formatTransactionDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (date >= startOfToday) {
    return `Today, ${time}`;
  }

  if (date >= startOfYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDateGroupLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfWeek) return 'This week';

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatCurrency(
  amount: number,
  currency: string,
  options?: { showSign?: boolean; maximumFractionDigits?: number },
): string {
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    minimumFractionDigits: options?.maximumFractionDigits === 0 ? 0 : 2,
  });

  if (!options?.showSign || amount === 0) return formatted;
  return `${amount > 0 ? '+' : '-'}${formatted}`;
}

export function getCurrencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency
  );
}

export function groupTransactionsByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const label = getDateGroupLabel(transaction.createdAt);
    const existing = groups.get(label) ?? [];
    existing.push(transaction);
    groups.set(label, existing);
  }

  return Array.from(groups.entries());
}

export function getCurrentMonthLabel(referenceDate = new Date()): string {
  return referenceDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
