import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addAccount, addCategory, importTransactionsBulk } from '../store/appSlice';
import { store } from '../store';
import {
  buildTransactionsImportPreview,
  exportAccountsCsv,
  exportCategoriesCsv,
  exportTransactionsCsv,
} from '../lib/csv';

function downloadText(filename: string, content: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvToolsSettings() {
  const dispatch = useAppDispatch();
  const { transactions, categories, accounts } = useAppSelector((s) => s.app);

  const [includeCatalog, setIncludeCatalog] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!csvText) return null;
    try {
      return buildTransactionsImportPreview({
        csvText,
        existingTransactions: transactions,
        existingAccounts: accounts,
        existingCategories: categories,
      });
    } catch {
      return null;
    }
  }, [csvText, transactions, accounts, categories]);

  const exportNow = () => {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadText(`spendt-transactions-${ts}.csv`, exportTransactionsCsv(transactions, categories, accounts));
    if (includeCatalog) {
      downloadText(`spendt-accounts-${ts}.csv`, exportAccountsCsv(accounts));
      downloadText(`spendt-categories-${ts}.csv`, exportCategoriesCsv(categories));
    }
  };

  const pickFile = async (f: File | null) => {
    setFile(f);
    setError(null);
    setCsvText('');
    if (!f) return;
    try {
      const text = await f.text();
      setCsvText(text);
    } catch {
      setError('Could not read file.');
    }
  };

  const runImport = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      // Create missing accounts/categories first so tx mapping is stable.
      for (const name of preview.missingAccounts) {
        await dispatch(
          addAccount({
            name,
            type: 'checking',
            icon: 'account_balance',
            color: 'primary',
            startingBalance: 0,
          }),
        ).unwrap();
      }

      for (const name of preview.missingCategories) {
        await dispatch(
          addCategory({
            name,
            icon: 'more_horiz',
            color: 'secondary',
            budget: 0,
            budgetEnabled: true,
            rolloverEnabled: false,
          }),
        ).unwrap();
      }

      const stateNow = store.getState().app;
      const accountByName = new Map(stateNow.accounts.map((a) => [a.name.trim().toLowerCase(), a.id]));
      const categoryByName = new Map(stateNow.categories.map((c) => [c.name.trim().toLowerCase(), c.id]));

      const transactionsToImport = preview.toCreate
        .map((t) => {
          const accountId =
            t.type === 'transfer'
              ? undefined
              : t.accountName
                ? accountByName.get(t.accountName.trim().toLowerCase())
                : undefined;
          const categoryId =
            t.type === 'expense' && t.categoryName
              ? categoryByName.get(t.categoryName.trim().toLowerCase())
              : undefined;
          const fromAccountId =
            t.type === 'transfer' && t.fromAccountName
              ? accountByName.get(t.fromAccountName.trim().toLowerCase())
              : undefined;
          const toAccountId =
            t.type === 'transfer' && t.toAccountName
              ? accountByName.get(t.toAccountName.trim().toLowerCase())
              : undefined;

          if (t.type === 'transfer') {
            if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) return null;
          } else {
            if (!accountId || (t.type === 'expense' && !categoryId)) return null;
          }

          return {
            id: t.id,
            createdAt: t.createdAt,
            type: t.type,
            amount: t.amount,
            merchant: t.merchant,
            icon: t.icon,
            iconColor: t.iconColor,
            categoryId,
            accountId,
            fromAccountId,
            toAccountId,
            recurringRuleId: t.recurringRuleId,
          };
        })
        .filter((t): t is NonNullable<typeof t> => t != null);

      await dispatch(importTransactionsBulk(transactionsToImport)).unwrap();

      setShowConfirm(false);
      setFile(null);
      setCsvText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

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
          <h1 className="page-title truncate">CSV import/export</h1>
          <p className="text-muted text-[13px] mt-0.5">
            Export your transactions to a portable CSV and import them back later.
          </p>
        </div>
      </div>

      <Card>
        <h2 className="text-h2 font-semibold text-fg mb-1">Export</h2>
        <p className="text-muted text-[13px] mb-4">
          Downloads a stable CSV format (good for backups, spreadsheets, and migration).
        </p>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-fg text-[14px]">Also export accounts &amp; categories</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-brand"
            checked={includeCatalog}
            onChange={(e) => setIncludeCatalog(e.target.checked)}
          />
        </label>

        <Button className="mt-4" fullWidth onClick={exportNow}>
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </Button>
      </Card>

      <Card>
        <h2 className="text-h2 font-semibold text-fg mb-1">Import</h2>
        <p className="text-muted text-[13px] mb-4">
          Pick a CSV exported from SpendIt (or with the same header names). We’ll preview the
          changes and create missing accounts/categories by name.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void pickFile(e.target.files?.[0] ?? null)}
          className="block w-full text-[13px] text-muted file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-border file:bg-surface-2 file:text-fg file:font-medium hover:file:bg-elevated"
        />

        {file ? (
          <p className="text-subtle text-[12px] mt-2">
            Selected: <span className="text-fg">{file.name}</span>
          </p>
        ) : null}

        {error ? <p className="text-danger text-[12px] mt-2">{error}</p> : null}

        {preview ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-fg font-semibold">Preview</p>
            <div className="text-muted text-[13px] mt-2 flex flex-col gap-1">
              <div>
                Will import <span className="text-fg font-semibold">{preview.toCreate.length}</span>{' '}
                transactions
              </div>
              <div>
                Will create <span className="text-fg font-semibold">{preview.missingAccounts.length}</span> accounts and{' '}
                <span className="text-fg font-semibold">{preview.missingCategories.length}</span> categories
              </div>
              <div>
                Skipped <span className="text-fg font-semibold">{preview.skippedExisting}</span> duplicates and{' '}
                <span className="text-fg font-semibold">{preview.skippedInvalid}</span> invalid rows
              </div>
            </div>
            <Button
              className="mt-4"
              fullWidth
              disabled={busy || preview.toCreate.length === 0}
              onClick={() => setShowConfirm(true)}
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              Import
            </Button>
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={showConfirm}
        title="Import CSV?"
        description="We’ll add the new transactions to your database and create any missing accounts/categories by name. Duplicates will be skipped."
        confirmLabel="Import"
        cancelLabel="Cancel"
        loading={busy}
        onConfirm={() => void runImport()}
        onClose={() => {
          if (!busy) setShowConfirm(false);
        }}
      />
    </div>
  );
}

