'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { formatLastSeen } from '@/lib/utils';
import {
  ChevronLeft,
  Search,
  Info,
  Phone,
  Video,
  MoreVertical,
  Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export function ChatHeader() {
  const { user } = useAuth();
  const {
    activeConversation,
    setActiveConversationId,
    toggleRightPanel,
    isRightPanelOpen,
    inChatSearchQuery,
    setInChatSearchQuery,
  } = useChat();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [callModal, setCallModal] = useState<{ type: 'voice' | 'video'; name: string } | null>(null);

  if (!activeConversation) return null;

  const isGroup = activeConversation.isGroup;
  const otherParticipant = !isGroup
    ? activeConversation.participants.find((p) => p.userId !== user?.id)?.user
    : null;

  const title = isGroup ? activeConversation.name || 'Group Chat' : otherParticipant?.name || 'User';
  const avatar = isGroup ? activeConversation.groupAvatar : otherParticipant?.avatar;
  const isOnline = !isGroup ? otherParticipant?.isOnline || false : false;
  const showStatus = !isGroup && otherParticipant?.showOnlineStatus !== false;

  const subtitle = isGroup
    ? `${activeConversation.participants.length} members`
    : formatLastSeen(isOnline, otherParticipant?.lastSeen, showStatus);

  const handleStartCall = (type: 'voice' | 'video') => {
    setCallModal({ type, name: title });
  };

  return (
    <>
      <header className="h-16 px-4 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between select-none z-20">
        {/* Left: Mobile Back Button & Chat Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setActiveConversationId(null)}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            aria-label="Back to conversations"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer group min-w-0"
            onClick={toggleRightPanel}
          >
            <Avatar
              src={avatar}
              name={title}
              size="md"
              isOnline={isOnline}
              showStatus={showStatus}
            />
            <div className="flex flex-col min-w-0">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {isOnline ? (
                  <span className="text-emerald-500 font-medium">Online</span>
                ) : (
                  subtitle
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Audio Call */}
          <button
            onClick={() => handleStartCall('voice')}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => handleStartCall('video')}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Search inside Chat */}
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors ${
              isSearchOpen || inChatSearchQuery
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Search in conversation (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Info Panel Toggle */}
          <button
            onClick={toggleRightPanel}
            className={`p-2 rounded-xl transition-colors ${
              isRightPanelOpen
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Details & Media"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Slide-down In-Chat Search Bar */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-border bg-card/90 backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            autoFocus
            placeholder="Search within this chat..."
            value={inChatSearchQuery}
            onChange={(e) => setInChatSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground/60"
          />
          {inChatSearchQuery && (
            <button
              onClick={() => setInChatSearchQuery('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setInChatSearchQuery('');
            }}
            className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 font-medium"
          >
            Done
          </button>
        </div>
      )}

      {/* Simulated Call Modal */}
      {callModal && (
        <Modal
          isOpen={true}
          onClose={() => setCallModal(null)}
          title={callModal.type === 'video' ? 'Video Call' : 'Voice Call'}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Avatar name={callModal.name} size="2xl" className="mb-4" />
            <h3 className="text-lg font-bold">{callModal.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 animate-pulse">
              Connecting secure WebRTC call...
            </p>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => setCallModal(null)}
                className="px-6 py-2.5 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm hover:opacity-90"
              >
                End Call
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
