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
  buildTransactionFromRule,
  computeNextRunAt,
  findMatchingTransaction,
  processRecurringRules,
} from '../lib/recurring';
import {
  clearDatabase,
  deleteStoredTransaction,
  deleteRecurringRule,
  loadPersistedData,
  saveAccount,
  saveAllCategories,
  saveCategory,
  saveExtractionRules,
  saveRecurringRule,
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
  PendingRecurringInstance,
  PendingUpiImport,
  RecurringRule,
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
  pendingRecurringQueue: [],
  processedSmsKeys: [],
  extractionRules: [],
  recurringRules: [],
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
    recurringRules: data.recurringRules ?? [],
    pendingUpiImport: null as PendingUpiImport | null,
    pendingRecurringQueue: data.pendingRecurring ?? [],
  };
}

function syncRecurringAfterChanges(
  transactions: Transaction[],
  recurringRules: RecurringRule[],
  settings: AppSettings,
  queueAfterResolve: PendingRecurringInstance[],
) {
  const queuedRuleIds = new Set(queueAfterResolve.map((p) => p.ruleId));
  const result = processRecurringRules(
    recurringRules,
    transactions,
    settings,
    new Date(),
    queuedRuleIds,
  );
  const mergedPending = [
    ...queueAfterResolve,
    ...result.pending.filter((p) => !queuedRuleIds.has(p.ruleId)),
  ];
  return {
    transactions: result.transactions,
    recurringRules: result.recurringRules,
    pendingRecurringQueue: mergedPending,
    newTransactions: result.newTransactions,
    updatedTransactionIds: result.updatedTransactionIds,
  };
}

function applyRecurringSyncToState(
  base: ReturnType<typeof withDerivedState>,
  sync: ReturnType<typeof syncRecurringAfterChanges>,
) {
  return {
    ...base,
    recurringRules: sync.recurringRules,
    pendingRecurringQueue: sync.pendingRecurringQueue,
  };
}

export const hydrateApp = createAsyncThunk('app/hydrate', loadAppState);

/** Re-check due recurring rules (e.g. after resume from background or notification tap). */
export const refreshRecurring = createAsyncThunk(
  'app/refreshRecurring',
  async (_, { getState }) => {
    const state = getState() as { app: AppDataState };
    const sync = syncRecurringAfterChanges(
      state.app.transactions,
      state.app.recurringRules,
      state.app.settings,
      state.app.pendingRecurringQueue,
    );

    for (const t of sync.newTransactions) await saveTransaction(t);
    for (const id of sync.updatedTransactionIds) {
      const row = sync.transactions.find((tx) => tx.id === id);
      if (row) await saveTransaction(row);
    }
    for (const r of sync.recurringRules) await saveRecurringRule(r);

    const nextState = withDerivedState(
      sync.transactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );
    await saveAllCategories(nextState.categories);
    return applyRecurringSyncToState(nextState, sync);
  },
);

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

    await saveTransaction(nextTransaction);

    let txs = [nextTransaction, ...state.app.transactions];
    let rules = state.app.recurringRules;
    let queue = state.app.pendingRecurringQueue;

    if (!nextTransaction.recurringRuleId) {
      for (const rule of state.app.recurringRules) {
        if (!rule.active) continue;
        const dueAt = new Date(rule.nextRunAt);
        if (dueAt.getTime() > Date.now()) continue;
        const match = findMatchingTransaction(rule, [nextTransaction], dueAt, state.app.settings);
        if (match) {
          const updated = { ...nextTransaction, recurringRuleId: rule.id };
          await saveTransaction(updated);
          txs = [updated, ...state.app.transactions];
          const advanced = {
            ...rule,
            nextRunAt: computeNextRunAt(rule, dueAt).toISOString(),
          };
          await saveRecurringRule(advanced);
          rules = rules.map((r) => (r.id === rule.id ? advanced : r));
          queue = queue.filter((p) => p.ruleId !== rule.id);
          break;
        }
      }
    }

    const sync = syncRecurringAfterChanges(txs, rules, state.app.settings, queue);
    for (const t of sync.newTransactions) await saveTransaction(t);
    for (const id of sync.updatedTransactionIds) {
      const row = sync.transactions.find((t) => t.id === id);
      if (row) await saveTransaction(row);
    }
    for (const r of sync.recurringRules) await saveRecurringRule(r);

    const nextState = withDerivedState(
      sync.transactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );

    await saveAllCategories(nextState.categories);

    return applyRecurringSyncToState(nextState, sync);
  },
);

export const confirmRecurringPending = createAsyncThunk(
  'app/confirmRecurringPending',
  async (
    payload: { pendingId: string; linkTransactionId?: string },
    { getState },
  ) => {
    const state = getState() as { app: AppDataState };
    const pending = state.app.pendingRecurringQueue.find((p) => p.id === payload.pendingId);
    if (!pending) return state.app;

    const rule = state.app.recurringRules.find((r) => r.id === pending.ruleId);
    if (!rule) return state.app;

    const dueAt = new Date(pending.dueAt);
    let txs = [...state.app.transactions];
    let rules = state.app.recurringRules.map((r) => ({ ...r }));

    if (payload.linkTransactionId) {
      const target = txs.find((t) => t.id === payload.linkTransactionId);
      if (target) {
        const updated = { ...target, recurringRuleId: rule.id };
        await saveTransaction(updated);
        txs = txs.map((t) => (t.id === updated.id ? updated : t));
      }
    } else {
      const created = buildTransactionFromRule(rule, dueAt);
      await saveTransaction(created);
      txs = [created, ...txs];
    }

    const advanced = {
      ...rule,
      nextRunAt: computeNextRunAt(rule, dueAt).toISOString(),
    };
    await saveRecurringRule(advanced);
    rules = rules.map((r) => (r.id === rule.id ? advanced : r));

    const queue = state.app.pendingRecurringQueue.filter((p) => p.id !== pending.id);
    const sync = syncRecurringAfterChanges(txs, rules, state.app.settings, queue);
    for (const t of sync.newTransactions) await saveTransaction(t);
    for (const id of sync.updatedTransactionIds) {
      const row = sync.transactions.find((t) => t.id === id);
      if (row) await saveTransaction(row);
    }
    for (const r of sync.recurringRules) await saveRecurringRule(r);

    const nextState = withDerivedState(
      sync.transactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );
    await saveAllCategories(nextState.categories);
    return applyRecurringSyncToState(nextState, sync);
  },
);

export const skipRecurringPending = createAsyncThunk(
  'app/skipRecurringPending',
  async (pendingId: string, { getState }) => {
    const state = getState() as { app: AppDataState };
    const pending = state.app.pendingRecurringQueue.find((p) => p.id === pendingId);
    if (!pending) return state.app;

    const rule = state.app.recurringRules.find((r) => r.id === pending.ruleId);
    if (!rule) return state.app;

    const dueAt = new Date(pending.dueAt);
    const advanced = {
      ...rule,
      nextRunAt: computeNextRunAt(rule, dueAt).toISOString(),
    };
    await saveRecurringRule(advanced);
    const rules = state.app.recurringRules.map((r) =>
      r.id === rule.id ? advanced : r,
    );

    const queue = state.app.pendingRecurringQueue.filter((p) => p.id !== pendingId);
    const sync = syncRecurringAfterChanges(
      state.app.transactions,
      rules,
      state.app.settings,
      queue,
    );
    for (const t of sync.newTransactions) await saveTransaction(t);
    for (const id of sync.updatedTransactionIds) {
      const row = sync.transactions.find((t) => t.id === id);
      if (row) await saveTransaction(row);
    }
    for (const r of sync.recurringRules) await saveRecurringRule(r);

    const nextState = withDerivedState(
      sync.transactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );
    await saveAllCategories(nextState.categories);
    return applyRecurringSyncToState(nextState, sync);
  },
);

export const importTransactionsBulk = createAsyncThunk(
  'app/importTransactionsBulk',
  async (transactions: Transaction[], { getState }) => {
    const state = getState() as { app: AppDataState };
    const existingIds = new Set(state.app.transactions.map((t) => t.id));
    const filtered = transactions.filter((t) => !existingIds.has(t.id));
    if (filtered.length === 0) return state.app;

    const nextTransactions = [...filtered, ...state.app.transactions];
    nextTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const nextState = withDerivedState(
      nextTransactions,
      state.app.categories,
      state.app.accounts,
      state.app.settings,
    );

    // Persist each record (fast enough for typical CSV imports).
    await Promise.all(filtered.map((t) => saveTransaction(t)));
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

export const updateCategory = createAsyncThunk(
  'app/updateCategory',
  async (category: Category, { getState }) => {
    const state = getState() as { app: AppDataState };
    const existing = state.app.categories.find((c) => c.id === category.id);
    if (!existing) throw new Error('Category not found');

    const updated: Category = {
      ...existing,
      ...category,
      spent: existing.spent,
      budgetEnabled: category.budgetEnabled ?? existing.budgetEnabled,
      rolloverEnabled: category.rolloverEnabled ?? existing.rolloverEnabled,
      budget: category.budgetEnabled ? category.budget : 0,
    };

    const nextCategories = state.app.categories.map((c) => (c.id === updated.id ? updated : c));
    const nextState = withDerivedState(
      state.app.transactions,
      nextCategories,
      state.app.accounts,
      state.app.settings,
    );

    await saveCategory(updated);
    await saveAllCategories(nextState.categories);
    return nextState;
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

export type RecurringRuleUpsert = Omit<RecurringRule, 'id' | 'nextRunAt'> & {
  id?: string;
  nextRunAt?: string;
};

export const upsertRecurringRule = createAsyncThunk(
  'app/upsertRecurringRule',
  async (payload: RecurringRuleUpsert, { getState }) => {
    const state = getState() as { app: AppDataState };
    const existing = payload.id
      ? state.app.recurringRules.find((r) => r.id === payload.id)
      : undefined;

    const interval = Math.max(1, Math.floor(payload.interval));
    const now = new Date();
    const nextRule: RecurringRule = {
      id: existing?.id ?? uuidv4(),
      name: payload.name.trim(),
      amount: Math.abs(payload.amount),
      type: payload.type,
      categoryId: payload.type === 'expense' ? payload.categoryId : undefined,
      accountId: payload.type === 'transfer' ? undefined : payload.accountId,
      fromAccountId: payload.type === 'transfer' ? payload.fromAccountId : undefined,
      toAccountId: payload.type === 'transfer' ? payload.toAccountId : undefined,
      cadence: payload.cadence,
      interval,
      startDate: payload.startDate,
      nextRunAt: payload.nextRunAt ?? existing?.nextRunAt ?? now.toISOString(),
      endDate: payload.endDate || undefined,
      active: payload.active,
    };

    await saveRecurringRule(nextRule);
    const nextRules = existing
      ? state.app.recurringRules.map((r) => (r.id === nextRule.id ? nextRule : r))
      : [...state.app.recurringRules, nextRule];

    nextRules.sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime());
    return nextRules;
  },
);

export const removeRecurringRule = createAsyncThunk(
  'app/removeRecurringRule',
  async (id: string, { getState }) => {
    const state = getState() as { app: AppDataState };
    await deleteRecurringRule(id);
    return state.app.recurringRules.filter((r) => r.id !== id);
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
      .addCase(importTransactionsBulk.fulfilled, (state, action) => ({
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
      .addCase(updateCategory.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
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
      })
      .addCase(upsertRecurringRule.fulfilled, (state, action) => {
        state.recurringRules = action.payload;
      })
      .addCase(removeRecurringRule.fulfilled, (state, action) => {
        state.recurringRules = action.payload;
      })
      .addCase(confirmRecurringPending.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(skipRecurringPending.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(refreshRecurring.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }));
  },
});

export const { clearPendingUpiImport } = appSlice.actions;
export default appSlice.reducer;
