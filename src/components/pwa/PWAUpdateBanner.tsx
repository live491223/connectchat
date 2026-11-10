'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // If an update is already waiting
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowReload(true);
        }

        // On updatefound
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowReload(true);
              }
            });
          }
        });
      }).catch((err) => console.log('SW registration error:', err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showReload) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in select-none">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-2xl border border-white/20 text-xs font-semibold">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>A new version of ConnectChat is available!</span>
        <button
          onClick={handleUpdate}
          className="ml-2 px-3 py-1 rounded-full bg-white text-primary hover:bg-white/90 shadow-xs"
        >
          Update Now
        </button>
        <button
          onClick={() => setShowReload(false)}
          className="p-1 rounded-full hover:bg-white/20"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
