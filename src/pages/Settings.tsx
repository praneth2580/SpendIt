export default function Settings() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-h1 text-h1 text-white">Settings</h2>

      <section className="bg-surface-container rounded-xl p-5 border border-white/5 border-t-white/10 border-l-white/10">
        <div className="flex flex-col divide-y divide-white/10">
          {[
            { title: 'Currency', subtitle: 'USD' },
            { title: 'Theme', subtitle: 'Dark' },
            { title: 'Export', subtitle: 'Download transactions' },
          ].map((row) => (
            <button
              key={row.title}
              type="button"
              className="py-4 flex items-center justify-between text-left hover:bg-white/5 active:bg-white/10 transition-colors -mx-3 px-3 rounded-lg"
            >
              <div className="flex flex-col">
                <span className="text-white font-medium">{row.title}</span>
                <span className="text-on-surface-variant text-[12px]">{row.subtitle}</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                chevron_right
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

