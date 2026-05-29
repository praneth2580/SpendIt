import { WebPlugin } from '@capacitor/core';
import type { UpiSmsMessage, UpiSmsPermissionStatus, UpiSmsPlugin } from './definitions';

export class UpiSmsWeb extends WebPlugin implements UpiSmsPlugin {
  async checkPermissions(): Promise<UpiSmsPermissionStatus> {
    return { sms: 'denied' };
  }

  async requestPermissions(): Promise<UpiSmsPermissionStatus> {
    return { sms: 'denied' };
  }

  async getPending(): Promise<{ messages: UpiSmsMessage[] }> {
    return { messages: [] };
  }
}
