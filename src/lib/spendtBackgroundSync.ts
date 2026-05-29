import type { AppSettings, RecurringRule } from '../store/types';
import { isAndroid } from './capacitor';

let exactAlarmPrompted = false;

export async function syncNativeBackgroundSchedule(
  rules: RecurringRule[],
  settings: AppSettings,
): Promise<void> {
  if (!isAndroid) return;
  try {
    const { SpendtBackground } = await import('../plugins/spendt-background');
    await SpendtBackground.syncRecurringSchedule({
      rulesJson: JSON.stringify(rules),
      applyMode: settings.recurringApplyMode ?? 'smart',
    });
    await SpendtBackground.syncSmsSettings({
      smsAutoImport: settings.smsAutoImport,
      smsImportMode: settings.smsImportMode,
    });
    if (
      !exactAlarmPrompted &&
      (settings.recurringApplyMode ?? 'smart') !== 'auto'
    ) {
      exactAlarmPrompted = true;
      await SpendtBackground.openExactAlarmSettings();
    }
  } catch (error) {
    console.warn('[spendt-background] native sync failed', error);
  }
}
