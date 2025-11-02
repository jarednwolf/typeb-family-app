'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_SW !== 'true') return undefined;
    if ('serviceWorker' in navigator) {
      let reloaded = false;
      const onControllerChange = () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          try { reg.update(); } catch {}
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                // If there's an existing controller, a new SW is waiting. Ask it to activate immediately.
                if (navigator.serviceWorker.controller && reg.waiting) {
                  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          });
        })
        .catch(() => { /* noop */ });

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };
    }
    return undefined;
  }, []);
  return null;
}


