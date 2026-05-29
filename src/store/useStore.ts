import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  computeMonthlySpent,
  computeTotalNetWorth,
  syncCategorySpent,
} from '../lib/aggregates';
import {
  deleteStoredTransaction,
  loadPersistedData,
  saveAllCategories,
  saveSettings,
  saveTransaction,
} from '../lib/db';

export interface Transaction {
  id: string;
  merchant: string;
  createdAt: string;
  amount: number;
  icon: string;
  iconColor: 'white' | 'primary' | 'secondary' | 'tertiary';
  categoryId?: string;
  type: 'expense' | 'income';
}

export interface Category {
  id: string;
  name: string;
  spent: number;
  budget: number;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary';
}

export interface AppSettings {
  currency: string;
  theme: 'dark' | 'light' | 'system';
  monthlyBudget: number;
  startingNetWorth: number;
  netWorthChangePercent: number;
}

interface UserSummary {
  totalNetWorth: number;
  monthlySpent: number;
  monthlyBudget: number;
  netWorthChangePercent: number;
}

interface AppState {
  hydrated: boolean;
  user: UserSummary;
  settings: AppSettings;
  transactions: Transaction[];
  categories: Category[];
  hydrate: () => Promise<void>;
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'createdAt'>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (amount: number) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

function buildUserSummary(
  transactions: Transaction[],
  settings: AppSettings,
): UserSummary {
  return {
    totalNetWorth: computeTotalNetWorth(
      transactions,
      settings.startingNetWorth,
    ),
    monthlySpent: computeMonthlySpent(transactions),
    monthlyBudget: settings.monthlyBudget,
    netWorthChangePercent: settings.netWorthChangePercent,
  };
}

function withDerivedState(
  transactions: Transaction[],
  categories: Category[],
  settings: AppSettings,
) {
  const syncedCategories = syncCategorySpent(categories, transactions);

  return {
    transactions,
    categories: syncedCategories,
    settings,
    user: buildUserSummary(transactions, settings),
  };
}

export const useStore = create<AppState>((set, get) => ({
  hydrated: false,
  user: {
    totalNetWorth: 0,
    monthlySpent: 0,
    monthlyBudget: 0,
    netWorthChangePercent: 0,
  },
  settings: {
    currency: 'USD',
    theme: 'dark',
    monthlyBudget: 0,
    startingNetWorth: 0,
    netWorthChangePercent: 0,
  },
  transactions: [],
  categories: [],

  hydrate: async () => {
    const data = await loadPersistedData();
    set({
      hydrated: true,
      ...withDerivedState(data.transactions, data.categories, data.settings),
    });
  },

  addTransaction: async (transaction) => {
    const nextTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    const state = get();
    const nextTransactions = [nextTransaction, ...state.transactions];
    const nextState = withDerivedState(
      nextTransactions,
      state.categories,
      state.settings,
    );

    set(nextState);
    await saveTransaction(nextTransaction);
    await saveAllCategories(nextState.categories);
  },

  deleteTransaction: async (id) => {
    const state = get();
    const nextTransactions = state.transactions.filter(
      (transaction) => transaction.id !== id,
    );
    const nextState = withDerivedState(
      nextTransactions,
      state.categories,
      state.settings,
    );

    set(nextState);
    await deleteStoredTransaction(id);
    await saveAllCategories(nextState.categories);
  },

  updateBudget: async (amount) => {
    const state = get();
    const nextSettings = { ...state.settings, monthlyBudget: amount };
    const nextState = withDerivedState(
      state.transactions,
      state.categories,
      nextSettings,
    );

    set(nextState);
    await saveSettings(nextSettings);
  },

  updateSettings: async (partial) => {
    const state = get();
    const nextSettings = { ...state.settings, ...partial };
    const nextState = withDerivedState(
      state.transactions,
      state.categories,
      nextSettings,
    );

    set(nextState);
    await saveSettings(nextSettings);
  },
}));
