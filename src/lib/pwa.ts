import { registerSW } from 'virtual:pwa-register';

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function initPwa() {
  updateSW = registerSW({
    immediate: true,
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
    // iOS Safari
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}
