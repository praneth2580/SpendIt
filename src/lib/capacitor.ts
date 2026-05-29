import { App, type BackButtonListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();

export async function initCapacitor() {
  if (!isNative) return;

  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#000000' });

  if (Capacitor.getPlatform() === 'ios') {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  }

  await SplashScreen.hide();
}

export function registerNativeBackButton(
  handler: (event: BackButtonListenerEvent) => void,
) {
  if (!isNative) return Promise.resolve(undefined);

  return App.addListener('backButton', handler);
}
