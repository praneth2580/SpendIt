import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { registerNativeBackButton } from '../lib/capacitor';

export function useNativeBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    let listener: PluginListenerHandle | undefined;

    void registerNativeBackButton(({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
        return;
      }

      void App.exitApp();
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      void listener?.remove();
    };
  }, [navigate]);
}
