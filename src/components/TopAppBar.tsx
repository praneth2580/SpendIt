import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Logo from './Logo';
import { useTheme } from '../hooks/useTheme';
import { resolveTheme } from '../lib/theme';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Overview';
  if (pathname.startsWith('/transactions')) return 'Transactions';
  if (pathname.startsWith('/stats')) return 'Insights';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/add')) return 'Add';
  return 'Spendt';
}

const navItems = [
  { to: '/', label: 'Home', icon: 'space_dashboard' },
  { to: '/transactions', label: 'Activity', icon: 'receipt_long' },
  { to: '/stats', label: 'Insights', icon: 'insights' },
  { to: '/add', label: 'Add', icon: 'add_circle' },
];

export default function TopAppBar() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const { theme, setTheme } = useTheme();
  const isDark = resolveTheme(theme) === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header
      className="fixed top-0 z-50 w-full border-b border-border px-4 md:px-8"
      style={{ background: 'var(--header-bg)', backdropFilter: 'blur(16px)' }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
        <NavLink to="/" className="min-w-0 hover:opacity-90 transition-opacity">
          <Logo size="sm" subtitle={title} />
        </NavLink>

        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-surface-2 border border-border p-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all',
                  isActive
                    ? 'bg-surface text-fg shadow-card'
                    : 'text-muted hover:text-fg',
                )
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-2xl border border-border bg-surface-2 hover:bg-elevated transition-colors flex items-center justify-center"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-[20px] text-muted">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <NavLink
            to="/settings"
            className="h-10 w-10 rounded-2xl border border-border bg-surface-2 hover:bg-elevated transition-colors flex items-center justify-center"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[20px] text-muted">
              settings
            </span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
