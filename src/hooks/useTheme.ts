import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateSettings } from '../store/appSlice';
import { applyTheme, type ThemeMode } from '../lib/theme';

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.app.settings.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    void dispatch(updateSettings({ theme: mode }));
  };

  return { theme, setTheme };
}
