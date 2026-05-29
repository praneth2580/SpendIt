import { registerPlugin } from '@capacitor/core';
import type { UpiSmsPlugin } from './definitions';

export type { UpiSmsMessage, UpiSmsPermissionStatus } from './definitions';

export const UpiSms = registerPlugin<UpiSmsPlugin>('UpiSms', {
  web: () => import('./web').then((m) => new m.UpiSmsWeb()),
});
