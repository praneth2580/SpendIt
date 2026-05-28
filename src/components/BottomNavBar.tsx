import { NavLink } from 'react-router-dom';

export default function BottomNavBar() {
  return (
    <nav className="bg-black/80 text-[10px] font-medium uppercase tracking-widest fixed bottom-0 left-0 w-full flex justify-around items-end px-4 pt-2 pb-5 md:hidden z-50 rounded-t-3xl border-t border-white/10 backdrop-blur-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.55)] transition-all duration-300">
      <NavLink 
        to="/" 
        className={({isActive}) => `flex flex-col items-center justify-center transition-transform ${isActive ? 'text-primary-container scale-105' : 'text-on-surface-variant hover:text-white'}`}
      >
        <span className="material-symbols-outlined mb-1">dashboard</span>
        <span>Home</span>
      </NavLink>
      
      <NavLink 
        to="/transactions" 
        className={({isActive}) => `flex flex-col items-center justify-center transition-transform ${isActive ? 'text-primary-container scale-105' : 'text-on-surface-variant hover:text-white'}`}
      >
        <span className="material-symbols-outlined mb-1">receipt_long</span>
        <span>History</span>
      </NavLink>

      <NavLink
        to="/add"
        className={({ isActive }) =>
          `-mt-6 flex flex-col items-center justify-center ${isActive ? 'text-primary-container' : 'text-white'}`
        }
        aria-label="Add transaction"
      >
        <div className="h-14 w-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_26px_rgba(0,229,255,0.28)] border border-white/15 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[26px]">add</span>
        </div>
      </NavLink>
      
      <NavLink 
        to="/stats" 
        className={({isActive}) => `flex flex-col items-center justify-center transition-transform ${isActive ? 'text-primary-container scale-105' : 'text-on-surface-variant hover:text-white'}`}
      >
        <span className="material-symbols-outlined mb-1">leaderboard</span>
        <span>Stats</span>
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={({isActive}) => `flex flex-col items-center justify-center transition-transform ${isActive ? 'text-primary-container scale-105' : 'text-on-surface-variant hover:text-white'}`}
      >
        <span className="material-symbols-outlined mb-1">settings</span>
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
