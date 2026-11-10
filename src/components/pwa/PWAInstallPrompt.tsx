'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // If dismissed recently, respect choice
    const dismissedAt = localStorage.getItem('connectchat_pwa_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000) {
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If iOS and not standalone, show iOS guidance after 4 seconds
    if (isAppleDevice && !isRunningStandalone && !dismissedAt) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('connectchat_pwa_dismissed', String(Date.now()));
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-in-right">
      <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Install ConnectChat</h4>
              <p className="text-xs text-muted-foreground">Universal Messenger on your device</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-xl space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <span>Install on iPhone / iPad:</span>
            </p>
            <p className="flex items-center gap-1.5">
              1. Tap the <Share className="w-3.5 h-3.5 text-primary inline" /> <strong>Share</strong> button in Safari toolbar.
            </p>
            <p className="flex items-center gap-1.5">
              2. Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-primary inline" /> <strong>Add to Home Screen</strong>.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Install as a standalone Progressive Web App for offline access, instant notifications, and fullscreen performance.
          </p>
        )}

        {!isIOS && deferredPrompt && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-sm"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
