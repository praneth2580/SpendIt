import type {
  AppSettings,
  PendingRecurringInstance,
  RecurringRule,
} from '../store/types';
import { isNative } from './capacitor';
import { formatCurrency } from './format';

const CHANNEL_ID = 'recurring-payments';
const PENDING_ID_BASE = 50_000;
const SCHEDULED_ID_BASE = 60_000;

export const RECURRING_NOTIFICATION_EVENT = 'spendt:recurring-notification';

export type RecurringNotificationDetail = {
  pendingId?: string;
  ruleId?: string;
};

function hashId(key: string, base: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return base + (Math.abs(h) % 9_000);
}

function needsUserApproval(settings: AppSettings): boolean {
  const mode = settings.recurringApplyMode ?? 'smart';
  return mode === 'smart' || mode === 'confirm';
}

async function getLocalNotifications() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

export async function ensureRecurringNotificationPermission(): Promise<boolean> {
  if (!isNative) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
    }
    return false;
  }

  try {
    const LocalNotifications = await getLocalNotifications();
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  } catch (error) {
    console.warn('[recurring-notifications] permission failed', error);
    return false;
  }
}

async function ensureChannel() {
  if (!isNative) return;
  const LocalNotifications = await getLocalNotifications();
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Recurring payments',
    description: 'Due payments that need your confirmation',
    importance: 5,
    visibility: 1,
    sound: 'default',
    vibration: true,
  });
}

async function cancelRecurringNotifications() {
  if (!isNative) return;
  try {
    const LocalNotifications = await getLocalNotifications();
    const pending = await LocalNotifications.getPending();
    const recurring = pending.notifications.filter(
      (n) =>
        (n.id >= PENDING_ID_BASE && n.id < SCHEDULED_ID_BASE) ||
        (n.id >= SCHEDULED_ID_BASE && n.id < SCHEDULED_ID_BASE + 10_000),
    );
    if (recurring.length > 0) {
      await LocalNotifications.cancel({ notifications: recurring.map((n) => ({ id: n.id })) });
    }
  } catch (error) {
    console.warn('[recurring-notifications] cancel failed', error);
  }
}

function ruleAmountLabel(rule: RecurringRule, currency: string): string {
  const amount = rule.type === 'expense' ? -rule.amount : rule.amount;
  return formatCurrency(amount, currency, { showSign: rule.type !== 'transfer' });
}

export async function syncRecurringNotifications(input: {
  rules: RecurringRule[];
  pending: PendingRecurringInstance[];
  settings: AppSettings;
}): Promise<void> {
  const { rules, pending, settings } = input;

  if (!needsUserApproval(settings)) {
    await cancelRecurringNotifications();
    return;
  }

  const allowed = await ensureRecurringNotificationPermission();
  if (!allowed) return;

  await ensureChannel();

  if (!isNative) {
    if (pending.length > 0 && document.visibilityState === 'hidden') {
      const first = pending[0];
      const rule = rules.find((r) => r.id === first.ruleId);
      if (rule && Notification.permission === 'granted') {
        try {
          const n = new Notification('SpendIt — payment due', {
            body: `${rule.name} · ${ruleAmountLabel(rule, settings.currency)}. Tap to confirm.`,
            tag: first.id,
            data: { pendingId: first.id },
          });
          n.onclick = () => {
            window.focus();
            window.dispatchEvent(
              new CustomEvent<RecurringNotificationDetail>(RECURRING_NOTIFICATION_EVENT, {
                detail: { pendingId: first.id },
              }),
            );
          };
        } catch {
          // ignore
        }
      }
    }
    return;
  }

  await cancelRecurringNotifications();

  const LocalNotifications = await getLocalNotifications();
  const notifications: Array<{
    id: number;
    title: string;
    body: string;
    channelId: string;
    schedule: { at: Date; allowWhileIdle?: boolean };
    extra: RecurringNotificationDetail;
    actionTypeId?: string;
    autoCancel?: boolean;
  }> = [];

  const now = Date.now();

  for (const item of pending) {
    const rule = rules.find((r) => r.id === item.ruleId);
    if (!rule) continue;
    notifications.push({
      id: hashId(`pending-${item.id}`, PENDING_ID_BASE),
      title: 'Confirm recurring payment',
      body: `${rule.name} · ${ruleAmountLabel(rule, settings.currency)} is due. Tap to review.`,
      channelId: CHANNEL_ID,
      schedule: { at: new Date(now + 800), allowWhileIdle: true },
      extra: { pendingId: item.id, ruleId: rule.id },
      autoCancel: true,
    });
  }

  for (const rule of rules) {
    if (!rule.active) continue;
    const due = new Date(rule.nextRunAt);
    if (Number.isNaN(due.getTime())) continue;
    if (due.getTime() <= now) continue;
    if (due.getTime() - now > 365 * 24 * 60 * 60 * 1000) continue;

    const alreadyPending = pending.some((p) => p.ruleId === rule.id);
    if (alreadyPending) continue;

    notifications.push({
      id: hashId(`schedule-${rule.id}-${due.getTime()}`, SCHEDULED_ID_BASE),
      title: 'Recurring payment due',
      body: `${rule.name} · ${ruleAmountLabel(rule, settings.currency)}. Tap to confirm or link.`,
      channelId: CHANNEL_ID,
      schedule: { at: due, allowWhileIdle: true },
      extra: { ruleId: rule.id },
      autoCancel: true,
    });
  }

  if (notifications.length === 0) return;

  try {
    await LocalNotifications.schedule({ notifications });
  } catch (error) {
    console.warn('[recurring-notifications] schedule failed', error);
  }
}

export function registerRecurringNotificationHandlers(
  onOpen: (detail: RecurringNotificationDetail) => void,
): () => void {
  if (!isNative) {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<RecurringNotificationDetail>;
      onOpen(custom.detail ?? {});
    };
    window.addEventListener(RECURRING_NOTIFICATION_EVENT, handler);
    return () => window.removeEventListener(RECURRING_NOTIFICATION_EVENT, handler);
  }

  let removeListeners: (() => void) | null = null;

  void (async () => {
    try {
      const LocalNotifications = await getLocalNotifications();
      const received = await LocalNotifications.addListener(
        'localNotificationReceived',
        (notification) => {
          const extra = notification.extra as RecurringNotificationDetail | undefined;
          if (extra?.pendingId || extra?.ruleId) onOpen(extra);
        },
      );
      const action = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (actionEvent) => {
          const extra = actionEvent.notification.extra as
            | RecurringNotificationDetail
            | undefined;
          if (extra?.pendingId || extra?.ruleId) onOpen(extra);
        },
      );
      removeListeners = () => {
        void received.remove();
        void action.remove();
      };
    } catch (error) {
      console.warn('[recurring-notifications] listeners failed', error);
    }
  })();

  return () => removeListeners?.();
}
