export type ThemeMode = 'dark' | 'light' | 'system';

const THEME_CACHE_KEY = 'spendt-theme';

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
  localStorage.setItem(THEME_CACHE_KEY, mode);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#09090b' : '#f4f4f5');
  }
}

export function initThemeFromCache() {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY) as ThemeMode | null;
    if (cached) {
      applyTheme(cached);
      return;
    }
  } catch {
    // ignore
  }
  document.documentElement.classList.add('dark');
}
