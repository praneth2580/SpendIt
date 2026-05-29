import type { PluginListenerHandle } from '@capacitor/core';

export interface UpiSmsMessage {
  sender: string;
  body: string;
  timestamp: number;
}

export interface UpiSmsPermissionStatus {
  sms: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
}

export interface UpiSmsPlugin {
  checkPermissions(): Promise<UpiSmsPermissionStatus>;
  requestPermissions(): Promise<UpiSmsPermissionStatus>;
  getPending(): Promise<{ messages: UpiSmsMessage[] }>;
  addListener(
    eventName: 'upiSmsReceived',
    listenerFunc: (message: UpiSmsMessage) => void,
  ): Promise<PluginListenerHandle>;
}
