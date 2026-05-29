import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAppData, updateBudget, updateCategory, updateSettings } from '../store/appSlice';
import { isAndroid } from '../lib/capacitor';
import {
  getUpiSmsPermissionStatus,
  requestUpiSmsPermission,
} from '../lib/upiSms';
import { formatCurrency } from '../lib/format';
import type { RecurringApplyMode, SmsImportMode } from '../store/types';
import { categoryStyles } from '../lib/styles';
import { StatCard } from '../components/FinanceCards';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import BottomSheet from '../components/BottomSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoryForm from '../components/CategoryForm';
import AccountForm from '../components/AccountForm';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'] as const;

type MonthlyBudgetFieldProps = {
  monthlyBudget: number;
  onSave: (amount: number) => void;
};

function MonthlyBudgetField({ monthlyBudget, onSave }: MonthlyBudgetFieldProps) {
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="monthly-budget" className="text-fg text-[13px] font-medium">
        Monthly budget
      </label>
      <div className="flex gap-2">
        <input
          id="monthly-budget"
          type="number"
          min="1"
          step="1"
          value={budgetInput}
          onChange={(event) => setBudgetInput(event.target.value)}
          className="input-field"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const next = Number.parseFloat(budgetInput);
            if (Number.isFinite(next) && next > 0) onSave(next);
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const dispatch = useAppDispatch();
  const { settings, user, transactions, categories, accounts, extractionRules } =
    useAppSelector((state) => state.app);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showEditCategorySheet, setShowEditCategorySheet] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [smsPermission, setSmsPermission] = useState<string | null>(null);
  const [smsBusy, setSmsBusy] = useState(false);
  const [clearingDb, setClearingDb] = useState(false);
  const [showClearDbDialog, setShowClearDbDialog] = useState(false);

  const confirmClearDatabase = () => {
    setClearingDb(true);
    void dispatch(clearAppData())
      .unwrap()
      .then(() => setShowClearDbDialog(false))
      .finally(() => setClearingDb(false));
  };

  const editingCategory = editingCategoryId
    ? categories.find((c) => c.id === editingCategoryId) ?? null
    : null;

  const refreshSmsPermission = async () => {
    if (!isAndroid) return;
    const status = await getUpiSmsPermissionStatus();
    setSmsPermission(status);
  };

  const toggleSmsImport = async (enabled: boolean) => {
    if (!isAndroid) return;
    setSmsBusy(true);
    try {
      if (enabled) {
        const status = await requestUpiSmsPermission();
        setSmsPermission(status);
        if (status !== 'granted') return;
      }
      await dispatch(updateSettings({ smsAutoImport: enabled }));
    } finally {
      setSmsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-muted text-[14px] mt-1">Manage your app and preferences</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Net worth"
          value={formatCurrency(user.totalNetWorth, settings.currency, {
            maximumFractionDigits: 0,
          })}
        />
        <StatCard
          label="Transactions"
          value={String(transactions.length)}
          hint={`${categories.length} categories · ${accounts.length} accounts`}
          accent="success"
        />
      </div>

      {isAndroid ? (
        <Card>
          <h2 className="text-h2 font-semibold text-fg mb-1">UPI SMS import</h2>
          <p className="text-muted text-[13px] mb-4">
            Detect bank/UPI debit and credit SMS on this device. Only works in the
            Android app, not in the browser PWA.
          </p>
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-fg text-[14px]">Auto-import from SMS</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand"
                checked={settings.smsAutoImport}
                disabled={smsBusy}
                onChange={(event) => void toggleSmsImport(event.target.checked)}
                onFocus={() => void refreshSmsPermission()}
              />
            </label>

            {smsPermission && smsPermission !== 'granted' && settings.smsAutoImport ? (
              <p className="text-amber-400 text-[12px]">
                SMS permission is required. Toggle off and on again to grant access.
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">When a payment SMS arrives</span>
              <select
                value={settings.smsImportMode}
                disabled={!settings.smsAutoImport}
                onChange={(event) =>
                  void dispatch(
                    updateSettings({
                      smsImportMode: event.target.value as SmsImportMode,
                    }),
                  )
                }
                className="input-field"
              >
                <option value="confirm">Ask me to name it</option>
                <option value="auto">Save automatically</option>
              </select>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-h2 font-semibold text-fg mb-1">Extraction rules</h2>
            <p className="text-muted text-[13px]">
              Map SMS patterns to category, account, and what to ask when importing.
            </p>
          </div>
          <span className="text-muted text-[13px] tabular-nums shrink-0">
            {extractionRules.length}
          </span>
        </div>
        <Button to="/settings/extraction-rules" variant="secondary" fullWidth className="mt-4">
          <span className="material-symbols-outlined text-[18px]">rule</span>
          Manage rules
        </Button>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-h2 font-semibold text-fg mb-1">Recurring payments</h2>
            <p className="text-muted text-[13px]">
              Match existing entries on the due date, ask before adding, or auto-create. On
              Android, due payments can notify you even when the app is in the background
              (allow notifications when prompted).
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-medium">When a payment is due</span>
            <select
              value={settings.recurringApplyMode ?? 'smart'}
              onChange={(event) =>
                void dispatch(
                  updateSettings({
                    recurringApplyMode: event.target.value as RecurringApplyMode,
                  }),
                )
              }
              className="input-field"
            >
              <option value="smart">Match similar tx, else ask me</option>
              <option value="confirm">Always ask before adding</option>
              <option value="auto">Add automatically</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-muted text-[11px]">Match window (days)</span>
              <input
                type="number"
                min={0}
                max={14}
                value={settings.recurringMatchWindowDays ?? 1}
                onChange={(event) =>
                  void dispatch(
                    updateSettings({
                      recurringMatchWindowDays: Number(event.target.value) || 0,
                    }),
                  )
                }
                className="input-field"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted text-[11px]">Amount tolerance (%)</span>
              <input
                type="number"
                min={0}
                max={50}
                value={settings.recurringAmountTolerancePercent ?? 5}
                onChange={(event) =>
                  void dispatch(
                    updateSettings({
                      recurringAmountTolerancePercent: Number(event.target.value) || 0,
                    }),
                  )
                }
                className="input-field"
              />
            </label>
          </div>
        </div>
        <Button to="/settings/recurring" variant="secondary" fullWidth className="mt-4">
          <span className="material-symbols-outlined text-[18px]">event_repeat</span>
          Manage recurring
        </Button>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-h2 font-semibold text-fg mb-1">CSV import/export</h2>
            <p className="text-muted text-[13px]">
              Move transactions between devices, spreadsheets, or other apps.
            </p>
          </div>
        </div>
        <Button to="/settings/csv" variant="secondary" fullWidth className="mt-4">
          <span className="material-symbols-outlined text-[18px]">table</span>
          Open CSV tools
        </Button>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-h2 font-semibold text-fg mb-1">Backup &amp; restore</h2>
            <p className="text-muted text-[13px]">
              Export the full database to JSON and restore it later.
            </p>
          </div>
        </div>
        <Button to="/settings/backup" variant="secondary" fullWidth className="mt-4">
          <span className="material-symbols-outlined text-[18px]">cloud_download</span>
          Open backup tools
        </Button>
      </Card>

      <Card>
        <h2 className="text-h2 font-semibold text-fg mb-1">Appearance</h2>
        <p className="text-muted text-[13px] mb-4">Choose light, dark, or match your system</p>
        <ThemeToggle />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 font-semibold text-fg">Accounts</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowAccountSheet(true)}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add
          </Button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-muted text-[13px]">No accounts yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {accounts.map((account) => {
              const styles = categoryStyles[account.color];
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${styles.bg} ${styles.border}`}
                    >
                      <span className={`material-symbols-outlined ${styles.text}`}>
                        {account.icon}
                      </span>
                    </div>
                    <div>
                      <div className="text-fg font-medium truncate">{account.name}</div>
                      <div className="text-muted text-[12px] capitalize">{account.type}</div>
                    </div>
                  </div>
                  <div className="text-fg font-semibold tabular-nums shrink-0">
                    {formatCurrency(account.balance, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 font-semibold text-fg">Categories</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowCategorySheet(true)}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add
          </Button>
        </div>
        {categories.length === 0 ? (
          <p className="text-muted text-[13px]">No categories yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.map((category) => {
              const styles = categoryStyles[category.color];
              const percent =
                category.budget > 0
                  ? Math.min(100, (category.spent / category.budget) * 100)
                  : 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(category.id);
                    setShowEditCategorySheet(true);
                  }}
                  className="text-left rounded-2xl bg-surface-2 border border-border p-3 hover:bg-elevated transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`material-symbols-outlined ${styles.text}`}>
                        {category.icon}
                      </span>
                      <span className="text-fg font-medium truncate">{category.name}</span>
                    </div>
                    <span className="text-muted text-[12px] tabular-nums shrink-0">
                      {formatCurrency(category.spent, settings.currency, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      /{' '}
                      {formatCurrency(category.budget, settings.currency, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div className={`h-full ${styles.bar}`} style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-2 text-subtle text-[12px]">
                    {category.budgetEnabled ? 'Budget enabled' : 'Budget disabled'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-h2 font-semibold text-fg mb-4">General</h2>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="currency" className="text-fg text-[13px] font-medium">
              Currency
            </label>
            <select
              id="currency"
              value={settings.currency}
              onChange={(event) =>
                void dispatch(updateSettings({ currency: event.target.value }))
              }
              className="input-field"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <MonthlyBudgetField
            key={settings.monthlyBudget}
            monthlyBudget={settings.monthlyBudget}
            onSave={(amount) => void dispatch(updateBudget(amount))}
          />
          <p className="text-muted text-[12px] -mt-2 tabular-nums">
            {formatCurrency(user.monthlySpent, settings.currency, {
              maximumFractionDigits: 0,
            })}{' '}
            spent this month
          </p>

          <Button
            variant="danger"
            fullWidth
            disabled={clearingDb}
            onClick={() => setShowClearDbDialog(true)}
          >
            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
            Clear database
          </Button>
          <p className="text-subtle text-[12px] -mt-2">
            Resets all local data to the default sample set.
          </p>
        </div>
      </Card>

      <ConfirmDialog
        open={showClearDbDialog}
        title="Clear database?"
        description="This will permanently delete all transactions, accounts, categories, and settings on this device. Your data will be reset to the default sample set. This cannot be undone."
        confirmLabel="Clear database"
        cancelLabel="Keep my data"
        loading={clearingDb}
        onConfirm={confirmClearDatabase}
        onClose={() => {
          if (!clearingDb) setShowClearDbDialog(false);
        }}
      />

      <BottomSheet open={showCategorySheet} title="New category" onClose={() => setShowCategorySheet(false)}>
        <CategoryForm
          onCreated={() => setShowCategorySheet(false)}
          onCancel={() => setShowCategorySheet(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={showEditCategorySheet}
        title="Edit category"
        onClose={() => setShowEditCategorySheet(false)}
      >
        {editingCategory ? (
          <div className="p-4 pt-0 flex flex-col gap-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-fg text-[13px] font-medium">Enable budget</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand"
                checked={editingCategory.budgetEnabled}
                onChange={(e) =>
                  void dispatch(
                    updateCategory({
                      ...editingCategory,
                      budgetEnabled: e.target.checked,
                      budget: e.target.checked ? editingCategory.budget || 1 : 0,
                    }),
                  )
                }
              />
            </label>

            {editingCategory.budgetEnabled ? (
              <>
                <label className="flex flex-col gap-2">
                  <span className="text-fg text-[13px] font-medium">Monthly budget</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={String(editingCategory.budget || 0)}
                    onChange={(e) => {
                      const next = Number.parseFloat(e.target.value);
                      if (!Number.isFinite(next) || next <= 0) return;
                      void dispatch(updateCategory({ ...editingCategory, budget: next }));
                    }}
                    className="input-field"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-fg text-[13px] font-medium">Rollover unused budget</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-brand"
                    checked={Boolean(editingCategory.rolloverEnabled)}
                    onChange={(e) =>
                      void dispatch(
                        updateCategory({ ...editingCategory, rolloverEnabled: e.target.checked }),
                      )
                    }
                  />
                </label>
              </>
            ) : null}

            <Button variant="secondary" fullWidth onClick={() => setShowEditCategorySheet(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="p-4 pt-0 text-muted text-[13px]">Category not found.</div>
        )}
      </BottomSheet>

      <BottomSheet
        open={showAccountSheet}
        title="New account"
        onClose={() => setShowAccountSheet(false)}
        maxWidthClassName="max-w-lg"
      >
        <AccountForm
          onCreated={() => setShowAccountSheet(false)}
          onCancel={() => setShowAccountSheet(false)}
        />
      </BottomSheet>
    </div>
  );
}
