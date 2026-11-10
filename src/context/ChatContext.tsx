'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ConversationItem, MessageItemType, TypingIndicator, UserProfile } from '@/types';
import { useAuth } from './AuthContext';
import { useSocket } from '@/lib/socket';
import { soundEffects } from '@/lib/sound';

interface ChatContextType {
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  messages: MessageItemType[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: TypingIndicator[];
  activeMobileTab: 'chats' | 'contacts' | 'settings';
  isRightPanelOpen: boolean;
  isNewChatOpen: boolean;
  isSettingsOpen: boolean;
  replyingTo: MessageItemType | null;
  editingMessage: MessageItemType | null;
  searchFilter: string;
  inChatSearchQuery: string;
  inChatSearchResults: string[];
  activeSearchIndex: number;
  previewMedia: { url: string; type: 'IMAGE' | 'VIDEO'; name?: string } | null;

  // Actions
  setActiveConversationId: (id: string | null) => void;
  setActiveMobileTab: (tab: 'chats' | 'contacts' | 'settings') => void;
  toggleRightPanel: () => void;
  setIsRightPanelOpen: (open: boolean) => void;
  setIsNewChatOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setReplyingTo: (msg: MessageItemType | null) => void;
  setEditingMessage: (msg: MessageItemType | null) => void;
  setSearchFilter: (query: string) => void;
  setInChatSearchQuery: (query: string) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;
  setPreviewMedia: (media: { url: string; type: 'IMAGE' | 'VIDEO'; name?: string } | null) => void;

  sendMessage: (payload: {
    content?: string;
    type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    replyToId?: string;
  }) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  refreshConversations: () => Promise<void>;
  startDirectChat: (recipient: UserProfile) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket(user?.id);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItemType[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  // Navigation & panels
  const [activeMobileTab, setActiveMobileTab] = useState<'chats' | 'contacts' | 'settings'>('chats');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Message composer interactions
  const [replyingTo, setReplyingTo] = useState<MessageItemType | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageItemType | null>(null);

  // Search
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState<string>('');
  const [activeSearchIndex, setActiveSearchIndex] = useState<number>(0);

  // Full-screen media preview
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'IMAGE' | 'VIDEO'; name?: string } | null>(null);

  const activeConversationRef = useRef<string | null>(null);
  activeConversationRef.current = activeConversationId;

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !user) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    setIsLoadingMessages(true);

    fetch(`/api/conversations/${activeConversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data.messages) {
          setMessages(data.messages);
          // Mark conversation as read locally
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
          );
        }
      })
      .catch((e) => console.error('Error fetching messages:', e))
      .finally(() => {
        if (isSubscribed) setIsLoadingMessages(false);
      });

    // Join room on socket
    if (socket && socket.connected) {
      socket.emit('join_conversation', { conversationId: activeConversationId });
    }

    return () => {
      isSubscribed = false;
      if (socket && socket.connected) {
        socket.emit('leave_conversation', { conversationId: activeConversationId });
      }
    };
  }, [activeConversationId, user, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    const onNewMessage = (newMsg: MessageItemType) => {
      // If message is in active conversation
      if (activeConversationRef.current === newMsg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.senderId !== user.id) {
          soundEffects.playReceived();
          // Notify server of read receipt
          socket.emit('mark_read', {
            conversationId: newMsg.conversationId,
            userId: user.id,
            messageIds: [newMsg.id],
          });
        }
      } else {
        if (newMsg.senderId !== user.id) {
          soundEffects.playReceived();
        }
      }

      // Update conversations list (bump to top & update lastMessage)
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === newMsg.conversationId);
        if (index === -1) {
          // If conversation wasn't loaded yet, refetch all
          fetchConversations();
          return prev;
        }

        const currentConv = prev[index];
        const isCurrentActive = activeConversationRef.current === newMsg.conversationId;
        const updatedConv: ConversationItem = {
          ...currentConv,
          lastMessage: newMsg,
          updatedAt: new Date().toISOString(),
          unreadCount: isCurrentActive || newMsg.senderId === user.id ? 0 : (currentConv.unreadCount || 0) + 1,
        };

        const remaining = prev.filter((c) => c.id !== newMsg.conversationId);
        return [updatedConv, ...remaining];
      });
    };

    const onMessageEdited = (edited: MessageItemType) => {
      if (activeConversationRef.current === edited.conversationId) {
        setMessages((prev) => prev.map((m) => (m.id === edited.id ? edited : m)));
      }
    };

    const onMessageDeleted = ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      if (activeConversationRef.current === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: 'This message was deleted', fileUrl: null }
              : m
          )
        );
      }
    };

    const onReactionsUpdated = ({
      messageId,
      conversationId,
      reactions,
    }: {
      messageId: string;
      conversationId: string;
      reactions: any[];
    }) => {
      if (activeConversationRef.current === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        );
      }
    };

    const onMessagesRead = ({
      conversationId,
      messageIds,
    }: {
      conversationId: string;
      messageIds: string[];
    }) => {
      if (activeConversationRef.current === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (messageIds.includes(m.id)) {
              return {
                ...m,
                receipts: [
                  ...m.receipts.filter((r) => r.status !== 'READ'),
                  { id: `rcpt-${Date.now()}`, messageId: m.id, userId: 'other', status: 'READ', readAt: new Date() },
                ],
              };
            }
            return m;
          })
        );
      }
    };

    const onTypingStart = ({
      conversationId,
      userId,
      userName,
    }: {
      conversationId: string;
      userId: string;
      userName: string;
    }) => {
      if (activeConversationRef.current === conversationId && userId !== user.id) {
        setTypingUsers((prev) => {
          if (prev.some((t) => t.userId === userId)) return prev;
          return [...prev, { conversationId, userId, userName }];
        });
      }
    };

    const onTypingStop = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (activeConversationRef.current === conversationId) {
        setTypingUsers((prev) => prev.filter((t) => t.userId !== userId));
      }
    };

    const onUserStatusChanged = ({
      userId,
      isOnline,
      lastSeen,
    }: {
      userId: string;
      isOnline: boolean;
      lastSeen: string;
    }) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p.userId === userId
              ? {
                  ...p,
                  user: {
                    ...p.user,
                    isOnline,
                    lastSeen,
                  },
                }
              : p
          ),
        }))
      );
    };

    socket.on('new_message', onNewMessage);
    socket.on('message_edited', onMessageEdited);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('message_reactions_updated', onReactionsUpdated);
    socket.on('messages_read', onMessagesRead);
    socket.on('user_typing_start', onTypingStart);
    socket.on('user_typing_stop', onTypingStop);
    socket.on('user_status_changed', onUserStatusChanged);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('message_edited', onMessageEdited);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('message_reactions_updated', onReactionsUpdated);
      socket.off('messages_read', onMessagesRead);
      socket.off('user_typing_start', onTypingStart);
      socket.off('user_typing_stop', onTypingStop);
      socket.off('user_status_changed', onUserStatusChanged);
    };
  }, [socket, user, fetchConversations]);

  const setActiveConversationId = (id: string | null) => {
    setActiveConversationIdState(id);
    setTypingUsers([]);
    setReplyingTo(null);
    setEditingMessage(null);
    setInChatSearchQuery('');
  };

  const toggleRightPanel = () => {
    setIsRightPanelOpen((prev) => !prev);
  };

  // In-chat search matching
  const inChatSearchResults = inChatSearchQuery.trim()
    ? messages
        .filter((m) =>
          !m.isDeleted &&
          m.content.toLowerCase().includes(inChatSearchQuery.toLowerCase())
        )
        .map((m) => m.id)
    : [];

  const nextSearchResult = () => {
    if (inChatSearchResults.length === 0) return;
    setActiveSearchIndex((prev) => (prev + 1) % inChatSearchResults.length);
  };

  const prevSearchResult = () => {
    if (inChatSearchResults.length === 0) return;
    setActiveSearchIndex((prev) => (prev - 1 + inChatSearchResults.length) % inChatSearchResults.length);
  };

  // Actions
  const sendMessage = async (payload: {
    content?: string;
    type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    replyToId?: string;
  }) => {
    if (!activeConversationId || !user) return;

    soundEffects.playSent();

    const postData = {
      conversationId: activeConversationId,
      senderId: user.id,
      content: payload.content || '',
      type: payload.type || 'TEXT',
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      duration: payload.duration,
      replyToId: payload.replyToId,
    };

    if (socket && socket.connected) {
      socket.emit('send_message', postData);
    } else {
      await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
    }

    setReplyingTo(null);
    sendTyping(false);
  };

  const editMessage = async (messageId: string, content: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setEditingMessage(null);
      }
    } catch (e) {
      console.error('Error editing message:', e);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Error deleting message:', e);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    if (socket && socket.connected && activeConversationId) {
      socket.emit('toggle_reaction', {
        messageId,
        conversationId: activeConversationId,
        userId: user.id,
        emoji,
      });
    } else {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (!socket || !socket.connected || !activeConversationId || !user) return;
    if (isTyping) {
      socket.emit('typing_start', {
        conversationId: activeConversationId,
        userId: user.id,
        userName: user.name,
      });
    } else {
      socket.emit('typing_stop', {
        conversationId: activeConversationId,
        userId: user.id,
      });
    }
  };

  const startDirectChat = async (recipient: UserProfile): Promise<string> => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isGroup: false,
        recipientId: recipient.id,
      }),
    });
    const data = await res.json();
    await fetchConversations();
    const convId = data.conversation.id;
    setActiveConversationId(convId);
    setActiveMobileTab('chats');
    setIsNewChatOpen(false);
    return convId;
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        typingUsers,
        activeMobileTab,
        isRightPanelOpen,
        isNewChatOpen,
        isSettingsOpen,
        replyingTo,
        editingMessage,
        searchFilter,
        inChatSearchQuery,
        inChatSearchResults,
        activeSearchIndex,
        previewMedia,

        setActiveConversationId,
        setActiveMobileTab,
        toggleRightPanel,
        setIsRightPanelOpen,
        setIsNewChatOpen,
        setIsSettingsOpen,
        setReplyingTo,
        setEditingMessage,
        setSearchFilter,
        setInChatSearchQuery,
        nextSearchResult,
        prevSearchResult,
        setPreviewMedia,

        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        sendTyping,
        refreshConversations: fetchConversations,
        startDirectChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
