'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { MessageItem } from './MessageItem';
import { formatMessageDate } from '@/lib/utils';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export function MessageList() {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    typingUsers,
    inChatSearchQuery,
    isLoadingMessages,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll on initial load and when new messages arrive
  useEffect(() => {
    if (scrollRef.current && !showScrollBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showScrollBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  if (!activeConversation) return null;

  // Group messages by date
  let lastDateStr = '';

  const typingInThisChat = typingUsers.filter(
    (t) => t.conversationId === activeConversation.id && t.userId !== user?.id
  );

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 relative"
    >
      {isLoadingMessages ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading message history...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base mb-1">No messages yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Send a message, share a photo, or drop a voice note to start the conversation!
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const dateStr = formatMessageDate(message.createdAt);
          const showDateDivider = dateStr !== lastDateStr;
          if (showDateDivider) {
            lastDateStr = dateStr;
          }

          const isHighlighted = inChatSearchQuery
            ? message.content.toLowerCase().includes(inChatSearchQuery.toLowerCase())
            : false;

          return (
            <React.Fragment key={message.id}>
              {showDateDivider && (
                <div className="flex justify-center my-4 select-none">
                  <span className="px-3 py-1 rounded-full bg-muted/80 backdrop-blur-xs text-[11px] font-semibold text-muted-foreground border border-border/40 shadow-xs">
                    {dateStr}
                  </span>
                </div>
              )}
              <MessageItem
                message={message}
                isGroup={activeConversation.isGroup}
                isHighlighted={isHighlighted}
              />
            </React.Fragment>
          );
        })
      )}

      {/* Typing indicators */}
      {typingInThisChat.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground animate-fade-in select-none">
          <Avatar
            name={typingInThisChat[0].userName}
            size="xs"
            className="opacity-70"
          />
          <div className="flex items-center gap-1 bg-muted/60 px-3 py-1.5 rounded-full border border-border/50">
            <span className="italic">
              {typingInThisChat.map((t) => t.userName).join(', ')}{' '}
              {typingInThisChat.length === 1 ? 'is' : 'are'} typing
            </span>
            <span className="flex gap-1 ml-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
            </span>
          </div>
        </div>
      )}

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 sm:right-8 z-30 p-2.5 rounded-full bg-primary text-primary-foreground shadow-xl hover:opacity-90 transition-all transform active:scale-95 flex items-center justify-center animate-fade-in"
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
