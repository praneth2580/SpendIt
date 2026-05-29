import type {
  AppSettings,
  PendingRecurringInstance,
  RecurringRule,
  Transaction,
} from '../store/types';

const MAX_MISSED_AUTO = 12;

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, maxDay));
  return d;
}

export function computeNextRunAt(rule: RecurringRule, from: Date): Date {
  const interval = Math.max(1, Math.floor(rule.interval));
  const next = new Date(from);
  if (rule.cadence === 'daily') {
    next.setDate(next.getDate() + interval);
  } else if (rule.cadence === 'weekly') {
    next.setDate(next.getDate() + interval * 7);
  } else {
    return addMonths(next, interval);
  }
  return next;
}

export function isRuleEnded(rule: RecurringRule, runAt: Date): boolean {
  if (!rule.endDate) return false;
  const end = new Date(`${rule.endDate}T23:59:59.999`);
  return runAt.getTime() > end.getTime();
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(startOfLocalDay(a).getTime() - startOfLocalDay(b).getTime());
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function amountWithinTolerance(
  expected: number,
  actual: number,
  tolerancePercent: number,
): boolean {
  const exp = Math.abs(expected);
  const act = Math.abs(actual);
  if (exp === 0) return act === 0;
  const tolerance = Math.max(exp * (tolerancePercent / 100), 1);
  return Math.abs(exp - act) <= tolerance;
}

function transactionAmountForMatch(tx: Transaction): number {
  if (tx.type === 'transfer') return Math.abs(tx.amount);
  return Math.abs(tx.amount);
}

function accountsMatchRule(tx: Transaction, rule: RecurringRule): boolean {
  if (rule.type === 'transfer') {
    return (
      tx.type === 'transfer' &&
      tx.fromAccountId === rule.fromAccountId &&
      tx.toAccountId === rule.toAccountId
    );
  }
  return tx.type === rule.type && tx.accountId === rule.accountId;
}

export function findMatchingTransaction(
  rule: RecurringRule,
  transactions: Transaction[],
  dueAt: Date,
  settings: AppSettings,
): Transaction | undefined {
  const windowDays = settings.recurringMatchWindowDays ?? 1;
  const tolerance = settings.recurringAmountTolerancePercent ?? 5;

  const candidates = transactions.filter((tx) => {
    if (tx.recurringRuleId) return false;
    if (tx.type !== rule.type) return false;
    if (!accountsMatchRule(tx, rule)) return false;
    const txDate = new Date(tx.createdAt);
    if (daysBetween(txDate, dueAt) > windowDays) return false;
    return amountWithinTolerance(rule.amount, transactionAmountForMatch(tx), tolerance);
  });

  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    const da = Math.abs(new Date(a.createdAt).getTime() - dueAt.getTime());
    const db = Math.abs(new Date(b.createdAt).getTime() - dueAt.getTime());
    return da - db;
  });

  return candidates[0];
}

export function hasFulfilledRun(
  rule: RecurringRule,
  transactions: Transaction[],
  dueAt: Date,
  settings: AppSettings,
): boolean {
  const windowDays = settings.recurringMatchWindowDays ?? 1;
  return transactions.some((tx) => {
    if (tx.recurringRuleId !== rule.id) return false;
    return daysBetween(new Date(tx.createdAt), dueAt) <= windowDays;
  });
}

export function buildTransactionFromRule(rule: RecurringRule, runAt: Date): Transaction {
  const createdAt = runAt.toISOString();
  if (rule.type === 'transfer') {
    return {
      id: crypto.randomUUID(),
      merchant: rule.name.trim() || 'Transfer',
      createdAt,
      amount: Math.abs(rule.amount),
      icon: 'swap_horiz',
      iconColor: 'primary',
      type: 'transfer',
      fromAccountId: rule.fromAccountId,
      toAccountId: rule.toAccountId,
      recurringRuleId: rule.id,
    };
  }
  return {
    id: crypto.randomUUID(),
    merchant: rule.name.trim() || (rule.type === 'income' ? 'Income' : 'Expense'),
    createdAt,
    amount: rule.type === 'expense' ? -Math.abs(rule.amount) : Math.abs(rule.amount),
    icon: rule.type === 'income' ? 'arrow_downward' : 'payments',
    iconColor: rule.type === 'income' ? 'secondary' : 'white',
    categoryId: rule.type === 'expense' ? rule.categoryId : undefined,
    accountId: rule.accountId,
    type: rule.type,
    recurringRuleId: rule.id,
  };
}

export function createPendingInstance(
  rule: RecurringRule,
  dueAt: Date,
  suggestedMatchId?: string,
): PendingRecurringInstance {
  return {
    id: `${rule.id}-${dueAt.getTime()}`,
    ruleId: rule.id,
    dueAt: dueAt.toISOString(),
    suggestedMatchId,
  };
}

export type RecurringProcessOutput = {
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  pending: PendingRecurringInstance[];
  /** Transactions that were updated (linked) and need persisting */
  updatedTransactionIds: string[];
  /** New transactions to persist */
  newTransactions: Transaction[];
};

/**
 * Process due recurring rules against current transactions.
 * - auto: create missing instances (up to MAX_MISSED_AUTO per rule)
 * - smart: link matches, queue confirm for first unmatched due
 * - confirm: queue confirm for first unmatched due
 */
export function processRecurringRules(
  rules: RecurringRule[],
  transactions: Transaction[],
  settings: AppSettings,
  now = new Date(),
  /** Rule IDs already waiting in the approval queue — do not duplicate */
  queuedRuleIds: ReadonlySet<string> = new Set(),
): RecurringProcessOutput {
  const mode = settings.recurringApplyMode ?? 'smart';
  const pending: PendingRecurringInstance[] = [];
  const newTransactions: Transaction[] = [];
  const updatedTransactionIds: string[] = [];
  let txs = [...transactions];
  const nextRules = rules.map((r) => ({ ...r }));

  for (const rule of nextRules) {
    if (!rule.active) continue;

    let nextRunAt = new Date(rule.nextRunAt);
    if (Number.isNaN(nextRunAt.getTime())) continue;

    let autoCreated = 0;

    while (nextRunAt.getTime() <= now.getTime()) {
      if (isRuleEnded(rule, nextRunAt)) {
        rule.active = false;
        break;
      }

      if (hasFulfilledRun(rule, txs, nextRunAt, settings)) {
        nextRunAt = computeNextRunAt(rule, nextRunAt);
        continue;
      }

      const match = findMatchingTransaction(rule, txs, nextRunAt, settings);
      if (match) {
        const linked = { ...match, recurringRuleId: rule.id };
        txs = txs.map((t) => (t.id === match.id ? linked : t));
        updatedTransactionIds.push(match.id);
        nextRunAt = computeNextRunAt(rule, nextRunAt);
        continue;
      }

      if (mode === 'auto') {
        if (autoCreated >= MAX_MISSED_AUTO) break;
        const created = buildTransactionFromRule(rule, nextRunAt);
        newTransactions.push(created);
        txs = [created, ...txs];
        autoCreated += 1;
        nextRunAt = computeNextRunAt(rule, nextRunAt);
        continue;
      }

      if (queuedRuleIds.has(rule.id)) {
        break;
      }

      pending.push(createPendingInstance(rule, nextRunAt));
      break;
    }

    rule.nextRunAt = nextRunAt.toISOString();
  }

  return {
    transactions: txs,
    recurringRules: nextRules,
    pending,
    updatedTransactionIds,
    newTransactions,
  };
}
