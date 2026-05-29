import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Account,
  AppSettings,
  Category,
  ExtractionRule,
  Transaction,
} from '../store/types';
import { DEFAULT_EXTRACTION_RULES } from './extractionRuleTemplates';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSACTIONS,
} from './seed';

const MAX_SMS_DEDUPE_KEYS = 500;

interface SpendtDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-createdAt': string };
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
const DB_VERSION = 5;

let dbPromise: Promise<IDBPDatabase<SpendtDB>> | null = null;

function ensureAllStores(db: IDBPDatabase<SpendtDB>) {
  if (!db.objectStoreNames.contains('transactions')) {
    const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
    transactionStore.createIndex('by-createdAt', 'createdAt');
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
    extractionRules = [];
  }

  const [transactions, categories, accounts, settingsRecord] = await Promise.all([
    db.getAllFromIndex('transactions', 'by-createdAt'),
    db.getAll('categories'),
    db.getAll('accounts'),
    db.get('settings', 'app'),
  ]);

  transactions.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const settings = settingsRecord ?? { key: 'app' as const, ...DEFAULT_SETTINGS };
  const smsKeysRecord = await db.get('meta', 'smsDedupe');
  const processedSmsKeys = smsKeysRecord?.keys ?? [];

  return {
    transactions,
    categories,
    accounts,
    settings: {
      currency: settings.currency,
      theme: settings.theme,
      monthlyBudget: settings.monthlyBudget,
      startingNetWorth: settings.startingNetWorth,
      netWorthChangePercent: settings.netWorthChangePercent,
      smsAutoImport: settings.smsAutoImport ?? DEFAULT_SETTINGS.smsAutoImport,
      smsImportMode: settings.smsImportMode ?? DEFAULT_SETTINGS.smsImportMode,
    },
    processedSmsKeys,
    extractionRules: extractionRules.sort((a, b) => a.priority - b.priority),
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

/** Deletes IndexedDB and resets the connection so the next read re-seeds defaults. */
export async function clearDatabase() {
  const db = await getDb();
  db.close();
  dbPromise = null;
  await deleteDB(DB_NAME);
}
