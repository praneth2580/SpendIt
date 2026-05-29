import { useStore } from '../store/useStore';
import { formatTransactionDate } from '../lib/format';

export default function Transactions() {
  const { transactions, settings, deleteTransaction } = useStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-h1 text-h1 text-white">Transactions</h2>
        <div className="text-on-surface-variant text-[12px]">
          {transactions.length} item{transactions.length === 1 ? '' : 's'}
        </div>
      </div>

      <section className="bg-surface-container rounded-xl border border-white/5 border-t-white/10 border-l-white/10 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-on-surface-variant">receipt_long</span>
            </div>
            <div className="text-white font-medium">No transactions yet</div>
            <div className="text-on-surface-variant text-[12px] mt-1">
              Tap “Add” to create your first one.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {transactions.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${transaction.merchant}"?`)) {
                    void deleteTransaction(transaction.id);
                  }
                }}
                className="w-full text-left px-4 py-4 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        transaction.iconColor === 'white'
                          ? 'bg-white/5 border border-white/10'
                          : `bg-${transaction.iconColor}-container/10 border border-${transaction.iconColor}-container/20`
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-${
                          transaction.iconColor === 'white' ? 'white' : transaction.iconColor + '-container'
                        }`}
                      >
                        {transaction.icon}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-medium truncate">{transaction.merchant}</span>
                      <span className="text-on-surface-variant text-[12px]">{formatTransactionDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-body-lg text-body-lg font-medium ${
                        transaction.amount > 0 ? 'text-secondary-container' : 'text-white'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: settings.currency })}
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                      chevron_right
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
