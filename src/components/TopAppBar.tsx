import { NavLink, useLocation } from 'react-router-dom';

export default function TopAppBar() {
  const { pathname } = useLocation();

  const title =
    pathname === '/'
      ? 'Dashboard'
      : pathname.startsWith('/transactions')
        ? 'Transactions'
        : pathname.startsWith('/stats')
          ? 'Insights'
          : pathname.startsWith('/settings')
            ? 'Settings'
            : 'Spendt';

  return (
    <header className="bg-black/20 font-inter tracking-tight top-0 border-b border-white/10 backdrop-blur-xl flex justify-between items-center w-full px-4 md:px-8 h-14 fixed z-50">
      <div className="flex items-center gap-3 min-w-[120px]">
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">account_circle</span>
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
            Spendt
          </span>
          <span className="text-white text-[14px] font-medium">{title}</span>
        </div>
      </div>

      <h1 className="sm:hidden text-white text-[14px] font-semibold tracking-tight">{title}</h1>
      
      {/* Desktop Web Nav Cluster */}
      <nav className="hidden md:flex gap-6 items-center absolute left-1/2 -translate-x-1/2">
        <NavLink 
          to="/" 
          className={({isActive}) => `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`}
        >
          Home
        </NavLink>
        <NavLink 
          to="/transactions" 
          className={({isActive}) => `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`}
        >
          History
        </NavLink>
        <NavLink 
          to="/stats" 
          className={({isActive}) => `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`}
        >
          Stats
        </NavLink>
        <NavLink
          to="/add"
          className={({isActive}) => `font-label-caps text-label-caps uppercase hover:text-white transition-colors active:scale-95 duration-200 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`}
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
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">settings</span>
        </NavLink>
      </div>
    </header>
  );
}
