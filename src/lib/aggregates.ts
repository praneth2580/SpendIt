import type { Category, Transaction } from '../store/useStore';

function isCurrentMonth(isoDate: string, referenceDate: Date): boolean {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

export function computeMonthlySpent(
  transactions: Transaction[],
  referenceDate = new Date(),
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.amount < 0 &&
        isCurrentMonth(transaction.createdAt, referenceDate),
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}

export function computeTotalNetWorth(
  transactions: Transaction[],
  startingNetWorth: number,
): number {
  return (
    startingNetWorth +
    transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  );
}

export function syncCategorySpent(
  categories: Category[],
  transactions: Transaction[],
  referenceDate = new Date(),
): Category[] {
  const spentByCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (!transaction.categoryId || transaction.amount >= 0) continue;
    if (!isCurrentMonth(transaction.createdAt, referenceDate)) continue;

    spentByCategory.set(
      transaction.categoryId,
      (spentByCategory.get(transaction.categoryId) ?? 0) +
        Math.abs(transaction.amount),
    );
  }

  return categories.map((category) => ({
    ...category,
    spent: spentByCategory.get(category.id) ?? 0,
  }));
}
