import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Account,
  AppSettings,
  Category,
  ExtractionRule,
  RecurringRule,
  Transaction,
} from '../store/types';
import { DEFAULT_EXTRACTION_RULES } from './extractionRuleTemplates';
import { processRecurringRules } from './recurring';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSACTIONS,
} from './seed';
import type { PendingRecurringInstance } from '../store/types';

const MAX_SMS_DEDUPE_KEYS = 500;

interface SpendtDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-createdAt': string };
  };
  recurringRules: {
    key: string;
    value: RecurringRule;
  };
  categories: {
    key: string;
    value: Category;
  };
  accounts: {
    key: string;
    value: Account;
  };
  settings: {
    key: string;
    value: AppSettings & { key: 'app' };
  };
  meta: {
    key: string;
    value: { key: string; seeded?: boolean; keys?: string[] };
  };
  extractionRules: {
    key: string;
    value: ExtractionRule;
  };
}

const DB_NAME = 'spendt';
const DB_VERSION = 7;

let dbPromise: Promise<IDBPDatabase<SpendtDB>> | null = null;

function ensureAllStores(db: IDBPDatabase<SpendtDB>) {
  if (!db.objectStoreNames.contains('transactions')) {
    const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
    transactionStore.createIndex('by-createdAt', 'createdAt');
  }

  if (!db.objectStoreNames.contains('recurringRules')) {
    db.createObjectStore('recurringRules', { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains('categories')) {
    db.createObjectStore('categories', { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains('settings')) {
    db.createObjectStore('settings', { keyPath: 'key' });
  }

  if (!db.objectStoreNames.contains('meta')) {
    db.createObjectStore('meta', { keyPath: 'key' });
  }

  if (!db.objectStoreNames.contains('accounts')) {
    db.createObjectStore('accounts', { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains('extractionRules')) {
    db.createObjectStore('extractionRules', { keyPath: 'id' });
  }
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SpendtDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        ensureAllStores(db);
      },
    }).catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

function hasExtractionRulesStore(db: IDBPDatabase<SpendtDB>) {
  return db.objectStoreNames.contains('extractionRules');
}

async function ensureSeeded(db: IDBPDatabase<SpendtDB>) {
  const meta = await db.get('meta', 'seed');
  if (meta?.seeded) return;

  const storeNames: Array<
    'transactions' | 'categories' | 'accounts' | 'settings' | 'meta' | 'extractionRules'
  > = ['transactions', 'categories', 'accounts', 'settings', 'meta'];
  if (hasExtractionRulesStore(db)) storeNames.push('extractionRules');

  const tx = db.transaction(storeNames, 'readwrite');

  for (const transaction of DEFAULT_TRANSACTIONS) {
    await tx.objectStore('transactions').put(transaction);
  }

  for (const category of DEFAULT_CATEGORIES) {
    await tx.objectStore('categories').put(category);
  }

  for (const account of DEFAULT_ACCOUNTS) {
    await tx.objectStore('accounts').put(account);
  }

  if (hasExtractionRulesStore(db)) {
    for (const rule of DEFAULT_EXTRACTION_RULES) {
      await tx.objectStore('extractionRules').put(rule);
    }
  }

  await tx.objectStore('settings').put({ key: 'app', ...DEFAULT_SETTINGS });
  await tx.objectStore('meta').put({ key: 'seed', seeded: true });
  await tx.done;
}

async function ensureDefaultExtractionRules(db: IDBPDatabase<SpendtDB>) {
  if (!hasExtractionRulesStore(db)) return;

  const count = await db.count('extractionRules');
  if (count > 0) return;

  const tx = db.transaction('extractionRules', 'readwrite');
  for (const rule of DEFAULT_EXTRACTION_RULES) {
    await tx.store.put(rule);
  }
  await tx.done;
}

async function ensureAccounts(db: IDBPDatabase<SpendtDB>) {
  const accounts = await db.getAll('accounts');
  if (accounts.length > 0) return;

  const tx = db.transaction('accounts', 'readwrite');
  for (const account of DEFAULT_ACCOUNTS) {
    await tx.store.put(account);
  }
  await tx.done;
}

export async function loadPersistedData() {
  const db = await getDb();
  await ensureSeeded(db);
  await ensureAccounts(db);
  await ensureDefaultExtractionRules(db);

  let extractionRules: ExtractionRule[] = [];
  try {
    extractionRules = await db.getAll('extractionRules');
  } catch {
    // ignore — store may not exist on older DBs
  }

  const [transactionsRaw, categoriesRaw, accounts, settingsRecord, recurringRules] = await Promise.all([
    db.getAllFromIndex('transactions', 'by-createdAt'),
    db.getAll('categories'),
    db.getAll('accounts'),
    db.get('settings', 'app'),
    db.getAll('recurringRules'),
  ]);

  const categories: Category[] = categoriesRaw.map((c) => ({
    ...c,
    budgetEnabled: c.budgetEnabled ?? true,
    rolloverEnabled: c.rolloverEnabled ?? false,
  }));

  const transactions: Transaction[] = transactionsRaw.map((tx) => {
    const type = tx.type ?? (tx.amount >= 0 ? 'income' : 'expense');
    if (type === 'transfer') {
      return {
        ...tx,
        type: 'transfer',
        amount: Math.abs(tx.amount),
        accountId: undefined,
        categoryId: undefined,
      };
    }
    if (type === 'expense') {
      return { ...tx, type: 'expense', amount: -Math.abs(tx.amount), fromAccountId: undefined, toAccountId: undefined };
    }
    return { ...tx, type: 'income', amount: Math.abs(tx.amount), categoryId: undefined, fromAccountId: undefined, toAccountId: undefined };
  });

  transactions.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const settings = settingsRecord ?? { key: 'app' as const, ...DEFAULT_SETTINGS };
  const normalizedSettings = {
    currency: settings.currency,
    theme: settings.theme,
    monthlyBudget: settings.monthlyBudget,
    startingNetWorth: settings.startingNetWorth,
    netWorthChangePercent: settings.netWorthChangePercent,
    smsAutoImport: settings.smsAutoImport ?? DEFAULT_SETTINGS.smsAutoImport,
    smsImportMode: settings.smsImportMode ?? DEFAULT_SETTINGS.smsImportMode,
    recurringApplyMode:
      settings.recurringApplyMode ?? DEFAULT_SETTINGS.recurringApplyMode,
    recurringMatchWindowDays:
      settings.recurringMatchWindowDays ?? DEFAULT_SETTINGS.recurringMatchWindowDays,
    recurringAmountTolerancePercent:
      settings.recurringAmountTolerancePercent ??
      DEFAULT_SETTINGS.recurringAmountTolerancePercent,
  };

  const sortedRules = recurringRules.sort(
    (a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime(),
  );

  const recurringResult = processRecurringRules(
    sortedRules,
    transactions,
    normalizedSettings,
    new Date(),
    new Set(),
  );

  const pendingRecurring: PendingRecurringInstance[] = recurringResult.pending;

  if (
    recurringResult.newTransactions.length > 0 ||
    recurringResult.updatedTransactionIds.length > 0 ||
    recurringResult.recurringRules.some(
      (r, i) => r.nextRunAt !== sortedRules[i]?.nextRunAt || r.active !== sortedRules[i]?.active,
    )
  ) {
    const persistTx = db.transaction(['transactions', 'recurringRules'], 'readwrite');
    for (const tx of recurringResult.newTransactions) {
      await persistTx.objectStore('transactions').put(tx);
    }
    for (const id of recurringResult.updatedTransactionIds) {
      const tx = recurringResult.transactions.find((t) => t.id === id);
      if (tx) await persistTx.objectStore('transactions').put(tx);
    }
    for (const rule of recurringResult.recurringRules) {
      await persistTx.objectStore('recurringRules').put(rule);
    }
    await persistTx.done;
  }

  const smsKeysRecord = await db.get('meta', 'smsDedupe');
  const processedSmsKeys = smsKeysRecord?.keys ?? [];

  return {
    transactions: recurringResult.transactions,
    categories,
    accounts,
    settings: normalizedSettings,
    processedSmsKeys,
    extractionRules: extractionRules.sort((a, b) => a.priority - b.priority),
    recurringRules: recurringResult.recurringRules,
    pendingRecurring,
  };
}

export async function saveExtractionRules(rules: ExtractionRule[]) {
  const db = await getDb();
  if (!hasExtractionRulesStore(db)) return;
  const tx = db.transaction('extractionRules', 'readwrite');
  await tx.store.clear();
  for (const rule of rules) {
    await tx.store.put(rule);
  }
  await tx.done;
}

export async function loadSmsDedupeKeys(): Promise<string[]> {
  const db = await getDb();
  const record = await db.get('meta', 'smsDedupe');
  return record?.keys ?? [];
}

export async function saveSmsDedupeKeys(keys: string[]) {
  const db = await getDb();
  const trimmed = keys.slice(-MAX_SMS_DEDUPE_KEYS);
  await db.put('meta', { key: 'smsDedupe', keys: trimmed });
}

export async function saveTransaction(transaction: Transaction) {
  const db = await getDb();
  await db.put('transactions', transaction);
}

export async function deleteStoredTransaction(id: string) {
  const db = await getDb();
  await db.delete('transactions', id);
}

export async function saveCategory(category: Category) {
  const db = await getDb();
  await db.put('categories', category);
}

export async function saveAllCategories(categories: Category[]) {
  const db = await getDb();
  const tx = db.transaction('categories', 'readwrite');
  await Promise.all([
    ...categories.map((category) => tx.store.put(category)),
    tx.done,
  ]);
}

export async function saveAccount(account: Account) {
  const db = await getDb();
  await db.put('accounts', account);
}

export async function saveSettings(settings: AppSettings) {
  const db = await getDb();
  await db.put('settings', { key: 'app', ...settings });
}

export async function saveRecurringRule(rule: RecurringRule) {
  const db = await getDb();
  await db.put('recurringRules', rule);
}

export async function deleteRecurringRule(id: string) {
  const db = await getDb();
  await db.delete('recurringRules', id);
}

export type SpendtBackupV1 = {
  schemaVersion: 1;
  exportedAt: string;
  db: { name: string; version: number };
  data: {
    settings: (AppSettings & { key: 'app' }) | null;
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    extractionRules: ExtractionRule[];
    recurringRules: RecurringRule[];
    meta: Array<{ key: string; seeded?: boolean; keys?: string[] }>;
  };
};

export async function exportFullDatabase(): Promise<SpendtBackupV1> {
  const db = await getDb();
  const [settings, accounts, categories, transactions, extractionRules, recurringRules, meta] =
    await Promise.all([
      db.get('settings', 'app'),
      db.getAll('accounts'),
      db.getAll('categories'),
      db.getAllFromIndex('transactions', 'by-createdAt'),
      (async () => {
        try {
          return await db.getAll('extractionRules');
        } catch {
          return [];
        }
      })(),
      db.getAll('recurringRules'),
      db.getAll('meta'),
    ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    db: { name: DB_NAME, version: DB_VERSION },
    data: {
      settings: settings ?? null,
      accounts,
      categories,
      transactions,
      extractionRules,
      recurringRules,
      meta,
    },
  };
}

export async function restoreFullDatabase(backup: SpendtBackupV1): Promise<void> {
  const db = await getDb();

  // Clear + re-import inside a single multi-store transaction.
  const storeNames: Array<
    'transactions' | 'categories' | 'accounts' | 'settings' | 'meta' | 'extractionRules' | 'recurringRules'
  > = ['transactions', 'categories', 'accounts', 'settings', 'meta', 'recurringRules'];
  if (hasExtractionRulesStore(db)) storeNames.push('extractionRules');

  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map((name) => tx.objectStore(name).clear()));

  const data = backup.data;
  if (data.settings) {
    await tx.objectStore('settings').put(data.settings);
  } else {
    await tx.objectStore('settings').put({ key: 'app', ...DEFAULT_SETTINGS });
  }

  for (const a of data.accounts ?? []) {
    await tx.objectStore('accounts').put(a);
  }
  for (const c of data.categories ?? []) {
    await tx.objectStore('categories').put(c);
  }
  for (const t of data.transactions ?? []) {
    await tx.objectStore('transactions').put(t);
  }
  for (const r of data.recurringRules ?? []) {
    await tx.objectStore('recurringRules').put(r);
  }
  if (hasExtractionRulesStore(db)) {
    for (const r of data.extractionRules ?? []) {
      await tx.objectStore('extractionRules').put(r);
    }
  }

  // Meta is last so seed flags/keys are preserved.
  for (const m of data.meta ?? []) {
    await tx.objectStore('meta').put(m);
  }

  // Ensure the DB doesn't re-seed on next boot if backup omitted meta.
  if (!(data.meta ?? []).some((m) => m.key === 'seed')) {
    await tx.objectStore('meta').put({ key: 'seed', seeded: true });
  }

  await tx.done;
}

/** Deletes IndexedDB and resets the connection so the next read re-seeds defaults. */
export async function clearDatabase() {
  const db = await getDb();
  db.close();
  dbPromise = null;
  await deleteDB(DB_NAME);
}

/** Re-run recurring processing and persist (e.g. after confirm/skip). */
export async function persistRecurringProcessResult(
  transactions: Transaction[],
  recurringRules: RecurringRule[],
  settings: AppSettings,
): Promise<{
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  pending: PendingRecurringInstance[];
}> {
  const result = processRecurringRules(recurringRules, transactions, settings);
  const db = await getDb();
  const tx = db.transaction(['transactions', 'recurringRules'], 'readwrite');
  for (const t of result.newTransactions) {
    await tx.objectStore('transactions').put(t);
  }
  for (const id of result.updatedTransactionIds) {
    const row = result.transactions.find((r) => r.id === id);
    if (row) await tx.objectStore('transactions').put(row);
  }
  for (const rule of result.recurringRules) {
    await tx.objectStore('recurringRules').put(rule);
  }
  await tx.done;
  return {
    transactions: result.transactions,
    recurringRules: result.recurringRules,
    pending: result.pending,
  };
}
