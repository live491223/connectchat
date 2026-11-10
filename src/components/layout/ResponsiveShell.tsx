'use client';

import React, { useState, useEffect } from 'react';
import { MobileLayout } from './MobileLayout';
import { TabletLayout } from './TabletLayout';
import { DesktopLayout } from './DesktopLayout';
import { NewChatModal } from '@/components/sidebar/NewChatModal';
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { PWAUpdateBanner } from '@/components/pwa/PWAUpdateBanner';
import { Modal } from '@/components/ui/Modal';
import { SettingsView } from '@/components/settings/SettingsView';
import { useChat } from '@/context/ChatContext';

export function ResponsiveShell() {
  const { isSettingsOpen, setIsSettingsOpen } = useChat();
  const [viewportWidth, setViewportWidth] = useState<number>(1200);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const updateSize = () => {
      setViewportWidth(window.innerWidth);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  return (
    <div className="h-full w-full overflow-hidden bg-background">
      {/* Breakpoint layout */}
      {isMobile ? (
        <MobileLayout />
      ) : isTablet ? (
        <TabletLayout />
      ) : (
        <DesktopLayout />
      )}

      {/* Global Shared Modals */}
      <NewChatModal />
      <MediaPreviewModal />
      <PWAInstallPrompt />
      <PWAUpdateBanner />

      {/* Settings Modal (for Desktop and Tablet) */}
      {!isMobile && isSettingsOpen && (
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          maxWidth="lg"
        >
          <SettingsView onClose={() => setIsSettingsOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
