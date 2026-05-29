import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PickerTile, { PickerRail } from '../components/PickerTile';
import { categoryStyles } from '../lib/styles';
import { formatCurrency } from '../lib/format';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeRecurringRule, upsertRecurringRule } from '../store/appSlice';
import type { RecurringCadence, RecurringRule, RecurringRuleType } from '../store/types';

function toDateInputValue(isoYmd?: string): string {
  if (!isoYmd) return '';
  return isoYmd;
}

function toDatetimeLocalValue(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

function computeUpcoming(
  rule: RecurringRule,
  count = 3,
): string[] {
  const dates: string[] = [];
  const next = new Date(rule.nextRunAt);
  if (Number.isNaN(next.getTime())) return dates;
  for (let i = 0; i < count; i += 1) {
    dates.push(next.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    if (rule.cadence === 'daily') next.setDate(next.getDate() + Math.max(1, rule.interval));
    else if (rule.cadence === 'weekly') next.setDate(next.getDate() + Math.max(1, rule.interval) * 7);
    else next.setMonth(next.getMonth() + Math.max(1, rule.interval));
  }
  return dates;
}

type RuleDraft = {
  id?: string;
  name: string;
  amount: string;
  type: RecurringRuleType;
  cadence: RecurringCadence;
  interval: string;
  startDate: string;
  nextRunAt: string;
  endDate: string;
  active: boolean;
  categoryId?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
};

function toDraft(rule: RecurringRule | null, now = new Date()): RuleDraft {
  if (!rule) {
    const startYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return {
      name: '',
      amount: '',
      type: 'expense',
      cadence: 'monthly',
      interval: '1',
      startDate: startYmd,
      nextRunAt: toDatetimeLocalValue(now.toISOString()),
      endDate: '',
      active: true,
    };
  }
  return {
    id: rule.id,
    name: rule.name,
    amount: String(rule.amount),
    type: rule.type,
    cadence: rule.cadence,
    interval: String(rule.interval),
    startDate: rule.startDate,
    nextRunAt: toDatetimeLocalValue(rule.nextRunAt),
    endDate: rule.endDate ?? '',
    active: rule.active,
    categoryId: rule.categoryId,
    accountId: rule.accountId,
    fromAccountId: rule.fromAccountId,
    toAccountId: rule.toAccountId,
  };
}

export default function RecurringRulesSettings() {
  const dispatch = useAppDispatch();
  const { recurringRules, categories, accounts, settings } = useAppSelector((s) => s.app);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [draft, setDraft] = useState<RuleDraft>(() => toDraft(null));

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === draft.categoryId),
    [categories, draft.categoryId],
  );

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === draft.accountId),
    [accounts, draft.accountId],
  );

  const selectedFromAccount = useMemo(
    () => accounts.find((a) => a.id === draft.fromAccountId),
    [accounts, draft.fromAccountId],
  );

  const selectedToAccount = useMemo(
    () => accounts.find((a) => a.id === draft.toAccountId),
    [accounts, draft.toAccountId],
  );

  const openCreate = () => {
    setEditing(null);
    setDraft(toDraft(null));
    setSheetOpen(true);
  };

  const openEdit = (rule: RecurringRule) => {
    setEditing(rule);
    setDraft(toDraft(rule));
    setSheetOpen(true);
  };

  const canSave = useMemo(() => {
    const amt = Number.parseFloat(draft.amount);
    const interval = Number.parseInt(draft.interval, 10);
    if (!draft.name.trim()) return false;
    if (!Number.isFinite(amt) || amt <= 0) return false;
    if (!Number.isFinite(interval) || interval < 1) return false;
    if (!draft.startDate) return false;
    if (!draft.nextRunAt) return false;
    if (draft.type === 'expense' && !draft.categoryId) return false;
    if (draft.type === 'transfer') {
      if (!draft.fromAccountId || !draft.toAccountId) return false;
      if (draft.fromAccountId === draft.toAccountId) return false;
    } else if (!draft.accountId) {
      return false;
    }
    return true;
  }, [draft]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          className="h-10 w-10 rounded-2xl border border-border bg-surface-2 hover:bg-elevated transition-colors flex items-center justify-center shrink-0"
          aria-label="Back to settings"
        >
          <span className="material-symbols-outlined text-muted">arrow_back</span>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="page-title truncate">Recurring payments</h1>
          <p className="text-muted text-[13px] mt-0.5">{recurringRules.length} rules</p>
        </div>
        <Button variant="secondary" onClick={openCreate}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          New
        </Button>
      </div>

      <Card>
        <p className="text-muted text-[13px]">
          Recurring rules automatically generate transactions when they become due (on app open).
        </p>
      </Card>

      {recurringRules.length === 0 ? (
        <Card className="text-center" padding="lg">
          <p className="text-fg font-semibold">No recurring rules yet</p>
          <p className="text-muted text-[13px] mt-2">Create one to auto-add rent, subscriptions, or salary.</p>
          <Button className="mt-4" onClick={openCreate}>
            Create recurring rule
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {recurringRules.map((rule) => {
            const upcoming = computeUpcoming(rule, 3).join(' · ');
            return (
              <button
                type="button"
                key={rule.id}
                onClick={() => openEdit(rule)}
                className="text-left rounded-2xl bg-surface-2 border border-border p-4 hover:bg-elevated transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-fg font-semibold truncate">{rule.name}</div>
                    <div className="text-muted text-[12px] mt-0.5">
                      Next: {new Date(rule.nextRunAt).toLocaleString(undefined, { month: 'short', day: 'numeric' })}
                      {upcoming ? ` · Upcoming: ${upcoming}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-fg font-semibold tabular-nums">
                    {formatCurrency(rule.type === 'expense' ? -rule.amount : rule.amount, settings.currency, { showSign: true })}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[12px] text-subtle">
                  <span className="capitalize">{rule.type}</span>
                  <span>·</span>
                  <span className="capitalize">{rule.cadence}</span>
                  <span>·</span>
                  <span>Every {rule.interval}</span>
                  <span>·</span>
                  <span>{rule.active ? 'Active' : 'Paused'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BottomSheet
        open={sheetOpen}
        title={editing ? 'Edit recurring rule' : 'New recurring rule'}
        onClose={() => setSheetOpen(false)}
        maxWidthClassName="max-w-lg"
      >
        <div className="px-5 pb-5 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-medium">Name</span>
            <input
              className="input-field"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Rent, Netflix, Salary…"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Type</span>
              <select
                className="input-field"
                value={draft.type}
                onChange={(e) => {
                  const nextType = e.target.value as RecurringRuleType;
                  setDraft((p) => ({
                    ...p,
                    type: nextType,
                    categoryId: nextType === 'expense' ? p.categoryId : undefined,
                    accountId: nextType === 'transfer' ? undefined : p.accountId,
                    fromAccountId: nextType === 'transfer' ? p.fromAccountId : undefined,
                    toAccountId: nextType === 'transfer' ? p.toAccountId : undefined,
                  }));
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Amount</span>
              <input
                className="input-field"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value.replace(/[^\d.]/g, '') }))}
                placeholder="0.00"
              />
            </label>
          </div>

          {draft.type === 'transfer' ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="section-label mb-2">From account</p>
                {accounts.length === 0 ? (
                  <p className="text-muted text-[13px]">Add an account in Settings first.</p>
                ) : (
                  <PickerRail>
                    {accounts.map((a) => (
                      <PickerTile
                        key={a.id}
                        active={a.id === draft.fromAccountId}
                        onClick={() => setDraft((p) => ({ ...p, fromAccountId: a.id }))}
                        icon={a.icon}
                        label={a.name}
                      />
                    ))}
                  </PickerRail>
                )}
              </div>
              <div>
                <p className="section-label mb-2">To account</p>
                {accounts.length === 0 ? (
                  <p className="text-muted text-[13px]">Add an account in Settings first.</p>
                ) : (
                  <PickerRail>
                    {accounts.map((a) => (
                      <PickerTile
                        key={a.id}
                        active={a.id === draft.toAccountId}
                        onClick={() => setDraft((p) => ({ ...p, toAccountId: a.id }))}
                        icon={a.icon}
                        label={a.name}
                      />
                    ))}
                  </PickerRail>
                )}
                {selectedFromAccount && selectedToAccount && selectedFromAccount.id === selectedToAccount.id ? (
                  <p className="text-danger text-[12px] mt-2">From and To accounts must be different.</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div>
              <p className="section-label mb-2">Account</p>
              {accounts.length === 0 ? (
                <p className="text-muted text-[13px]">Add an account in Settings first.</p>
              ) : (
                <PickerRail>
                  {accounts.map((a) => (
                    <PickerTile
                      key={a.id}
                      active={a.id === draft.accountId}
                      onClick={() => setDraft((p) => ({ ...p, accountId: a.id }))}
                      icon={a.icon}
                      label={a.name}
                    />
                  ))}
                </PickerRail>
              )}
              {selectedAccount ? (
                <p className="text-subtle text-[12px] mt-2">Applies to: {selectedAccount.name}</p>
              ) : null}
            </div>
          )}

          {draft.type === 'expense' ? (
            <div>
              <p className="section-label mb-2">Category</p>
              {categories.length === 0 ? (
                <p className="text-muted text-[13px]">Create a category in Settings first.</p>
              ) : (
                <PickerRail>
                  {categories.map((c) => {
                    const styles = categoryStyles[c.color];
                    const active = c.id === draft.categoryId;
                    return (
                      <PickerTile
                        key={c.id}
                        active={active}
                        onClick={() => setDraft((p) => ({ ...p, categoryId: c.id }))}
                        icon={c.icon}
                        label={c.name}
                        iconClassName={active ? styles.text : 'text-muted'}
                      />
                    );
                  })}
                </PickerRail>
              )}
              {selectedCategory ? (
                <p className="text-subtle text-[12px] mt-2">Category: {selectedCategory.name}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Cadence</span>
              <select
                className="input-field"
                value={draft.cadence}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    cadence: e.target.value as RecurringCadence,
                  }))
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Interval</span>
              <input
                className="input-field"
                inputMode="numeric"
                value={draft.interval}
                onChange={(e) => setDraft((p) => ({ ...p, interval: e.target.value.replace(/[^\d]/g, '') }))}
                placeholder="1"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">Start date</span>
              <input
                type="date"
                className="input-field"
                value={toDateInputValue(draft.startDate)}
                onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-medium">End date (optional)</span>
              <input
                type="date"
                className="input-field"
                value={toDateInputValue(draft.endDate)}
                onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-medium">Next run</span>
            <input
              type="datetime-local"
              className="input-field"
              value={draft.nextRunAt}
              onChange={(e) => setDraft((p) => ({ ...p, nextRunAt: e.target.value }))}
            />
            <span className="text-subtle text-[12px]">
              This is when the next transaction will be created (on app open).
            </span>
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-fg text-[13px] font-medium">Active</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand"
              checked={draft.active}
              onChange={(e) => setDraft((p) => ({ ...p, active: e.target.checked }))}
            />
          </label>

          <div className="flex gap-2 pt-1">
            {editing ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  void dispatch(removeRecurringRule(editing.id));
                  setSheetOpen(false);
                }}
              >
                Delete
              </Button>
            ) : null}

            <Button
              type="button"
              fullWidth
              disabled={!canSave}
              onClick={() => {
                const amt = Number.parseFloat(draft.amount);
                const interval = Number.parseInt(draft.interval, 10);
                if (!Number.isFinite(amt) || !Number.isFinite(interval)) return;
                void dispatch(
                  upsertRecurringRule({
                    id: draft.id,
                    name: draft.name,
                    amount: amt,
                    type: draft.type,
                    categoryId: draft.type === 'expense' ? draft.categoryId : undefined,
                    accountId: draft.type === 'transfer' ? undefined : draft.accountId,
                    fromAccountId: draft.type === 'transfer' ? draft.fromAccountId : undefined,
                    toAccountId: draft.type === 'transfer' ? draft.toAccountId : undefined,
                    cadence: draft.cadence,
                    interval,
                    startDate: draft.startDate,
                    nextRunAt: fromDatetimeLocalValue(draft.nextRunAt),
                    endDate: draft.endDate || undefined,
                    active: draft.active,
                  }),
                );
                setSheetOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

