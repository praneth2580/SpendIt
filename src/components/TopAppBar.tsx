import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/transactions')) return 'Transactions';
  if (pathname.startsWith('/stats')) return 'Insights';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/add')) return 'Add Transaction';
  return 'Spendt';
}

export default function TopAppBar() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="bg-black/20 font-inter tracking-tight top-0 border-b border-white/10 backdrop-blur-xl flex justify-between items-center w-full px-4 md:px-8 h-14 fixed z-50">
      <NavLink to="/" className="min-w-[120px] hover:opacity-90 transition-opacity">
        <Logo size="sm" subtitle={title} />
      </NavLink>

      <nav className="hidden md:flex gap-6 items-center absolute left-1/2 -translate-x-1/2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`
          }
        >
          History
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) =>
            `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`
          }
        >
          Stats
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) =>
            `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`
          }
        >
          Add
        </NavLink>
      </nav>

      <div className="min-w-[120px] flex justify-end">
        <NavLink
          to="/settings"
          className="h-9 w-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            settings
          </span>
        </NavLink>
      </div>
    </header>
  );
}
