import { useEffect, useRef } from 'react';
import type { UpiSmsMessage } from '../plugins/upi-sms';
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

      const pending = rawMessageToPending(message);
      if (!pending) return;

      const { processedSmsKeys, settings: liveSettings, categories, accounts } =
        store.getState().app;

      if (!liveSettings.smsAutoImport) return;
      if (processedSmsKeys.includes(pending.dedupeKey)) return;

      handlingRef.current = true;
      try {
        await dispatch(markSmsProcessed(pending.dedupeKey));

        if (liveSettings.smsImportMode === 'auto') {
          const category = categories[0];
          const account = accounts[0];
          if (!account || (pending.type === 'expense' && !category)) {
            await dispatch(setPendingUpiImport(pending));
            return;
          }

          await dispatch(
            addTransaction({
              merchant: pending.merchant,
              amount:
                pending.type === 'expense'
                  ? -Math.abs(pending.amount)
                  : Math.abs(pending.amount),
              icon:
                pending.type === 'income'
                  ? 'arrow_downward'
                  : (category?.icon ?? 'payments'),
              iconColor: pending.type === 'income' ? 'secondary' : 'white',
              categoryId: pending.type === 'expense' ? category?.id : undefined,
              accountId: account.id,
              type: pending.type,
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
