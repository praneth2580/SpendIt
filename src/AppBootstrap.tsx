import { StrictMode, useEffect, useState } from 'react';
import App from './App.tsx';
import Logo from './components/Logo.tsx';
import { initCapacitor } from './lib/capacitor';
import { hydrateApp } from './store/appSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';

export default function AppBootstrap() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.app.hydrated);
  const [capacitorReady, setCapacitorReady] = useState(false);

  useEffect(() => {
    void initCapacitor().finally(() => setCapacitorReady(true));
    void dispatch(hydrateApp());
  }, [dispatch]);

  if (!hydrated || !capacitorReady) {
    return (
      <div className="min-h-screen bg-app text-fg flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <Logo size="lg" showWordmark subtitle="Personal finance" />
          <div className="h-9 w-9 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}
