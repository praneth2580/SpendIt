import { useEffect, useRef } from 'react';
import type { UpiSmsMessage } from '../plugins/upi-sms';
import { canAutoApplyImport, enrichPendingImport } from '../lib/extractionRules';
import {
  addTransaction,
  markSmsProcessed,
  setPendingUpiImport,
} from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { store } from '../store';
import { isAndroid } from '../lib/capacitor';
import {
  drainPendingUpiSms,
  listenForUpiSms,
  rawMessageToPending,
} from '../lib/upiSms';

export function useUpiSmsListener() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.app.hydrated);
  const settings = useAppSelector((state) => state.app.settings);
  const handlingRef = useRef(false);

  useEffect(() => {
    if (!hydrated || !isAndroid || !settings.smsAutoImport) return;

    const processMessage = async (message: UpiSmsMessage) => {
      if (handlingRef.current) return;

      const raw = rawMessageToPending(message);
      if (!raw) return;

      const { processedSmsKeys, settings: liveSettings, categories, accounts, extractionRules } =
        store.getState().app;

      if (!liveSettings.smsAutoImport) return;
      if (processedSmsKeys.includes(raw.dedupeKey)) return;

      const pending = enrichPendingImport(raw, extractionRules);
      const { action } = pending;

      handlingRef.current = true;
      try {
        await dispatch(markSmsProcessed(pending.dedupeKey));

        if (liveSettings.smsImportMode === 'auto' && canAutoApplyImport(action)) {
          const category = categories.find((item) => item.id === action.categoryId);
          const account = accounts.find((item) => item.id === action.accountId);

          if (!account || (action.type === 'expense' && !category)) {
            await dispatch(setPendingUpiImport(pending));
            return;
          }

          await dispatch(
            addTransaction({
              merchant: action.merchant,
              amount:
                action.type === 'expense'
                  ? -Math.abs(pending.amount)
                  : Math.abs(pending.amount),
              icon:
                action.type === 'income'
                  ? 'arrow_downward'
                  : (category?.icon ?? 'payments'),
              iconColor: action.type === 'income' ? 'secondary' : 'white',
              categoryId: action.type === 'expense' ? category?.id : undefined,
              accountId: account.id,
              type: action.type,
            }),
          );
          return;
        }

        await dispatch(setPendingUpiImport(pending));
      } finally {
        handlingRef.current = false;
      }
    };

    let removeListener: (() => void) | undefined;

    void (async () => {
      const pendingMessages = await drainPendingUpiSms();
      for (const message of pendingMessages) {
        await processMessage(message);
      }

      const handle = await listenForUpiSms((message) => {
        void processMessage(message);
      });
      removeListener = () => {
        void handle.remove();
      };
    })();

    return () => {
      removeListener?.();
    };
  }, [hydrated, settings.smsAutoImport, settings.smsImportMode, dispatch]);
}
