import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

type QuickAddExpenseProps = {
  embedded?: boolean;
  onDone?: () => void;
};

export default function QuickAddExpense({ embedded = false, onDone }: QuickAddExpenseProps) {
  const [searchParams] = useSearchParams();
  const initialAmount = searchParams.get('amount') ?? '';
  const initialNote = searchParams.get('merchant') ?? searchParams.get('note') ?? '';

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState(initialAmount);
  const [note, setNote] = useState(initialNote);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('food');
  const [showKeypad, setShowKeypad] = useState(true);
  const { addTransaction } = useStore();
  const navigate = useNavigate();

  const categories = useMemo(
    () =>
      [
        { id: 'food', name: 'Food', icon: 'restaurant' },
        { id: 'transit', name: 'Transit', icon: 'directions_car' },
        { id: 'shopping', name: 'Shopping', icon: 'shopping_bag' },
        { id: 'bills', name: 'Bills', icon: 'receipt_long' },
      ] as const,
    []
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? categories[0],
    [categories, selectedCategoryId]
  );

  const parsedAmount = Number.parseFloat(amount);
  const amountIsValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const clampAmountString = (next: string) => {
    const cleaned = next.replace(/[^\d.]/g, '');
    const [intPart, ...rest] = cleaned.split('.');
    const dec = rest.join('');
    if (rest.length === 0) return intPart;
    return `${intPart}.${dec.slice(0, 2)}`;
  };

  const keypadAppend = (ch: string) => setAmount((prev) => clampAmountString(prev + ch));
  const keypadBackspace = () => setAmount((prev) => prev.slice(0, -1));
  const keypadClear = () => setAmount('');

  const formatDisplayAmount = (raw: string) => {
    if (!raw) return '0.00';
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return '0.00';
    return n.toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountIsValid) return;

    addTransaction({
      merchant: note.trim() || selectedCategory.name,
      date: 'Just now',
      amount: type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount),
      icon: selectedCategory.icon,
      iconColor: 'white',
    });

    if (onDone) onDone();
    else navigate('/');
  };

  return (
    <div className={embedded ? 'w-full' : 'max-w-md mx-auto w-full'}>
      <form
        onSubmit={handleSubmit}
        className={
          embedded
            ? 'flex flex-col gap-5'
            : 'min-h-[calc(100dvh-160px)] flex flex-col gap-5 bg-surface-container rounded-2xl p-4 border border-white/5 border-t-white/10 border-l-white/10'
        }
      >
        <div className="flex justify-center">
          <div className="bg-black/30 border border-white/10 rounded-full p-1 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`px-6 py-2 rounded-full font-body-md text-[14px] transition-colors ${
                type === 'expense'
                  ? 'bg-surface-container-high text-white'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`px-6 py-2 rounded-full font-body-md text-[14px] transition-colors ${
                type === 'income'
                  ? 'bg-surface-container-high text-white'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowKeypad(true)}
          className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 hover:bg-white/5 transition-colors"
          aria-label="Edit amount"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-on-surface-variant text-[18px] font-medium">$</span>
            <span className="text-white text-[40px] leading-none font-semibold tracking-tight tabular-nums">
              {formatDisplayAmount(amount)}
            </span>
          </div>
          <div className="mt-1 text-center text-[11px] text-on-surface-variant">
            Tap to edit amount
          </div>
        </button>

        {showKeypad ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => keypadAppend(d)}
                  className="h-12 rounded-2xl bg-black/20 border border-white/10 text-white text-[18px] font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => keypadAppend('.')}
                className="h-12 rounded-2xl bg-black/20 border border-white/10 text-white text-[18px] font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                .
              </button>
              <button
                type="button"
                onClick={() => keypadAppend('0')}
                className="h-12 rounded-2xl bg-black/20 border border-white/10 text-white text-[18px] font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={keypadBackspace}
                className="h-12 rounded-2xl bg-black/20 border border-white/10 text-on-surface-variant hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center"
                aria-label="Backspace"
              >
                <span className="material-symbols-outlined text-[22px]">backspace</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={keypadClear}
                className="h-11 flex-1 rounded-2xl bg-transparent border border-white/10 text-on-surface-variant hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowKeypad(false)}
                disabled={!amountIsValid}
                className="h-11 flex-1 rounded-2xl bg-primary-container text-on-primary-container font-h2 text-[14px] hover:bg-surface-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-label-caps uppercase tracking-widest">Category</span>
              <button
                type="button"
                className="text-on-surface-variant hover:text-white transition-colors"
                aria-label="Edit categories"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {categories.map((c) => {
                const active = c.id === selectedCategoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`shrink-0 w-[74px] rounded-2xl border transition-colors flex flex-col items-center justify-center py-3 gap-2 ${
                      active
                        ? 'border-primary-container/40 bg-primary-container/10'
                        : 'border-white/10 bg-black/20 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        active ? 'bg-primary-container/10' : 'bg-white/5'
                      } border border-white/10`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                        {c.icon}
                      </span>
                    </div>
                    <span className={`text-[11px] ${active ? 'text-white' : 'text-on-surface-variant'}`}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-background/60 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">notes</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-transparent text-white outline-none placeholder:text-on-surface-variant"
                placeholder="Add a note (optional)"
              />
            </div>

            <div className="mt-auto pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowKeypad(true)}
                className="min-h-[52px] w-[120px] bg-transparent border border-white/10 text-white rounded-2xl hover:bg-white/5 transition-colors"
              >
                Edit amount
              </button>
              <button
                type="submit"
                disabled={!amountIsValid}
                className="min-h-[52px] flex-1 bg-primary-container text-on-primary-container font-h2 text-[16px] rounded-2xl flex items-center justify-center hover:bg-surface-tint transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,229,255,0.14)]"
              >
                Save {type === 'expense' ? 'Expense' : 'Income'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
