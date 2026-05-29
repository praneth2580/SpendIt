import { registerSW } from 'virtual:pwa-register';

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

/** Remove stale dev service workers that intercept Vite HMR URLs. */
export async function unregisterDevServiceWorkers() {
  if (!import.meta.env.DEV) return;
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return;

  await Promise.all(registrations.map((registration) => registration.unregister()));
  console.info('[pwa] unregistered', registrations.length, 'service worker(s) for dev');
}

export function initPwa() {
  if (import.meta.env.DEV) return;

  updateSW = registerSW({
    immediate: true,
    onRegisterError(error) {
      console.warn('[pwa] service worker registration failed', error);
    },
    onRegistered(registration) {
      if (registration) {
        setInterval(() => void registration.update(), 60 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('spendt:pwa-update'));
    },
  });
}

export async function applyPwaUpdate() {
  await updateSW?.(true);
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}
