'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) {
          navigator.serviceWorker
            .register('/service-worker.js')
            .catch(() => {/* noop */});
        }
      });
    }
  }, []);
  return null;
}


