import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNative } from '../lib/capacitor';
import { refreshRecurring } from '../store/appSlice';
import { store } from '../store';

function toAppPath(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname || '/';
    return `${path}${u.search ?? ''}`;
  } catch {
    return null;
  }
}

function hasRecurringQuery(path: string): boolean {
  try {
    const u = new URL(path, 'https://local.invalid');
    return u.searchParams.has('recurringRule') || u.searchParams.has('recurringPending');
  } catch {
    return path.includes('recurringRule=') || path.includes('recurringPending=');
  }
}

async function prepareRecurringDeepLink(path: string): Promise<void> {
  if (!hasRecurringQuery(path)) return;
  const { hydrated } = store.getState().app;
  if (!hydrated) {
    await new Promise<void>((resolve) => {
      const unsub = store.subscribe(() => {
        if (store.getState().app.hydrated) {
          unsub();
          resolve();
        }
      });
      if (store.getState().app.hydrated) {
        unsub();
        resolve();
      }
    });
  }
  await store.dispatch(refreshRecurring());
}

export default function NativeDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative) return;
    let remove: (() => void) | null = null;

    const run = async () => {
      const { App } = await import('@capacitor/app');

      // Handle cold-start URL (widget / external deep link).
      try {
        const launch = await App.getLaunchUrl();
        const url = launch?.url;
        if (url) {
          const path = toAppPath(url);
          if (path) {
            await prepareRecurringDeepLink(path);
            navigate(path);
          }
        }
      } catch {
        // ignore
      }

      const listener = await App.addListener('appUrlOpen', (event) => {
        const path = toAppPath(event.url);
        if (!path) return;
        void prepareRecurringDeepLink(path).then(() => navigate(path));
      });
      remove = () => listener.remove();
    };

    void run();
    return () => remove?.();
  }, [navigate]);

  return null;
}

