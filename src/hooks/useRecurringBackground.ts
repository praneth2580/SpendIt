import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNative } from '../lib/capacitor';
import {
  ensureRecurringNotificationPermission,
  registerRecurringNotificationHandlers,
  syncRecurringNotifications,
  type RecurringNotificationDetail,
} from '../lib/recurringNotifications';
import { syncNativeBackgroundSchedule } from '../lib/spendtBackgroundSync';
import { refreshRecurring } from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function useRecurringBackground() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const hydrated = useAppSelector((s) => s.app.hydrated);
  const pending = useAppSelector((s) => s.app.pendingRecurringQueue);
  const rules = useAppSelector((s) => s.app.recurringRules);
  const settings = useAppSelector((s) => s.app.settings);
  const lastSyncKey = useRef('');

  const openFromNotification = useCallback(
    (detail: RecurringNotificationDetail) => {
      const params = new URLSearchParams();
      if (detail.pendingId) params.set('recurringPending', detail.pendingId);
      else if (detail.ruleId) params.set('recurringRule', detail.ruleId);
      const qs = params.toString();
      navigate(qs ? `/?${qs}` : '/', { replace: false });
    },
    [navigate],
  );

  useEffect(() => {
    if (!hydrated) return;
    void dispatch(refreshRecurring());
    return registerRecurringNotificationHandlers((detail) => {
      void dispatch(refreshRecurring()).finally(() => openFromNotification(detail));
    });
  }, [dispatch, hydrated, openFromNotification]);

  useEffect(() => {
    if (!hydrated) return;

    const syncKey = `${pending.map((p) => p.id).join(',')}|${rules.map((r) => `${r.id}:${r.nextRunAt}`).join(',')}|${settings.recurringApplyMode}`;
    if (syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;

    void syncRecurringNotifications({ rules, pending, settings });
    void syncNativeBackgroundSchedule(rules, settings);
  }, [hydrated, pending, rules, settings]);

  useEffect(() => {
    if (!hydrated || !isNative) return;

    let remove: (() => void) | undefined;

    void (async () => {
      const { App } = await import('@capacitor/app');
      await ensureRecurringNotificationPermission();

      const listener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          void dispatch(refreshRecurring()).then(() => {
            void syncRecurringNotifications({
              rules,
              pending,
              settings,
            });
          });
        } else {
          void syncRecurringNotifications({ rules, pending, settings });
          void syncNativeBackgroundSchedule(rules, settings);
        }
      });
      remove = () => listener.remove();
    })();

    return () => remove?.();
  }, [dispatch, hydrated, rules, pending, settings]);
}
