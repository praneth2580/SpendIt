import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportFullDatabase, restoreFullDatabase, type SpendtBackupV1 } from '../lib/db';
import { useAppDispatch } from '../store/hooks';
import { hydrateApp } from '../store/appSlice';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BackupRestoreSettings() {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>('');
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  const parsed = useMemo(() => {
    if (!fileText) return null;
    try {
      return JSON.parse(fileText) as SpendtBackupV1;
    } catch {
      return null;
    }
  }, [fileText]);

  const doExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const snapshot = await exportFullDatabase();
      const ts = snapshot.exportedAt.slice(0, 19).replace(/[:T]/g, '-');
      downloadJson(`spendt-backup-${ts}.json`, snapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (f: File | null) => {
    setFile(f);
    setError(null);
    setFileText('');
    if (!f) return;
    try {
      setFileText(await f.text());
    } catch {
      setError('Could not read file.');
    }
  };

  const doRestore = async () => {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      if (parsed.schemaVersion !== 1) {
        throw new Error('Unsupported backup format.');
      }
      await restoreFullDatabase(parsed);
      await dispatch(hydrateApp()).unwrap();
      setShowConfirmRestore(false);
      setFile(null);
      setFileText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed.');
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
          <h1 className="page-title truncate">Backup &amp; restore</h1>
          <p className="text-muted text-[13px] mt-0.5">
            Export the full local database to JSON and restore it later (replace-all).
          </p>
        </div>
      </div>

      <Card>
        <h2 className="text-h2 font-semibold text-fg mb-1">Backup</h2>
        <p className="text-muted text-[13px] mb-4">
          Exports settings, accounts, categories, transactions, extraction rules, recurring rules,
          and internal meta keys.
        </p>
        <Button fullWidth disabled={busy} onClick={() => void doExport()}>
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export JSON backup
        </Button>
        {error ? <p className="text-danger text-[12px] mt-3">{error}</p> : null}
      </Card>

      <Card>
        <h2 className="text-h2 font-semibold text-fg mb-1">Restore</h2>
        <p className="text-muted text-[13px] mb-4">
          Restoring will <span className="text-fg font-semibold">replace everything</span> in your
          local database on this device.
        </p>

        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => void pickFile(e.target.files?.[0] ?? null)}
          className="block w-full text-[13px] text-muted file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-border file:bg-surface-2 file:text-fg file:font-medium hover:file:bg-elevated"
        />

        {file ? (
          <p className="text-subtle text-[12px] mt-2">
            Selected: <span className="text-fg">{file.name}</span>
          </p>
        ) : null}

        {parsed ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-fg font-semibold">Backup detected</p>
            <p className="text-muted text-[13px] mt-2">
              Exported at <span className="text-fg">{parsed.exportedAt}</span>
            </p>
            <Button
              variant="danger"
              className="mt-4"
              fullWidth
              disabled={busy}
              onClick={() => setShowConfirmRestore(true)}
            >
              <span className="material-symbols-outlined text-[18px]">restore</span>
              Restore (replace all)
            </Button>
          </div>
        ) : fileText ? (
          <p className="text-danger text-[12px] mt-3">This file isn’t a valid SpendIt backup.</p>
        ) : null}

        {error ? <p className="text-danger text-[12px] mt-3">{error}</p> : null}
      </Card>

      <ConfirmDialog
        open={showConfirmRestore}
        title="Restore backup and replace all data?"
        description="This will wipe your current local database and replace it with the backup contents. This cannot be undone."
        confirmLabel="Restore"
        cancelLabel="Cancel"
        loading={busy}
        onConfirm={() => void doRestore()}
        onClose={() => {
          if (!busy) setShowConfirmRestore(false);
        }}
      />
    </div>
  );
}

