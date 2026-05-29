import type { Account, Category, Transaction, TransactionType } from '../store/types';

export type CsvRow = Record<string, string>;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === ',') {
      out.push(current);
      current = '';
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      current += ch;
    }
  }

  out.push(current);
  return out;
}

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text
    .replace(/\uFEFF/g, '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = splitCsvLine(lines[0] ?? '').map((h) => h.trim());
  const headers = rawHeaders.map((h) => normalizeHeader(h));

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const row: CsvRow = {};
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i]!;
      row[key] = (cols[i] ?? '').trim();
    }
    rows.push(row);
  }

  return { headers, rows };
}

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: Array<Record<string, string | number | undefined | null>>): string {
  const normalized = headers.map(normalizeHeader);
  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(','));
  for (const row of rows) {
    lines.push(
      normalized
        .map((h) => {
          const v = row[h];
          return csvEscape(v == null ? '' : String(v));
        })
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

export const TRANSACTIONS_CSV_HEADERS = [
  'id',
  'createdAt',
  'type',
  'amount',
  'merchant',
  'category',
  'account',
  'fromAccount',
  'toAccount',
  'icon',
  'iconColor',
  'recurringRuleId',
] as const;

export type TransactionsCsvHeader = (typeof TRANSACTIONS_CSV_HEADERS)[number];

export type TransactionImportPreview = {
  toCreate: Array<{
    id: string;
    createdAt: string;
    type: TransactionType;
    amount: number;
    merchant: string;
    icon: string;
    iconColor: Transaction['iconColor'];
    categoryName?: string;
    accountName?: string;
    fromAccountName?: string;
    toAccountName?: string;
    recurringRuleId?: string;
  }>;
  skippedExisting: number;
  skippedInvalid: number;
  missingAccounts: string[];
  missingCategories: string[];
};

function getByNameCaseInsensitive<T extends { name: string }>(items: T[], name: string): T | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return items.find((i) => i.name.trim().toLowerCase() === n);
}

function buildTransactionDedupeKey(tx: {
  createdAt: string;
  type: TransactionType;
  amount: number;
  merchant: string;
  categoryName?: string;
  accountName?: string;
  fromAccountName?: string;
  toAccountName?: string;
}) {
  return [
    tx.createdAt,
    tx.type,
    String(tx.amount),
    tx.merchant.trim().toLowerCase(),
    (tx.categoryName ?? '').trim().toLowerCase(),
    (tx.accountName ?? '').trim().toLowerCase(),
    (tx.fromAccountName ?? '').trim().toLowerCase(),
    (tx.toAccountName ?? '').trim().toLowerCase(),
  ].join('|');
}

export function exportTransactionsCsv(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
): string {
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));
  const accountById = new Map(accounts.map((a) => [a.id, a.name]));

  const rows = transactions.map((tx) => ({
    id: tx.id,
    createdat: tx.createdAt,
    type: tx.type,
    amount: tx.amount,
    merchant: tx.merchant,
    category: tx.categoryId ? (categoryById.get(tx.categoryId) ?? '') : '',
    account: tx.accountId ? (accountById.get(tx.accountId) ?? '') : '',
    fromaccount: tx.fromAccountId ? (accountById.get(tx.fromAccountId) ?? '') : '',
    toaccount: tx.toAccountId ? (accountById.get(tx.toAccountId) ?? '') : '',
    icon: tx.icon,
    iconcolor: tx.iconColor,
    recurringruleid: tx.recurringRuleId ?? '',
  }));

  return toCsv([...TRANSACTIONS_CSV_HEADERS], rows);
}

export function exportAccountsCsv(accounts: Account[]): string {
  const headers = ['id', 'name', 'type', 'icon', 'color', 'startingBalance', 'balance'];
  const rows = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    icon: a.icon,
    color: a.color,
    startingbalance: a.startingBalance,
    balance: a.balance,
  }));
  return toCsv(headers, rows);
}

export function exportCategoriesCsv(categories: Category[]): string {
  const headers = ['id', 'name', 'icon', 'color', 'budget', 'budgetEnabled', 'rolloverEnabled'];
  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    budget: c.budget,
    budgetenabled: c.budgetEnabled ? 'true' : 'false',
    rolloverenabled: c.rolloverEnabled ? 'true' : 'false',
  }));
  return toCsv(headers, rows);
}

export function buildTransactionsImportPreview(args: {
  csvText: string;
  existingTransactions: Transaction[];
  existingAccounts: Account[];
  existingCategories: Category[];
}): TransactionImportPreview {
  const { rows } = parseCsv(args.csvText);
  const existingId = new Set(args.existingTransactions.map((t) => t.id));

  const categoryById = new Map(args.existingCategories.map((c) => [c.id, c.name]));
  const accountById = new Map(args.existingAccounts.map((a) => [a.id, a.name]));
  const existingDedupe = new Set(
    args.existingTransactions.map((t) =>
      buildTransactionDedupeKey({
        createdAt: t.createdAt,
        type: t.type,
        amount: t.amount,
        merchant: t.merchant,
        categoryName: t.categoryId ? categoryById.get(t.categoryId) : undefined,
        accountName: t.accountId ? accountById.get(t.accountId) : undefined,
        fromAccountName: t.fromAccountId ? accountById.get(t.fromAccountId) : undefined,
        toAccountName: t.toAccountId ? accountById.get(t.toAccountId) : undefined,
      }),
    ),
  );

  const missingAccountsSet = new Map<string, string>(); // normalized -> original
  const missingCategoriesSet = new Map<string, string>();

  const toCreate: TransactionImportPreview['toCreate'] = [];
  let skippedExisting = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    const id = row.id?.trim() || crypto.randomUUID();
    if (existingId.has(id)) {
      skippedExisting += 1;
      continue;
    }

    const createdAt = row.createdat?.trim() || row.date?.trim() || row.timestamp?.trim() || '';
    const createdAtIso = createdAt ? new Date(createdAt).toISOString() : '';
    if (!createdAtIso || Number.isNaN(new Date(createdAtIso).getTime())) {
      skippedInvalid += 1;
      continue;
    }

    const typeRaw = (row.type ?? '').trim().toLowerCase();
    const type: TransactionType =
      typeRaw === 'income' || typeRaw === 'transfer' ? (typeRaw as TransactionType) : 'expense';

    const amountRaw = (row.amount ?? '').trim();
    const amount = Number.parseFloat(amountRaw);
    if (!Number.isFinite(amount) || amount === 0) {
      skippedInvalid += 1;
      continue;
    }

    const merchant = (row.merchant ?? row.note ?? row.description ?? '').trim();
    if (!merchant) {
      skippedInvalid += 1;
      continue;
    }

    const icon = (row.icon ?? '').trim() || (type === 'transfer' ? 'swap_horiz' : type === 'income' ? 'arrow_downward' : 'payments');
    const iconColor =
      row.iconcolor === 'primary' || row.iconcolor === 'secondary' || row.iconcolor === 'tertiary'
        ? row.iconcolor
        : type === 'transfer'
          ? 'primary'
          : type === 'income'
            ? 'secondary'
            : 'white';

    const categoryName = (row.category ?? '').trim();
    const accountName = (row.account ?? '').trim();
    const fromAccountName = (row.fromaccount ?? '').trim();
    const toAccountName = (row.toaccount ?? '').trim();

    if (type === 'transfer') {
      if (!fromAccountName || !toAccountName || fromAccountName.toLowerCase() === toAccountName.toLowerCase()) {
        skippedInvalid += 1;
        continue;
      }
    } else {
      if (!accountName) {
        skippedInvalid += 1;
        continue;
      }
      if (type === 'expense' && !categoryName) {
        skippedInvalid += 1;
        continue;
      }
    }

    // Track missing catalog items by name.
    const rememberMissingAccount = (name: string) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized) return;
      if (getByNameCaseInsensitive(args.existingAccounts, name)) return;
      if (!missingAccountsSet.has(normalized)) missingAccountsSet.set(normalized, name.trim());
    };
    const rememberMissingCategory = (name: string) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized) return;
      if (getByNameCaseInsensitive(args.existingCategories, name)) return;
      if (!missingCategoriesSet.has(normalized)) missingCategoriesSet.set(normalized, name.trim());
    };

    if (type === 'transfer') {
      rememberMissingAccount(fromAccountName);
      rememberMissingAccount(toAccountName);
    } else {
      rememberMissingAccount(accountName);
      if (type === 'expense') rememberMissingCategory(categoryName);
    }

    const candidate = {
      id,
      createdAt: createdAtIso,
      type,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      merchant,
      icon,
      iconColor,
      categoryName: type === 'expense' ? categoryName : undefined,
      accountName: type !== 'transfer' ? accountName : undefined,
      fromAccountName: type === 'transfer' ? fromAccountName : undefined,
      toAccountName: type === 'transfer' ? toAccountName : undefined,
      recurringRuleId: row.recurringruleid?.trim() || undefined,
    } satisfies TransactionImportPreview['toCreate'][number];

    const dedupeKey = buildTransactionDedupeKey(candidate);
    if (existingDedupe.has(dedupeKey)) {
      skippedExisting += 1;
      continue;
    }

    existingDedupe.add(dedupeKey);
    toCreate.push(candidate);
  }

  // Keep deterministic ordering (oldest first) for stable imports.
  toCreate.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    toCreate,
    skippedExisting,
    skippedInvalid,
    missingAccounts: [...missingAccountsSet.values()].sort((a, b) => a.localeCompare(b)),
    missingCategories: [...missingCategoriesSet.values()].sort((a, b) => a.localeCompare(b)),
  };
}

