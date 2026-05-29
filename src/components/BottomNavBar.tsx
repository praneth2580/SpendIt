import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const items = [
  { to: '/', label: 'Home', icon: 'space_dashboard' },
  { to: '/transactions', label: 'Activity', icon: 'receipt_long' },
  { to: '/add', label: 'Add', icon: 'add', fab: true },
  { to: '/stats', label: 'Insights', icon: 'insights' },
  { to: '/settings', label: 'Settings', icon: 'tune' },
];

export default function BottomNavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Main navigation"
    >
      <div
        className="mx-auto flex max-w-lg items-end justify-around rounded-[1.75rem] border border-border px-2 py-2 shadow-float"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)' }}
      >
        {items.map((item) =>
          item.fab ? (
            <NavLink
              key={item.to}
              to={item.to}
              className="-mt-7 flex flex-col items-center"
              aria-label="Add transaction"
            >
              {({ isActive }) => (
                <div
                  className={clsx(
                    'flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-fg shadow-brand transition-transform active:scale-95',
                    isActive && 'ring-4 ring-brand/25',
                  )}
                >
                  <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                </div>
              )}
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex min-w-[56px] flex-col items-center gap-0.5 py-1"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'material-symbols-outlined text-[22px] transition-colors',
                      isActive ? 'text-brand' : 'text-muted',
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] font-medium',
                      isActive ? 'text-brand' : 'text-subtle',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
