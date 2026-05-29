import clsx from 'clsx';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../lib/theme';

const options: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  { value: 'system', label: 'Auto', icon: 'routine' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surface-2 border border-border">
      {options.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={clsx(
              'flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-medium transition-all',
              active
                ? 'bg-surface text-fg shadow-card'
                : 'text-muted hover:text-fg',
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
