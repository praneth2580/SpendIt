import { StrictMode, useEffect, useState } from 'react';
import App from './App.tsx';
import Logo from './components/Logo.tsx';
import Button from './components/ui/Button';
import { isNative, initCapacitor } from './lib/capacitor';
import { hydrateApp } from './store/appSlice';
import { useAppDispatch } from './store/hooks';

type BootPhase = 'loading' | 'ready' | 'error';

export default function AppBootstrap() {
  const dispatch = useAppDispatch();
  const [phase, setPhase] = useState<BootPhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runBoot = async () => {
    setPhase('loading');
    setErrorMessage(null);

    try {
      const tasks: Promise<unknown>[] = [dispatch(hydrateApp()).unwrap()];
      if (isNative) tasks.push(initCapacitor());
      await Promise.all(tasks);
      setPhase('ready');
    } catch (error) {
      console.error('[boot] failed', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not load your local data.',
      );
      setPhase('error');
    }
  };

  useEffect(() => {
    void runBoot();
  }, [dispatch]);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-app text-fg flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <Logo size="lg" />
          <p className="text-muted text-[14px] font-medium">Personal finance</p>
          <div className="h-9 w-9 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-app text-fg flex items-center justify-center p-6">
        <div className="max-w-sm w-full flex flex-col gap-4 text-center">
          <Logo size="md" />
          <p className="text-muted text-[14px]">{errorMessage}</p>
          <Button onClick={() => void runBoot()}>Try again</Button>
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
