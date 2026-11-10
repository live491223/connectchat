'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { formatLastSeen, formatFileSize } from '@/lib/utils';
import {
  X,
  Bell,
  Shield,
  FileText,
  Image as ImageIcon,
  Users,
  LogOut,
  UserPlus,
} from 'lucide-react';

export function ContactInfoPanel() {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    toggleRightPanel,
    setPreviewMedia,
    startDirectChat,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'members'>('media');

  if (!activeConversation) return null;

  const isGroup = activeConversation.isGroup;
  const otherParticipant = !isGroup
    ? activeConversation.participants.find((p) => p.userId !== user?.id)?.user
    : null;

  const title = isGroup ? activeConversation.name || 'Group Chat' : otherParticipant?.name || 'User';
  const avatar = isGroup ? activeConversation.groupAvatar : otherParticipant?.avatar;
  const isOnline = !isGroup ? otherParticipant?.isOnline || false : false;
  const showStatus = !isGroup && otherParticipant?.showOnlineStatus !== false;

  // Extract shared media
  const sharedImages = messages.filter((m) => m.type === 'IMAGE' && m.fileUrl);
  const sharedDocs = messages.filter((m) => m.type === 'DOCUMENT' && m.fileUrl);

  return (
    <aside className="w-full h-full flex flex-col bg-card/60 backdrop-blur-md border-l border-border select-none overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="h-16 px-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {isGroup ? 'Group Information' : 'Contact Details'}
        </h3>
        <button
          onClick={toggleRightPanel}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Profile Info */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center text-center p-6 border-b border-border/60">
          <Avatar
            src={avatar}
            name={title}
            size="2xl"
            isOnline={isOnline}
            showStatus={showStatus}
            className="mb-3"
          />
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {!isGroup && otherParticipant?.username && (
            <p className="text-xs text-muted-foreground mb-1">@{otherParticipant.username}</p>
          )}
          <p className="text-xs text-primary font-medium mt-0.5">
            {isGroup
              ? `${activeConversation.participants.length} participants`
              : formatLastSeen(isOnline, otherParticipant?.lastSeen, showStatus)}
          </p>

          {/* Bio / Description */}
          {((isGroup && activeConversation.groupDescription) || (!isGroup && otherParticipant?.statusMessage)) && (
            <p className="text-xs text-muted-foreground mt-3 px-4 py-2 bg-muted/40 rounded-xl max-w-full">
              {isGroup ? activeConversation.groupDescription : otherParticipant?.statusMessage}
            </p>
          )}
        </div>

        {/* Tab switcher: Media, Docs, Members (if group) */}
        <div className="flex border-b border-border/60">
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'media'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Media ({sharedImages.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Files ({sharedDocs.length})
          </button>
          {isGroup && (
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Members
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-4">
          {activeTab === 'media' && (
            <div>
              {sharedImages.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted-foreground">No photos or videos shared yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {sharedImages.map((m) => (
                    <div
                      key={m.id}
                      onClick={() =>
                        setPreviewMedia({
                          url: m.fileUrl!,
                          type: 'IMAGE',
                          name: m.fileName || 'Photo',
                        })
                      }
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer bg-muted hover:opacity-90 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.fileUrl!}
                        alt="Shared"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              {sharedDocs.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted-foreground">No documents shared yet</p>
              ) : (
                sharedDocs.map((m) => (
                  <a
                    key={m.id}
                    href={m.fileUrl!}
                    download={m.fileName || 'file'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border/40"
                  >
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate">{m.fileName || 'Document'}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(m.fileSize)}</p>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {activeTab === 'members' && isGroup && (
            <div className="space-y-2">
              {activeConversation.participants.map((p) => {
                const isMe = p.userId === user?.id;
                const isAdmin = p.role === 'ADMIN';

                return (
                  <div
                    key={p.id}
                    onClick={() => !isMe && startDirectChat(p.user)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={p.user.avatar}
                        name={p.user.name}
                        size="sm"
                        isOnline={p.user.isOnline}
                        showStatus={p.user.showOnlineStatus}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">
                            {p.user.name} {isMe && '(You)'}
                          </span>
                          {isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {formatLastSeen(p.user.isOnline, p.user.lastSeen, p.user.showOnlineStatus)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
