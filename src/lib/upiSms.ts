import { v4 as uuidv4 } from 'uuid';
import { UpiSms, type UpiSmsMessage } from '../plugins/upi-sms';
import { isAndroid } from './capacitor';
import { parseUpiSms } from './upiSmsParser';
import type { PendingUpiImport } from '../store/types';

export function rawMessageToPending(message: UpiSmsMessage): PendingUpiImport | null {
  const parsed = parseUpiSms(message.body, message.sender, message.timestamp);
  if (!parsed) return null;

  return {
    id: uuidv4(),
    amount: parsed.amount,
    type: parsed.type,
    merchant: parsed.merchant,
    body: message.body,
    sender: message.sender,
    timestamp: message.timestamp,
    dedupeKey: parsed.dedupeKey,
  };
}

export async function getUpiSmsPermissionStatus() {
  if (!isAndroid) return 'denied' as const;
  const status = await UpiSms.checkPermissions();
  return status.sms;
}

export async function requestUpiSmsPermission() {
  if (!isAndroid) return 'denied' as const;
  const status = await UpiSms.requestPermissions();
  return status.sms;
}

export async function drainPendingUpiSms(): Promise<UpiSmsMessage[]> {
  if (!isAndroid) return [];
  const { messages } = await UpiSms.getPending();
  return messages ?? [];
}

export function listenForUpiSms(handler: (message: UpiSmsMessage) => void) {
  if (!isAndroid) {
    return Promise.resolve({ remove: async () => undefined });
  }
  return UpiSms.addListener('upiSmsReceived', handler);
}
