import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  confirmRecurringPending,
  refreshRecurring,
  skipRecurringPending,
} from '../store/appSlice';
import { formatCurrency, formatTransactionDate } from '../lib/format';
import { findMatchingTransaction } from '../lib/recurring';
import BottomSheet from './BottomSheet';
import Button from './ui/Button';
import clsx from 'clsx';

export default function RecurringImportSheet() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pendingRecurringQueue, recurringRules, transactions, settings, accounts, categories, hydrated } =
    useAppSelector((s) => s.app);

  const focusPendingId = searchParams.get('recurringPending');
  const focusRuleId = searchParams.get('recurringRule');
  const awaitingRecurring =
    hydrated && (focusPendingId != null || focusRuleId != null) && pendingRecurringQueue.length === 0;

  useEffect(() => {
    if (!awaitingRecurring) return;
    void dispatch(refreshRecurring());
  }, [awaitingRecurring, dispatch]);

  const pending = useMemo(() => {
    if (focusPendingId) {
      return (
        pendingRecurringQueue.find((p) => p.id === focusPendingId) ??
        pendingRecurringQueue[0] ??
        null
      );
    }
    if (focusRuleId) {
      return (
        pendingRecurringQueue.find((p) => p.ruleId === focusRuleId) ??
        pendingRecurringQueue[0] ??
        null
      );
    }
    return pendingRecurringQueue[0] ?? null;
  }, [focusPendingId, focusRuleId, pendingRecurringQueue]);
  const rule = pending ? recurringRules.find((r) => r.id === pending.ruleId) : undefined;

  const [linkId, setLinkId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const dueAtIso = pending?.dueAt;

  const candidates = useMemo(() => {
    if (!rule || !dueAtIso) return [];
    const dueAt = new Date(dueAtIso);
    const relaxed = {
      ...settings,
      recurringMatchWindowDays: Math.max(settings.recurringMatchWindowDays ?? 1, 3),
      recurringAmountTolerancePercent: Math.max(
        settings.recurringAmountTolerancePercent ?? 5,
        15,
      ),
    };
    return transactions
      .filter((tx) => {
        if (tx.recurringRuleId) return false;
        const match = findMatchingTransaction(rule, [tx], dueAt, relaxed);
        return Boolean(match);
      })
      .slice(0, 6);
  }, [rule, dueAtIso, transactions, settings]);

  const selectedLinkId = linkId ?? pending?.suggestedMatchId ?? candidates[0]?.id;

  if (awaitingRecurring) {
    return (
      <BottomSheet open title="Recurring payment due" onClose={() => {}} maxWidthClassName="max-w-md">
        <div className="px-4 pb-6 text-center text-muted text-[14px]">Loading payment details…</div>
      </BottomSheet>
    );
  }

  if (!pending || !rule || !dueAtIso) return null;

  const accountLabel =
    rule.type === 'transfer'
      ? `${accounts.find((a) => a.id === rule.fromAccountId)?.name ?? '?'} → ${
          accounts.find((a) => a.id === rule.toAccountId)?.name ?? '?'
        }`
      : (accounts.find((a) => a.id === rule.accountId)?.name ?? '');

  const categoryLabel =
    rule.type === 'expense'
      ? categories.find((c) => c.id === rule.categoryId)?.name
      : undefined;

  const clearRecurringQuery = () => {
    if (!focusPendingId && !focusRuleId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('recurringPending');
        next.delete('recurringRule');
        return next;
      },
      { replace: true },
    );
  };

  const dismissSkip = async () => {
    setBusy(true);
    try {
      await dispatch(skipRecurringPending(pending.id)).unwrap();
      clearRecurringQuery();
    } finally {
      setBusy(false);
      setLinkId(undefined);
    }
  };

  const confirm = async (useLink: boolean) => {
    setBusy(true);
    try {
      await dispatch(
        confirmRecurringPending({
          pendingId: pending.id,
          linkTransactionId: useLink ? selectedLinkId : undefined,
        }),
      ).unwrap();
      clearRecurringQuery();
    } finally {
      setBusy(false);
      setLinkId(undefined);
    }
  };

  return (
    <BottomSheet
      open
      title="Recurring payment due"
      onClose={() => void dismissSkip()}
      maxWidthClassName="max-w-md"
    >
      <div className="px-4 pb-4 flex flex-col gap-4">
        <div className="rounded-2xl bg-surface-2 border border-border p-4">
          <p className="text-muted text-[12px] uppercase tracking-wide">Scheduled</p>
          <p className="text-fg font-semibold mt-1">{rule.name}</p>
          <p className="text-display font-bold text-fg tabular-nums mt-2">
            {formatCurrency(
              rule.type === 'expense' ? -rule.amount : rule.amount,
              settings.currency,
              { showSign: rule.type !== 'transfer' },
            )}
          </p>
          <p className="text-muted text-[13px] mt-2 capitalize">
            {rule.type}
            {categoryLabel ? ` · ${categoryLabel}` : ''}
            {accountLabel ? ` · ${accountLabel}` : ''}
          </p>
          <p className="text-subtle text-[12px] mt-2">
            Due {formatTransactionDate(pending.dueAt)}
          </p>
        </div>

        {candidates.length > 0 ? (
          <div>
            <p className="section-label mb-2">Link existing transaction</p>
            <p className="text-muted text-[12px] mb-2">
              A similar amount was found around the due date. Link it instead of creating a
              duplicate.
            </p>
            <div className="flex flex-col gap-2">
              {candidates.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setLinkId(tx.id)}
                  className={clsx(
                    'w-full text-left rounded-2xl border px-3 py-2.5 transition-colors',
                    selectedLinkId === tx.id
                      ? 'border-brand bg-brand-muted'
                      : 'border-border bg-surface-2 hover:bg-elevated',
                  )}
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-fg font-medium truncate">{tx.merchant}</span>
                    <span className="text-fg font-semibold tabular-nums shrink-0">
                      {formatCurrency(tx.amount, settings.currency, { showSign: true })}
                    </span>
                  </div>
                  <span className="text-muted text-[11px]">
                    {formatTransactionDate(tx.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted text-[13px] rounded-2xl border border-dashed border-border px-3 py-3">
            No matching transaction found on this day. You can add a new entry or skip this
            occurrence.
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {candidates.length > 0 ? (
            <Button
              fullWidth
              disabled={busy || !selectedLinkId}
              onClick={() => void confirm(true)}
            >
              Link selected
            </Button>
          ) : null}
          <Button
            fullWidth
            variant={candidates.length > 0 ? 'secondary' : 'primary'}
            disabled={busy}
            onClick={() => void confirm(false)}
          >
            Add new transaction
          </Button>
          <Button fullWidth variant="ghost" disabled={busy} onClick={() => void dismissSkip()}>
            Skip this time
          </Button>
        </div>

        {pendingRecurringQueue.length > 1 ? (
          <p className="text-center text-subtle text-[11px]">
            +{pendingRecurringQueue.length - 1} more due after this
          </p>
        ) : null}
      </div>
    </BottomSheet>
  );
}
