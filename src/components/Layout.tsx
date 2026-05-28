import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';

export default function Layout() {
  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen pb-[100px] md:pb-0 dark">
      <TopAppBar />
      <main className="pt-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  );
}
