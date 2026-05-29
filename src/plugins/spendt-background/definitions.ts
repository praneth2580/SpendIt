export interface SpendtBackgroundPlugin {
  syncRecurringSchedule(options: {
    rulesJson: string;
    applyMode: string;
  }): Promise<void>;
  syncSmsSettings(options: {
    smsAutoImport: boolean;
    smsImportMode: string;
  }): Promise<void>;
  openExactAlarmSettings(): Promise<void>;
}
