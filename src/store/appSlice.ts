import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  computeMonthlySpent,
  computeNetWorthChangePercent,
  computeTotalNetWorth,
  computeTotalNetWorthFromAccounts,
  syncAccountBalances,
  syncCategorySpent,
} from '../lib/aggregates';
import {
  clearDatabase,
  deleteStoredTransaction,
  loadPersistedData,
  saveAccount,
  saveAllCategories,
  saveCategory,
  saveExtractionRules,
  saveSettings,
  saveSmsDedupeKeys,
  saveTransaction,
} from '../lib/db';
import type {
  AppDataState,
  AppSettings,
  Category,
  ExtractionRule,
  NewAccount,
  NewCategory,
  NewExtractionRule,
  PendingUpiImport,
  Transaction,
  UserSummary,
} from './types';

function buildUserSummary(
  transactions: Transaction[],
  settings: AppSettings,
  accounts: AppDataState['accounts'],
): UserSummary {
  const totalNetWorth =
    accounts.length > 0
      ? computeTotalNetWorthFromAccounts(accounts)
      : computeTotalNetWorth(transactions, settings.startingNetWorth);

  const netWorthChangePercent =
    accounts.length > 0
      ? (() => {
          const startOfMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
          );
          const monthStartTransactions = transactions.filter(
            (transaction) => new Date(transaction.createdAt) < startOfMonth,
          );
          const monthStartAccounts = syncAccountBalances(
            accounts.map((account) => ({
              ...account,
              balance: account.startingBalance,
            })),
            monthStartTransactions,
          );
          const monthStartNetWorth =
            computeTotalNetWorthFromAccounts(monthStartAccounts);

          if (monthStartNetWorth === 0) {
            return totalNetWorth === 0 ? 0 : 100;
          }

          return (
            ((totalNetWorth - monthStartNetWorth) / Math.abs(monthStartNetWorth)) *
            100
          );
        })()
      : computeNetWorthChangePercent(
          transactions,
          settings.startingNetWorth,
        );

  return {
    totalNetWorth,
    monthlySpent: computeMonthlySpent(transactions),
    monthlyBudget: settings.monthlyBudget,
    netWorthChangePercent,
  };
}

function withDerivedState(
  transactions: Transaction[],
  categories: Category[],
  accounts: AppDataState['accounts'],
  settings: AppSettings,
) {
  const syncedCategories = syncCategorySpent(categories, transactions);
  const syncedAccounts = syncAccountBalances(accounts, transactions);

  return {
    transactions,
    categories: syncedCategories,
    accounts: syncedAccounts,
    settings,
    user: buildUserSummary(transactions, settings, syncedAccounts),
  };
}

const initialState: AppDataState = {
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
    smsAutoImport: false,
    smsImportMode: 'confirm',
  },
  transactions: [],
  categories: [],
  accounts: [],
  pendingUpiImport: null,
  processedSmsKeys: [],
  extractionRules: [],
};

async function loadAppState() {
  const data = await loadPersistedData();
  return {
    ...withDerivedState(
      data.transactions,
      data.categories,
      data.accounts,
      data.settings,
    ),
    processedSmsKeys: data.processedSmsKeys,
    extractionRules: data.extractionRules,
    pendingUpiImport: null as PendingUpiImport | null,
  };
}

export const hydrateApp = createAsyncThunk('app/hydrate', loadAppState);

export const clearAppData = createAsyncThunk('app/clearAppData', async () => {
  await clearDatabase();
  return loadAppState();
});

export const addTransaction = createAsyncThunk(
  'app/addTransaction',
  async (
    transaction: Omit<Transaction, 'id' | 'createdAt'>,
    { getState },
  ) => {
    const state = getState() as { app: AppDataState };
    const nextTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    const nextTransactions = [nextTransaction, ...state.app.transactions];
    const nextState = withDerivedState(
      nextTransactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );

    await saveTransaction(nextTransaction);
    await saveAllCategories(nextState.categories);

    return nextState;
  },
);

export type TransactionUpdate = Omit<Transaction, 'createdAt'> & {
  createdAt?: string;
};

export const updateTransaction = createAsyncThunk(
  'app/updateTransaction',
  async (payload: TransactionUpdate, { getState }) => {
    const state = getState() as { app: AppDataState };
    const existing = state.app.transactions.find(
      (transaction) => transaction.id === payload.id,
    );
    if (!existing) {
      throw new Error('Transaction not found');
    }

    const updated: Transaction = {
      ...existing,
      ...payload,
      createdAt: payload.createdAt ?? existing.createdAt,
    };

    const nextTransactions = state.app.transactions.map((transaction) =>
      transaction.id === updated.id ? updated : transaction,
    );
    nextTransactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const nextState = withDerivedState(
      nextTransactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );

    await saveTransaction(updated);
    await saveAllCategories(nextState.categories);

    return nextState;
  },
);

export const deleteTransaction = createAsyncThunk(
  'app/deleteTransaction',
  async (id: string, { getState }) => {
    const state = getState() as { app: AppDataState };
    const nextTransactions = state.app.transactions.filter(
      (transaction) => transaction.id !== id,
    );
    const nextState = withDerivedState(
      nextTransactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );

    await deleteStoredTransaction(id);
    await saveAllCategories(nextState.categories);

    return nextState;
  },
);

export const addCategory = createAsyncThunk(
  'app/addCategory',
  async (category: NewCategory, { getState }) => {
    const state = getState() as { app: AppDataState };
    const nextCategory: Category = {
      ...category,
      id: uuidv4(),
      spent: 0,
    };

    const nextCategories = [...state.app.categories, nextCategory];
    const nextState = withDerivedState(
      state.app.transactions,
      nextCategories,
      state.app.accounts,
      state.app.settings,
    );

    await saveCategory({ ...nextCategory, spent: 0 });
    await saveAllCategories(nextState.categories);

    return { nextState, categoryId: nextCategory.id };
  },
);

export const addAccount = createAsyncThunk(
  'app/addAccount',
  async (account: NewAccount, { getState }) => {
    const state = getState() as { app: AppDataState };
    const nextAccount = {
      ...account,
      id: uuidv4(),
      balance: account.startingBalance,
    };

    const nextAccounts = [...state.app.accounts, nextAccount];
    const nextState = withDerivedState(
      state.app.transactions,
      state.app.categories,
      nextAccounts,
      state.app.settings,
    );

    await saveAccount(nextAccount);

    return { nextState, accountId: nextAccount.id };
  },
);

export const updateBudget = createAsyncThunk(
  'app/updateBudget',
  async (amount: number, { getState }) => {
    const state = getState() as { app: AppDataState };
    const nextSettings = { ...state.app.settings, monthlyBudget: amount };
    const nextState = withDerivedState(
      state.app.transactions,
      state.app.categories,
      state.app.accounts,
      nextSettings,
    );

    await saveSettings(nextSettings);

    return nextState;
  },
);

export const updateSettings = createAsyncThunk(
  'app/updateSettings',
  async (partial: Partial<AppSettings>, { getState }) => {
    const state = getState() as { app: AppDataState };
    const nextSettings = { ...state.app.settings, ...partial };
    const nextState = withDerivedState(
      state.app.transactions,
      state.app.categories,
      state.app.accounts,
      nextSettings,
    );

    await saveSettings(nextSettings);

    return nextState;
  },
);

export const setPendingUpiImport = createAsyncThunk(
  'app/setPendingUpiImport',
  async (pending: PendingUpiImport | null) => pending,
);

export const upsertExtractionRule = createAsyncThunk(
  'app/upsertExtractionRule',
  async (rule: NewExtractionRule & { id?: string }, { getState }) => {
    const state = getState() as { app: AppDataState };
    const existing = rule.id
      ? state.app.extractionRules.find((item) => item.id === rule.id)
      : undefined;

    const nextRule: ExtractionRule = {
      id: existing?.id ?? uuidv4(),
      name: rule.name.trim(),
      enabled: rule.enabled,
      priority:
        rule.priority ??
        existing?.priority ??
        (state.app.extractionRules.length > 0
          ? Math.max(...state.app.extractionRules.map((item) => item.priority)) + 1
          : 1),
      senderPattern: rule.senderPattern?.trim() || undefined,
      bodyPattern: rule.bodyPattern?.trim() || undefined,
      merchantPattern: rule.merchantPattern?.trim() || undefined,
      transactionType: rule.transactionType,
      categoryId: rule.categoryId || undefined,
      accountId: rule.accountId || undefined,
      noteTemplate: rule.noteTemplate?.trim() || undefined,
      promptCategory: rule.promptCategory,
      promptAccount: rule.promptAccount,
      promptNote: rule.promptNote,
    };

    const nextRules = existing
      ? state.app.extractionRules.map((item) =>
          item.id === nextRule.id ? nextRule : item,
        )
      : [...state.app.extractionRules, nextRule];

    nextRules.sort((a, b) => a.priority - b.priority);
    await saveExtractionRules(nextRules);
    return nextRules;
  },
);

export const deleteExtractionRule = createAsyncThunk(
  'app/deleteExtractionRule',
  async (id: string, { getState }) => {
    const state = getState() as { app: AppDataState };
    const nextRules = state.app.extractionRules.filter((rule) => rule.id !== id);
    await saveExtractionRules(nextRules);
    return nextRules;
  },
);

export const reorderExtractionRules = createAsyncThunk(
  'app/reorderExtractionRules',
  async (orderedIds: string[], { getState }) => {
    const state = getState() as { app: AppDataState };
    const byId = new Map(state.app.extractionRules.map((rule) => [rule.id, rule]));
    const nextRules = orderedIds
      .map((id, index) => {
        const rule = byId.get(id);
        return rule ? { ...rule, priority: index + 1 } : null;
      })
      .filter((rule): rule is ExtractionRule => rule != null);

    await saveExtractionRules(nextRules);
    return nextRules;
  },
);

export const markSmsProcessed = createAsyncThunk(
  'app/markSmsProcessed',
  async (dedupeKey: string, { getState }) => {
    const state = getState() as { app: AppDataState };
    if (state.app.processedSmsKeys.includes(dedupeKey)) {
      return state.app.processedSmsKeys;
    }
    const next = [...state.app.processedSmsKeys, dedupeKey];
    await saveSmsDedupeKeys(next);
    return next;
  },
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    clearPendingUpiImport(state) {
      state.pendingUpiImport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
        hydrated: true,
      }))
      .addCase(setPendingUpiImport.fulfilled, (state, action) => {
        state.pendingUpiImport = action.payload;
      })
      .addCase(markSmsProcessed.fulfilled, (state, action) => {
        state.processedSmsKeys = action.payload;
      })
      .addCase(addTransaction.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(updateTransaction.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(deleteTransaction.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(addCategory.fulfilled, (state, action) => ({
        ...state,
        ...action.payload.nextState,
      }))
      .addCase(addAccount.fulfilled, (state, action) => ({
        ...state,
        ...action.payload.nextState,
      }))
      .addCase(updateBudget.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(updateSettings.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(clearAppData.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
        hydrated: true,
      }))
      .addCase(upsertExtractionRule.fulfilled, (state, action) => {
        state.extractionRules = action.payload;
      })
      .addCase(deleteExtractionRule.fulfilled, (state, action) => {
        state.extractionRules = action.payload;
      })
      .addCase(reorderExtractionRules.fulfilled, (state, action) => {
        state.extractionRules = action.payload;
      });
  },
});

export const { clearPendingUpiImport } = appSlice.actions;
export default appSlice.reducer;
