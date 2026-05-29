import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import AppBootstrap from './AppBootstrap.tsx';
import { initPwa, unregisterDevServiceWorkers } from './lib/pwa';
import { initThemeFromCache } from './lib/theme';
import { store } from './store';

initThemeFromCache();

function mountApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <AppBootstrap />
      </Provider>
    </StrictMode>,
  );
}

void unregisterDevServiceWorkers().finally(() => {
  initPwa();
  mountApp();
});
