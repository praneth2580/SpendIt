import { Capacitor } from '@capacitor/core';
import type { BackButtonListenerEvent } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';

/** Native shell setup only — no-op on web/PWA. */
export async function initCapacitor() {
  if (!isNative) return;

  try {
    const [{ StatusBar, Style }, { Keyboard, KeyboardResize }, { SplashScreen }] =
      await Promise.all([
        import('@capacitor/status-bar'),
        import('@capacitor/keyboard'),
        import('@capacitor/splash-screen'),
      ]);

    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });

    if (Capacitor.getPlatform() === 'ios') {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    }

    await SplashScreen.hide();
  } catch (error) {
    console.warn('[capacitor] init failed, continuing into app', error);
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    } catch {
      // ignore — web assets may not include native splash
    }
  }
}

export async function registerNativeBackButton(
  handler: (event: BackButtonListenerEvent) => void,
) {
  if (!isNative) return undefined;

  const { App } = await import('@capacitor/app');
  return App.addListener('backButton', handler);
}
