'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { MessageSquare, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const { activeMobileTab, setActiveMobileTab, conversations, setActiveConversationId } = useChat();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleTabClick = (tab: 'chats' | 'contacts' | 'settings') => {
    setActiveMobileTab(tab);
    if (tab === 'chats') {
      // Clear active conversation if in mobile list view
    }
  };

  return (
    <nav className="md:hidden border-t border-border bg-card/90 backdrop-blur-lg flex items-center justify-around py-2 px-4 safe-bottom select-none z-30">
      {/* Chats Tab */}
      <button
        onClick={() => handleTabClick('chats')}
        className={cn(
          'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all relative',
          activeMobileTab === 'chats'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
        <span className="text-[11px]">Chats</span>
      </button>

      {/* Contacts Tab */}
      <button
        onClick={() => handleTabClick('contacts')}
        className={cn(
          'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all',
          activeMobileTab === 'contacts'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Users className="w-5 h-5" />
        <span className="text-[11px]">Contacts</span>
      </button>

      {/* Settings Tab */}
      <button
        onClick={() => handleTabClick('settings')}
        className={cn(
          'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all',
          activeMobileTab === 'settings'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[11px]">Settings</span>
      </button>
    </nav>
  );
}
