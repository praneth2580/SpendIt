import type { SpendtBackgroundPlugin } from './definitions';

export class SpendtBackgroundWeb implements SpendtBackgroundPlugin {
  async syncRecurringSchedule(): Promise<void> {
    // no-op on web
  }

  async syncSmsSettings(): Promise<void> {
    // no-op on web
  }

  async openExactAlarmSettings(): Promise<void> {
    // no-op on web
  }
}
