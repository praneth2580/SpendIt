import { useState } from 'react';
import { useStore } from '../store/useStore';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'] as const;

export default function Settings() {
  const { settings, updateSettings, updateBudget } = useStore();
  const [budgetInput, setBudgetInput] = useState(String(settings.monthlyBudget));

  const handleBudgetSave = () => {
    const nextBudget = Number.parseFloat(budgetInput);
    if (!Number.isFinite(nextBudget) || nextBudget <= 0) return;
    void updateBudget(nextBudget);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-h1 text-h1 text-white">Settings</h2>

      <section className="bg-surface-container rounded-xl p-5 border border-white/5 border-t-white/10 border-l-white/10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="currency" className="text-white font-medium">
              Currency
            </label>
            <select
              id="currency"
              value={settings.currency}
              onChange={(event) =>
                void updateSettings({ currency: event.target.value })
              }
              className="bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="monthly-budget" className="text-white font-medium">
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
                className="flex-1 bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
              />
              <button
                type="button"
                onClick={handleBudgetSave}
                className="px-4 rounded-xl bg-primary-container text-on-primary-container font-medium hover:bg-surface-tint transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/10">
            <div className="flex flex-col">
              <span className="text-white font-medium">Theme</span>
              <span className="text-on-surface-variant text-[12px] capitalize">
                {settings.theme}
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              dark_mode
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify(useStore.getState().transactions, null, 2)],
                { type: 'application/json' },
              );
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'spendt-transactions.json';
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="py-4 flex items-center justify-between text-left hover:bg-white/5 active:bg-white/10 transition-colors -mx-3 px-3 rounded-lg border-t border-white/10"
          >
            <div className="flex flex-col">
              <span className="text-white font-medium">Export</span>
              <span className="text-on-surface-variant text-[12px]">
                Download transactions as JSON
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              download
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
