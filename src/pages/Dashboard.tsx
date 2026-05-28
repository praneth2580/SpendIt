import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, categories, transactions } = useStore();

  return (
    <>
      {/* Prominent Balance (Level 2 Glassmorphism) */}
      <section className="relative rounded-xl p-5 overflow-hidden bg-white/5 backdrop-blur-[20px] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-2">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Total Net Worth</span>
          <div className="flex items-end gap-4">
            <h2 className="font-display text-display text-white tracking-tighter">
              ${user.totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className="font-body-md text-body-md text-secondary-container mb-2 flex items-center bg-secondary-container/10 px-2 py-1 rounded-md">
              <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span> +{user.netWorthChangePercent}%
            </span>
          </div>
        </div>
        
        {/* Quick Actions inline */}
        <div className="relative z-10 mt-5 flex gap-3">
          <button className="min-h-[48px] flex-1 bg-primary-container text-on-primary-container font-h2 text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors">
            <span className="material-symbols-outlined">add</span> Deposit
          </button>
          <button className="min-h-[48px] flex-1 bg-transparent border border-white/10 text-white font-h2 text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-white/5 transition-colors border-t-white/20 border-l-white/20">
            <span className="material-symbols-outlined">send</span> Send
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Spending & Categories */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Monthly Spending Summary Card (Level 1 Plate) */}
          <section className="bg-surface-container rounded-xl p-5 border border-white/5 border-t-white/10 border-l-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-h2 text-h2 text-white">Monthly Summary</h3>
              <button className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            
            <div className="flex items-center gap-5 mb-5">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline uppercase mb-1">Spent</span>
                <span className="font-h1 text-h1 text-white">
                  ${user.monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-outline uppercase mb-1">Budget</span>
                <span className="font-h1 text-h1 text-on-surface-variant">
                  ${user.monthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            
            <div className="w-full h-4 bg-background rounded-full overflow-hidden flex shadow-inner">
              <div className="h-full bg-primary-container w-[40%] rounded-r-full shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
              <div className="h-full bg-tertiary-container w-[15%] rounded-r-full -ml-2"></div>
              <div className="h-full bg-secondary-container w-[15%] rounded-r-full -ml-2"></div>
            </div>
          </section>

          {/* Category Spending Preview */}
          <section>
            <h3 className="font-h2 text-[16px] text-white mb-3 px-1">Spending by Category</h3>
            <div className="flex overflow-x-auto gap-3 pb-3 snap-x hide-scrollbar">
              {categories.map((category) => (
                <div key={category.id} className="snap-start shrink-0 w-32 bg-surface-container rounded-xl p-3 border border-white/5 border-t-white/10 border-l-white/10 flex flex-col gap-2 hover:bg-surface-container-high transition-colors cursor-pointer">
                  <div className={`w-10 h-10 rounded-full text-${category.color}-container bg-${category.color}-container/10 flex items-center justify-center border border-${category.color}-container/20`}>
                    <span className="material-symbols-outlined">{category.icon}</span>
                  </div>
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">{category.name}</div>
                    <div className="font-body-lg text-body-lg text-white font-medium">
                      ${category.spent.toLocaleString('en-US')}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="snap-start shrink-0 w-32 bg-surface-container rounded-xl p-3 border border-white/5 border-t-white/10 border-l-white/10 flex flex-col gap-3 hover:bg-surface-container-high transition-colors cursor-pointer flex items-center justify-center group">
                <span className="material-symbols-outlined text-outline group-hover:text-white transition-colors text-[32px]">arrow_forward</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Recent Transactions */}
        <div className="lg:col-span-1">
          <section className="bg-surface-container rounded-xl p-5 border border-white/5 border-t-white/10 border-l-white/10 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-h2 text-[18px] text-white">Recent</h3>
              <Link to="/transactions" className="font-label-caps text-label-caps text-primary-container hover:text-white transition-colors uppercase">See All</Link>
            </div>
            
            <div className="flex flex-col gap-4">
              {transactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      transaction.iconColor === 'white' 
                        ? 'bg-white/5 border border-white/10 group-hover:bg-white/10' 
                        : `bg-${transaction.iconColor}-container/10 border border-${transaction.iconColor}-container/20 group-hover:bg-${transaction.iconColor}-container/20`
                    }`}>
                      <span className={`material-symbols-outlined text-${transaction.iconColor === 'white' ? 'white' : transaction.iconColor + '-container'}`}>
                        {transaction.icon}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-lg text-body-lg text-white font-medium">{transaction.merchant}</span>
                      <span className="font-body-md text-[14px] text-on-surface-variant">{transaction.date}</span>
                    </div>
                  </div>
                  <span className={`font-body-lg text-body-lg font-medium ${transaction.amount > 0 ? 'text-secondary-container' : 'text-white'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Add action is in BottomNavBar */}
    </>
  );
}
