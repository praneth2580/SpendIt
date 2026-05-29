import { registerPlugin } from '@capacitor/core';
import type { SpendtBackgroundPlugin } from './definitions';

export const SpendtBackground = registerPlugin<SpendtBackgroundPlugin>('SpendtBackground', {
  web: () => import('./web').then((m) => new m.SpendtBackgroundWeb()),
});
