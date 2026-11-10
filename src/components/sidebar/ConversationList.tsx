'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatTime, cn } from '@/lib/utils';
import { Search, X, Users, MessageSquarePlus, Mic, Image, FileText, Video } from 'lucide-react';
import { ConversationItem } from '@/types';

export function ConversationList() {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversationId,
    typingUsers,
    setIsNewChatOpen,
    searchFilter,
    setSearchFilter,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups'>('all');

  // Filter conversations
  const filtered = conversations.filter((c) => {
    // Tab filter
    if (activeTab === 'unread' && (!c.unreadCount || c.unreadCount === 0)) return false;
    if (activeTab === 'groups' && !c.isGroup) return false;

    // Search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      if (c.isGroup) {
        return c.name?.toLowerCase().includes(q) || false;
      } else {
        const other = c.participants.find((p) => p.userId !== user?.id)?.user;
        return (
          other?.name.toLowerCase().includes(q) ||
          other?.username.toLowerCase().includes(q) ||
          false
        );
      }
    }
    return true;
  });

  const getConversationDetails = (c: ConversationItem) => {
    if (c.isGroup) {
      return {
        title: c.name || 'Group Chat',
        avatar: c.groupAvatar,
        isOnline: false,
        showStatus: false,
        subtitle: `${c.participants.length} members`,
      };
    }
    const other = c.participants.find((p) => p.userId !== user?.id)?.user;
    return {
      title: other?.name || 'User',
      avatar: other?.avatar,
      isOnline: other?.isOnline || false,
      showStatus: other?.showOnlineStatus !== false,
      subtitle: other?.username ? `@${other.username}` : '',
    };
  };

  const renderLastMessageSnippet = (c: ConversationItem) => {
    // Check if someone is typing
    const typing = typingUsers.find((t) => t.conversationId === c.id);
    if (typing) {
      return (
        <span className="text-primary font-medium flex items-center gap-1.5 animate-pulse">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-100" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-200" />
          </span>
          <span className="truncate">{c.isGroup ? `${typing.userName} is typing...` : 'typing...'}</span>
        </span>
      );
    }

    if (!c.lastMessage) {
      return <span className="text-muted-foreground/70 italic">No messages yet</span>;
    }

    const { type, content, isDeleted, senderId } = c.lastMessage;
    const isMe = senderId === user?.id;
    const prefix = isMe ? 'You: ' : '';

    if (isDeleted) {
      return <span className="text-muted-foreground/60 italic">{prefix}This message was deleted</span>;
    }

    if (type === 'IMAGE') {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Image className="w-3.5 h-3.5" />
          <span>{prefix}Photo</span>
        </span>
      );
    }

    if (type === 'AUDIO') {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Mic className="w-3.5 h-3.5 text-primary" />
          <span>{prefix}Voice message</span>
        </span>
      );
    }

    if (type === 'VIDEO') {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Video className="w-3.5 h-3.5" />
          <span>{prefix}Video</span>
        </span>
      );
    }

    if (type === 'DOCUMENT') {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <FileText className="w-3.5 h-3.5" />
          <span>{prefix}Document</span>
        </span>
      );
    }

    return (
      <span className="truncate text-muted-foreground">
        {prefix}{content}
      </span>
    );
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-card/40">
      {/* Search Bar */}
      <div className="p-3 border-b border-border/60">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-muted/60 hover:bg-muted/90 focus:bg-background border border-transparent focus:border-primary/50 text-sm focus:outline-none transition-all placeholder:text-muted-foreground/60"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-0.5">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1 text-xs rounded-full font-medium transition-colors',
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              'px-3 py-1 text-xs rounded-full font-medium transition-colors flex items-center gap-1',
              activeTab === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Unread
            {conversations.some((c) => (c.unreadCount || 0) > 0) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={cn(
              'px-3 py-1 text-xs rounded-full font-medium transition-colors flex items-center gap-1',
              activeTab === 'groups'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Users className="w-3 h-3" />
            Groups
          </button>
        </div>
      </div>

      {/* Conversations Scroll View */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-muted-foreground select-none">
            <MessageSquarePlus className="w-10 h-10 mb-3 text-muted-foreground/40 stroke-1" />
            <p className="text-sm font-medium">No conversations found</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
              {searchFilter ? 'Try adjusting your search filter' : 'Start a new chat with your team'}
            </p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const details = getConversationDetails(conv);
            const isSelected = activeConversation?.id === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  'flex items-center gap-3.5 p-3.5 cursor-pointer transition-colors relative group select-none',
                  isSelected
                    ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-primary pl-2.5'
                    : 'hover:bg-muted/50 border-l-4 border-transparent pl-2.5'
                )}
              >
                <Avatar
                  src={details.avatar}
                  name={details.title}
                  size="md"
                  isOnline={details.isOnline}
                  showStatus={details.showStatus}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm truncate pr-2 text-foreground">
                      {details.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="truncate pr-2">
                      {renderLastMessageSnippet(conv)}
                    </div>
                    {conv.unreadCount !== undefined && conv.unreadCount > 0 && (
                      <Badge count={conv.unreadCount} variant="primary" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
