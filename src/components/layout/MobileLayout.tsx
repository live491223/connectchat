'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { ContactsView } from '@/components/sidebar/ContactsView';
import { BottomNavigation } from '@/components/sidebar/BottomNavigation';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { ContactInfoPanel } from '@/components/rightpanel/ContactInfoPanel';
import { SettingsView } from '@/components/settings/SettingsView';

export function MobileLayout() {
  const {
    activeConversation,
    activeMobileTab,
    isRightPanelOpen,
    toggleRightPanel,
  } = useChat();

  // If in an active conversation, show the full-screen chat view
  if (activeConversation) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-background relative safe-top safe-bottom">
        <ChatHeader />
        <MessageList />
        <MessageComposer />

        {/* Full-screen drawer for Contact Info on mobile */}
        {isRightPanelOpen && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-in-right safe-top safe-bottom">
            <ContactInfoPanel />
          </div>
        )}
      </div>
    );
  }

  // Otherwise, show the list view with BottomNavigation
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background relative safe-top">
      {/* Top Header if on Chats tab */}
      {activeMobileTab === 'chats' && <SidebarHeader />}

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeMobileTab === 'chats' && <ConversationList />}
        {activeMobileTab === 'contacts' && <ContactsView />}
        {activeMobileTab === 'settings' && <SettingsView />}
      </div>

      {/* Bottom Nav */}
      <BottomNavigation />
    </div>
  );
}
