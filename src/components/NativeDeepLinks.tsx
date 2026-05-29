import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNative } from '../lib/capacitor';

function toAppPath(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname || '/';
    return `${path}${u.search ?? ''}`;
  } catch {
    return null;
  }
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
          if (path) navigate(path);
        }
      } catch {
        // ignore
      }

      const listener = await App.addListener('appUrlOpen', (event) => {
        const path = toAppPath(event.url);
        if (path) navigate(path);
      });
      remove = () => listener.remove();
    };

    void run();
    return () => remove?.();
  }, [navigate]);

  return null;
}

