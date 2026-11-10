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

export function DesktopLayout() {
  const { activeConversation, isRightPanelOpen } = useChat();

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Panel 1: Left Sidebar (360px) */}
      <aside className="w-[360px] h-full flex flex-col border-r border-border flex-shrink-0 z-10">
        <SidebarHeader />
        <ConversationList />
      </aside>

      {/* Panel 2: Center Chat Area */}
      <main className="flex-1 h-full flex flex-col min-w-0 relative">
        {activeConversation ? (
          <>
            <ChatHeader />
            <MessageList />
            <MessageComposer />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
              <MessageSquare className="w-10 h-10 stroke-1" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Welcome to ConnectChat</h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Select a conversation from the sidebar or click the + button to start messaging your team.
            </p>
          </div>
        )}
      </main>

      {/* Panel 3: Right Contact / Group Info Panel (340px) */}
      {activeConversation && isRightPanelOpen && (
        <aside className="w-[340px] h-full flex-shrink-0 z-10">
          <ContactInfoPanel />
        </aside>
      )}
    </div>
  );
}
