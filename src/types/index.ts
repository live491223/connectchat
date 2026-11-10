export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  statusMessage: string | null;
  isOnline: boolean;
  lastSeen: string | Date;
  showOnlineStatus: boolean;
  readReceipts: boolean;
  theme: 'light' | 'dark' | 'system';
  createdAt?: string | Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  unreadCount: number;
  lastReadAt?: string | Date | null;
  joinedAt: string | Date;
  user: UserProfile;
}

export interface ReactionItem {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
  };
}

export interface MessageReceiptItem {
  id: string;
  messageId: string;
  userId: string;
  status: 'DELIVERED' | 'READ';
  readAt?: string | Date | null;
}

export interface MessageItemType {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM';
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  duration?: number | null;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    type: string;
    sender: {
      id: string;
      name: string;
    };
  } | null;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  reactions: ReactionItem[];
  receipts: MessageReceiptItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ConversationItem {
  id: string;
  name: string | null;
  isGroup: boolean;
  groupAvatar: string | null;
  groupDescription: string | null;
  adminId: string | null;
  participants: ConversationParticipant[];
  messages: MessageItemType[];
  unreadCount?: number;
  lastMessage?: MessageItemType | null;
  updatedAt: string | Date;
  createdAt: string | Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
}
