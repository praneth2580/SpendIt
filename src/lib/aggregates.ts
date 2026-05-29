import type { Account, Category, Transaction } from '../store/types';

function isCurrentMonth(isoDate: string, referenceDate: Date): boolean {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

function isPreviousMonth(isoDate: string, referenceDate: Date): boolean {
  const date = new Date(isoDate);
  const previousMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - 1,
    1,
  );
  return (
    date.getFullYear() === previousMonth.getFullYear() &&
    date.getMonth() === previousMonth.getMonth()
  );
}

export function computeMonthlySpent(
  transactions: Transaction[],
  referenceDate = new Date(),
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        isCurrentMonth(transaction.createdAt, referenceDate),
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}

export function computeMonthlyIncome(
  transactions: Transaction[],
  referenceDate = new Date(),
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === 'income' &&
        isCurrentMonth(transaction.createdAt, referenceDate),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function computeTotalNetWorth(
  transactions: Transaction[],
  startingNetWorth: number,
): number {
  return (
    startingNetWorth +
    transactions.reduce(
      (sum, transaction) =>
        transaction.type === 'transfer' ? sum : sum + transaction.amount,
      0,
    )
  );
}

export function computeNetWorthChangePercent(
  transactions: Transaction[],
  startingNetWorth: number,
  referenceDate = new Date(),
): number {
  const startOfMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );

  const netWorthAtMonthStart =
    startingNetWorth +
    transactions
      .filter((transaction) => new Date(transaction.createdAt) < startOfMonth)
      .reduce(
        (sum, transaction) =>
          transaction.type === 'transfer' ? sum : sum + transaction.amount,
        0,
      );

  const currentNetWorth = computeTotalNetWorth(transactions, startingNetWorth);

  if (netWorthAtMonthStart === 0) {
    return currentNetWorth === 0 ? 0 : 100;
  }

  return (
    ((currentNetWorth - netWorthAtMonthStart) / Math.abs(netWorthAtMonthStart)) *
    100
  );
}

export function computePreviousMonthSpent(
  transactions: Transaction[],
  referenceDate = new Date(),
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        isPreviousMonth(transaction.createdAt, referenceDate),
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}

export function syncCategorySpent(
  categories: Category[],
  transactions: Transaction[],
  referenceDate = new Date(),
): Category[] {
  const spentByCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
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

export function getTopCategory(categories: Category[]): Category | undefined {
  return [...categories].sort((a, b) => b.spent - a.spent)[0];
}

export function getCategoryMap(categories: Category[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

export function syncAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
): Account[] {
  const balanceByAccount = new Map<string, number>();

  for (const account of accounts) {
    balanceByAccount.set(account.id, account.startingBalance);
  }

  for (const transaction of transactions) {
    if (transaction.type === 'transfer') {
      const fromId = transaction.fromAccountId;
      const toId = transaction.toAccountId;
      const amt = Math.abs(transaction.amount);
      if (fromId) {
        balanceByAccount.set(fromId, (balanceByAccount.get(fromId) ?? 0) - amt);
      }
      if (toId) {
        balanceByAccount.set(toId, (balanceByAccount.get(toId) ?? 0) + amt);
      }
      continue;
    }

    if (!transaction.accountId) continue;
    balanceByAccount.set(
      transaction.accountId,
      (balanceByAccount.get(transaction.accountId) ?? 0) + transaction.amount,
    );
  }

  return accounts.map((account) => ({
    ...account,
    balance: balanceByAccount.get(account.id) ?? account.startingBalance,
  }));
}

export function computeTotalNetWorthFromAccounts(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

export function getAccountMap(accounts: Account[]) {
  return new Map(accounts.map((account) => [account.id, account]));
}
