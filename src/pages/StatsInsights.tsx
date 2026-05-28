import { useStore } from '../store/useStore';

export default function StatsInsights() {
  const { categories } = useStore();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-h1 text-h1 text-white">Insights</h2>
      
      <section className="bg-surface-container rounded-xl p-5 border border-white/5 border-t-white/10 border-l-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-h2 text-h2 text-white">Category Breakdown</h3>
          <span className="text-on-surface-variant text-[12px]">This month</span>
        </div>

        <div className="flex flex-col gap-4">
          {categories.map((category) => (
            <div key={category.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-full bg-${category.color}-container/10 border border-${category.color}-container/20 flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-[16px] text-${category.color}-container`}>{category.icon}</span>
                  </div>
                  <span className="text-white font-medium truncate">{category.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-[13px] tabular-nums">
                    ${category.spent.toLocaleString('en-US')} <span className="text-on-surface-variant">/ ${category.budget.toLocaleString('en-US')}</span>
                  </div>
                  <div className="text-on-surface-variant text-[11px] tabular-nums">
                    {Math.round((category.spent / category.budget) * 100)}%
                  </div>
                </div>
              </div>

              <div className="w-full h-2.5 bg-background rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full bg-${category.color}-container rounded-r-full`}
                  style={{ width: `${Math.min(100, (category.spent / category.budget) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
