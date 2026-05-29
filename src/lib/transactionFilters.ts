import type { Transaction, TransactionType } from '../store/types';

export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'last30' | 'custom';

export type TransactionFilters = {
  preset: DatePreset;
  start?: string; // yyyy-mm-dd (local)
  end?: string; // yyyy-mm-dd (local)
  amountMin?: number;
  amountMax?: number;
  q?: string;
  type?: TransactionType | 'all';
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  recurring?: 'all' | 'recurring' | 'nonrecurring';
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalYmd(ymd: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function defaultTransactionFilters(): TransactionFilters {
  return { preset: 'all', type: 'all', recurring: 'all' };
}

export function parseTransactionFiltersFromSearchParams(
  params: URLSearchParams,
): TransactionFilters {
  const presetParam = params.get('preset') as DatePreset | null;
  const preset: DatePreset =
    presetParam && ['all', 'today', 'week', 'month', 'last30', 'custom'].includes(presetParam)
      ? presetParam
      : 'all';

  const typeParam = params.get('type');
  const type: TransactionFilters['type'] =
    typeParam === 'expense' || typeParam === 'income' || typeParam === 'transfer'
      ? typeParam
      : typeParam === 'all'
        ? 'all'
        : 'all';

  const recurringParam = params.get('recurring');
  const recurring: TransactionFilters['recurring'] =
    recurringParam === 'recurring' || recurringParam === 'nonrecurring'
      ? recurringParam
      : 'all';

  const start = params.get('start') ?? undefined;
  const end = params.get('end') ?? undefined;

  return {
    preset,
    start,
    end,
    amountMin: parseNumber(params.get('min')),
    amountMax: parseNumber(params.get('max')),
    q: params.get('q')?.trim() || undefined,
    type,
    categoryId: params.get('cat') ?? undefined,
    accountId: params.get('acc') ?? undefined,
    fromAccountId: params.get('from') ?? undefined,
    toAccountId: params.get('to') ?? undefined,
    recurring,
  };
}

export function writeTransactionFiltersToSearchParams(
  params: URLSearchParams,
  filters: TransactionFilters,
) {
  const next = new URLSearchParams(params);
  const clearKeys = ['preset', 'start', 'end', 'min', 'max', 'q', 'type', 'cat', 'acc', 'from', 'to', 'recurring'];
  for (const key of clearKeys) next.delete(key);

  if (filters.preset && filters.preset !== 'all') next.set('preset', filters.preset);
  if (filters.preset === 'custom') {
    if (filters.start) next.set('start', filters.start);
    if (filters.end) next.set('end', filters.end);
  }
  if (typeof filters.amountMin === 'number' && Number.isFinite(filters.amountMin)) {
    next.set('min', String(filters.amountMin));
  }
  if (typeof filters.amountMax === 'number' && Number.isFinite(filters.amountMax)) {
    next.set('max', String(filters.amountMax));
  }
  if (filters.q) next.set('q', filters.q);
  if (filters.type && filters.type !== 'all') next.set('type', filters.type);
  if (filters.categoryId) next.set('cat', filters.categoryId);
  if (filters.accountId) next.set('acc', filters.accountId);
  if (filters.fromAccountId) next.set('from', filters.fromAccountId);
  if (filters.toAccountId) next.set('to', filters.toAccountId);
  if (filters.recurring && filters.recurring !== 'all') next.set('recurring', filters.recurring);
  return next;
}

export function getPresetDateRange(preset: DatePreset, now = new Date()): { start?: Date; end?: Date } {
  if (preset === 'all') return {};

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  if (preset === 'today') return { start: startOfToday, end: endOfToday };

  if (preset === 'week') {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 7);
    return { start, end: endOfToday };
  }

  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: endOfToday };
  }

  if (preset === 'last30') {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 30);
    return { start, end: endOfToday };
  }

  return {};
}

export function normalizeCustomRange(filters: TransactionFilters): { start?: Date; end?: Date } {
  if (filters.preset !== 'custom') return {};
  const start = filters.start ? parseLocalYmd(filters.start) : null;
  const end = filters.end ? parseLocalYmd(filters.end) : null;
  if (!start && !end) return {};
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    // end is inclusive in UI; convert to exclusive bound by adding 1 day
    e.setDate(e.getDate() + 1);
    if (e.getTime() < s.getTime()) return { start: e, end: s };
    return { start: s, end: e };
  }
  if (start) {
    const s = new Date(start);
    return { start: s };
  }
  if (end) {
    const e = new Date(end);
    e.setDate(e.getDate() + 1);
    return { end: e };
  }
  return {};
}

export function getDefaultCustomStartEnd(now = new Date()): { start: string; end: string } {
  return { start: toLocalYmd(now), end: toLocalYmd(now) };
}

export function sanitizeTransactionFilters(filters: TransactionFilters): TransactionFilters {
  const next: TransactionFilters = { ...defaultTransactionFilters(), ...filters };
  const q = next.q?.trim();
  next.q = q ? q : undefined;

  if (typeof next.amountMin === 'number' && Number.isFinite(next.amountMin)) {
    next.amountMin = clampNumber(next.amountMin, 0, 1_000_000_000);
  } else {
    next.amountMin = undefined;
  }

  if (typeof next.amountMax === 'number' && Number.isFinite(next.amountMax)) {
    next.amountMax = clampNumber(next.amountMax, 0, 1_000_000_000);
  } else {
    next.amountMax = undefined;
  }

  if (next.amountMin != null && next.amountMax != null && next.amountMin > next.amountMax) {
    const tmp = next.amountMin;
    next.amountMin = next.amountMax;
    next.amountMax = tmp;
  }

  if (next.preset !== 'custom') {
    next.start = undefined;
    next.end = undefined;
  } else {
    if (next.start && !parseLocalYmd(next.start)) next.start = undefined;
    if (next.end && !parseLocalYmd(next.end)) next.end = undefined;
  }

  if (next.type === 'transfer') {
    next.categoryId = undefined;
  }

  return next;
}

export function applyTransactionFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
  const f = sanitizeTransactionFilters(filters);

  const q = f.q?.toLowerCase();
  const min = f.amountMin;
  const max = f.amountMax;

  const range =
    f.preset === 'custom' ? normalizeCustomRange(f) : getPresetDateRange(f.preset);

  const startMs = range.start?.getTime();
  const endMs = range.end?.getTime();

  return transactions.filter((tx) => {
    if (f.type && f.type !== 'all' && tx.type !== f.type) return false;
    if (f.categoryId && tx.categoryId !== f.categoryId) return false;

    if (f.accountId) {
      if (tx.type === 'transfer') {
        if (tx.fromAccountId !== f.accountId && tx.toAccountId !== f.accountId) return false;
      } else {
        if (tx.accountId !== f.accountId) return false;
      }
    }

    if (f.fromAccountId && tx.type === 'transfer' && tx.fromAccountId !== f.fromAccountId) return false;
    if (f.toAccountId && tx.type === 'transfer' && tx.toAccountId !== f.toAccountId) return false;
    if ((f.fromAccountId || f.toAccountId) && tx.type !== 'transfer') return false;

    if (q) {
      const merchant = tx.merchant?.toLowerCase() ?? '';
      if (!merchant.includes(q)) return false;
    }

    const amountAbs = Math.abs(tx.amount);
    if (typeof min === 'number' && amountAbs < min) return false;
    if (typeof max === 'number' && amountAbs > max) return false;

    if (startMs != null || endMs != null) {
      const createdAtMs = new Date(tx.createdAt).getTime();
      if (Number.isNaN(createdAtMs)) return false;
      if (startMs != null && createdAtMs < startMs) return false;
      if (endMs != null && createdAtMs >= endMs) return false;
    }

    // recurring filter is forward-compatible; if recurringRuleId exists later, apply it.
    if (f.recurring && f.recurring !== 'all') {
      const hasRecurringRule = (tx as Transaction & { recurringRuleId?: string }).recurringRuleId != null;
      if (f.recurring === 'recurring' && !hasRecurringRule) return false;
      if (f.recurring === 'nonrecurring' && hasRecurringRule) return false;
    }

    return true;
  });
}

