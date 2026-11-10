'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { ContactInfoPanel } from '@/components/rightpanel/ContactInfoPanel';
import { MessageSquare } from 'lucide-react';

export function TabletLayout() {
  const { activeConversation, isRightPanelOpen, toggleRightPanel } = useChat();

  return (
    <div className="flex h-full w-full overflow-hidden bg-background relative">
      {/* Sidebar (320px) */}
      <aside className="w-[320px] h-full flex flex-col border-r border-border flex-shrink-0 z-10">
        <SidebarHeader />
        <ConversationList />
      </aside>

      {/* Chat Area */}
      <main className="flex-1 h-full flex flex-col min-w-0 relative">
        {activeConversation ? (
          <>
            <ChatHeader />
            <MessageList />
            <MessageComposer />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
              <MessageSquare className="w-8 h-8 stroke-1" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">ConnectChat Tablet</h2>
            <p className="text-xs text-muted-foreground max-w-xs">
              Select a conversation from the sidebar to start chatting.
            </p>
          </div>
        )}
      </main>

      {/* Slide-over Drawer for Right Panel on Tablet */}
      {activeConversation && isRightPanelOpen && (
        <div className="absolute inset-0 z-40 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={toggleRightPanel}
          />
          <div className="relative w-[340px] h-full bg-card shadow-2xl z-50">
            <ContactInfoPanel />
          </div>
        </div>
      )}
    </div>
  );
}
