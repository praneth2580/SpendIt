import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppSettings, Category, Transaction } from '../store/useStore';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSACTIONS,
} from './seed';

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
  settings: {
    key: string;
    value: AppSettings & { key: 'app' };
  };
  meta: {
    key: string;
    value: { key: string; seeded: boolean };
  };
}

const DB_NAME = 'spendt';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SpendtDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SpendtDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const transactionStore = db.createObjectStore('transactions', {
          keyPath: 'id',
        });
        transactionStore.createIndex('by-createdAt', 'createdAt');

        db.createObjectStore('categories', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'key' });
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }

  return dbPromise;
}

async function ensureSeeded(db: IDBPDatabase<SpendtDB>) {
  const meta = await db.get('meta', 'seed');
  if (meta?.seeded) return;

  const tx = db.transaction(
    ['transactions', 'categories', 'settings', 'meta'],
    'readwrite',
  );

  for (const transaction of DEFAULT_TRANSACTIONS) {
    await tx.objectStore('transactions').put(transaction);
  }

  for (const category of DEFAULT_CATEGORIES) {
    await tx.objectStore('categories').put(category);
  }

  await tx.objectStore('settings').put({ key: 'app', ...DEFAULT_SETTINGS });
  await tx.objectStore('meta').put({ key: 'seed', seeded: true });
  await tx.done;
}

export async function loadPersistedData() {
  const db = await getDb();
  await ensureSeeded(db);

  const [transactions, categories, settingsRecord] = await Promise.all([
    db.getAllFromIndex('transactions', 'by-createdAt'),
    db.getAll('categories'),
    db.get('settings', 'app'),
  ]);

  transactions.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const settings = settingsRecord ?? { key: 'app' as const, ...DEFAULT_SETTINGS };

  return {
    transactions,
    categories,
    settings: {
      currency: settings.currency,
      theme: settings.theme,
      monthlyBudget: settings.monthlyBudget,
      startingNetWorth: settings.startingNetWorth,
      netWorthChangePercent: settings.netWorthChangePercent,
    },
  };
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

export async function saveSettings(settings: AppSettings) {
  const db = await getDb();
  await db.put('settings', { key: 'app', ...settings });
}
