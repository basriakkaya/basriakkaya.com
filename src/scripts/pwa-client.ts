/// <reference types="vite-plugin-pwa/vanillajs" />

import { registerSW } from 'virtual:pwa-register';

declare global {
  interface Window { __basriPwaInitialized?: boolean }
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.__basriPwaInitialized) {
  window.__basriPwaInitialized = true;
  const panel = document.querySelector<HTMLElement>('[data-pwa-update]');
  const updateButton = panel?.querySelector<HTMLButtonElement>('[data-pwa-update-now]');
  const laterButton = panel?.querySelector<HTMLButtonElement>('[data-pwa-update-later]');
  let updateRequested = false;

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (!panel || panel.dataset.dismissed === 'true') return;
      panel.hidden = false;
    },
    onOfflineReady() {
      document.documentElement.dataset.offlineReady = 'true';
    },
    onRegisteredSW(_swScriptUrl, registration) {
      if (registration) document.documentElement.dataset.pwaRegistered = 'true';
    },
    onRegisterError(error: unknown) {
      console.error('Service Worker kaydı başarısız oldu.', error);
    },
  });

  updateButton?.addEventListener('click', () => {
    if (updateRequested) return;
    updateRequested = true;
    updateButton.disabled = true;
    void updateServiceWorker(true);
  });

  laterButton?.addEventListener('click', () => {
    if (!panel) return;
    panel.dataset.dismissed = 'true';
    panel.hidden = true;
  });
}

export {};
