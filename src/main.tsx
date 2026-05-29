import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import Logo from './components/Logo.tsx';
import { initCapacitor } from './lib/capacitor';
import { useStore } from './store/useStore';

function Root() {
  const hydrate = useStore((state) => state.hydrate);
  const hydrated = useStore((state) => state.hydrated);
  const [capacitorReady, setCapacitorReady] = useState(false);

  useEffect(() => {
    void initCapacitor().finally(() => setCapacitorReady(true));
    void hydrate();
  }, [hydrate]);

  if (!hydrated || !capacitorReady) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" showWordmark subtitle="Minimalist finance" />
          <div className="h-8 w-8 rounded-full border-2 border-primary-container/30 border-t-primary-container animate-spin" />
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

createRoot(document.getElementById('root')!).render(<Root />);
