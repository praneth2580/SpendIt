import { Outlet } from 'react-router-dom';
import { useUpiSmsListener } from '../hooks/useUpiSmsListener';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';
import UpiImportSheet from './UpiImportSheet';
import PwaUpdateBanner from './PwaUpdateBanner';

export default function Layout() {
  useUpiSmsListener();

  return (
    <div className="relative min-h-screen bg-app text-fg">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent-violet/10 blur-[90px]" />
      </div>

      <TopAppBar />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-[4.75rem] md:px-8 md:pb-10 md:pt-20">
        <div className="flex flex-col gap-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
      <BottomNavBar />
      <UpiImportSheet />
      <PwaUpdateBanner />
    </div>
  );
}
