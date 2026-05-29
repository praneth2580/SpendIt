import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PluginListenerHandle } from '@capacitor/core';
import { isNative, registerNativeBackButton } from '../lib/capacitor';

export function useNativeBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative) return;

    let listener: PluginListenerHandle | undefined;

    void registerNativeBackButton(({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
        return;
      }

      void import('@capacitor/app').then(({ App }) => App.exitApp());
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      void listener?.remove();
    };
  }, [navigate]);
}
