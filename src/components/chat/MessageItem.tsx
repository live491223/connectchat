'use client';

import React, { useState } from 'react';
import { MessageItemType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Avatar } from '@/components/ui/Avatar';
import { VoicePlayer } from './VoicePlayer';
import { EmojiPicker } from './EmojiPicker';
import { formatTime, formatFileSize, cn } from '@/lib/utils';
import {
  Check,
  CheckCheck,
  Reply,
  Edit2,
  Trash2,
  Smile,
  FileText,
  Download,
  Ban,
} from 'lucide-react';

interface MessageItemProps {
  message: MessageItemType;
  isGroup?: boolean;
  isHighlighted?: boolean;
}

export function MessageItem({ message, isGroup = false, isHighlighted = false }: MessageItemProps) {
  const { user } = useAuth();
  const {
    setReplyingTo,
    setEditingMessage,
    deleteMessage,
    toggleReaction,
    setPreviewMedia,
  } = useChat();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isMe = message.senderId === user?.id;
  const isSystem = message.type === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 rounded-full bg-muted/60 text-muted-foreground text-xs font-medium border border-border/40 select-none">
          {message.content}
        </span>
      </div>
    );
  }

  // Read receipt status
  const isRead = message.receipts?.some((r) => r.status === 'READ');
  const isDelivered = message.receipts?.some((r) => r.status === 'DELIVERED');

  // Group reactions by emoji: { [emoji]: count, hasReacted: boolean }
  const reactionCounts: { [emoji: string]: { count: number; hasReacted: boolean } } = {};
  message.reactions?.forEach((r) => {
    if (!reactionCounts[r.emoji]) {
      reactionCounts[r.emoji] = { count: 0, hasReacted: false };
    }
    reactionCounts[r.emoji].count += 1;
    if (r.userId === user?.id) {
      reactionCounts[r.emoji].hasReacted = true;
    }
  });

  const handleReply = () => {
    setReplyingTo(message);
  };

  const handleEdit = () => {
    setEditingMessage(message);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message.id);
    }
  };

  const quickEmojis = ['👍', '❤️', '😂', '🔥'];

  return (
    <div
      id={`msg-${message.id}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
      className={cn(
        'group relative flex flex-col my-1.5 px-3 transition-colors',
        isMe ? 'items-end' : 'items-start',
        isHighlighted && 'bg-primary/10 rounded-xl py-1'
      )}
    >
      <div className={cn('flex items-end gap-2 max-w-[85%] sm:max-w-[70%]', isMe ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar for other participants in group chats */}
        {!isMe && isGroup && (
          <Avatar
            src={message.sender.avatar}
            name={message.sender.name}
            size="sm"
            className="mb-1"
          />
        )}

        {/* Message Bubble Container */}
        <div className="relative flex flex-col">
          {/* Group sender name */}
          {!isMe && isGroup && (
            <span className="text-[11px] font-semibold text-primary ml-1 mb-0.5">
              {message.sender.name}
            </span>
          )}

          {/* Quoted Reply Box */}
          {message.replyTo && (
            <div
              className={cn(
                'mb-1 px-3 py-1.5 rounded-xl text-xs border-l-4 cursor-pointer select-none transition-opacity hover:opacity-90',
                isMe
                  ? 'bg-primary-foreground/10 text-primary-foreground border-primary-foreground/50'
                  : 'bg-muted border-primary text-muted-foreground'
              )}
              onClick={() => {
                const el = document.getElementById(`msg-${message.replyTo?.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              <p className="font-semibold">{message.replyTo.sender.name}</p>
              <p className="truncate opacity-80 max-w-[200px]">
                {message.replyTo.type === 'IMAGE' ? '📷 Photo' : message.replyTo.type === 'AUDIO' ? '🎤 Voice message' : message.replyTo.content}
              </p>
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(
              'relative rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all',
              isMe
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                : 'bg-card text-card-foreground border border-border/60 rounded-bl-xs',
              message.isDeleted && 'opacity-70 italic'
            )}
          >
            {message.isDeleted ? (
              <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400">
                <Ban className="w-4 h-4" />
                <span>This message was deleted</span>
              </div>
            ) : (
              <>
                {/* Image Attachment */}
                {message.type === 'IMAGE' && message.fileUrl && (
                  <div
                    className="mb-2 rounded-xl overflow-hidden cursor-pointer max-w-sm max-h-72 select-none group/img"
                    onClick={() =>
                      setPreviewMedia({
                        url: message.fileUrl!,
                        type: 'IMAGE',
                        name: message.fileName || 'Image',
                      })
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.fileUrl}
                      alt={message.fileName || 'Photo'}
                      className="w-full h-full object-cover rounded-xl transition-transform group-hover/img:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Video Attachment */}
                {message.type === 'VIDEO' && message.fileUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden max-w-sm">
                    <video
                      src={message.fileUrl}
                      controls
                      playsInline
                      className="w-full rounded-xl max-h-64 bg-black"
                    />
                  </div>
                )}

                {/* Audio Voice Note */}
                {message.type === 'AUDIO' && message.fileUrl && (
                  <VoicePlayer
                    url={message.fileUrl}
                    duration={message.duration}
                    isMe={isMe}
                  />
                )}

                {/* Document Attachment */}
                {message.type === 'DOCUMENT' && message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    download={message.fileName || 'document'}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-xl mb-1.5 transition-colors border',
                      isMe
                        ? 'bg-white/10 border-white/20 hover:bg-white/20'
                        : 'bg-muted/70 border-border hover:bg-muted'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate">{message.fileName || 'Document'}</p>
                      <p className="text-[10px] opacity-75">{formatFileSize(message.fileSize)}</p>
                    </div>
                    <Download className="w-4 h-4 opacity-75 flex-shrink-0" />
                  </a>
                )}

                {/* Text Content */}
                {message.content && (
                  <p className="whitespace-pre-wrap break-words leading-relaxed select-text">
                    {message.content}
                  </p>
                )}

                {/* Metadata Row: Timestamp, edited flag, read receipts */}
                <div
                  className={cn(
                    'flex items-center justify-end gap-1 text-[10px] mt-1 select-none',
                    isMe ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  {message.isEdited && <span className="opacity-75">(edited)</span>}
                  <span>{formatTime(message.createdAt)}</span>

                  {isMe && (
                    <span className="ml-0.5">
                      {isRead ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-200 fill-current" />
                      ) : isDelivered ? (
                        <CheckCheck className="w-3.5 h-3.5 text-white/90" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-white/70" />
                      )}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Reactions Pill Row */}
          {Object.keys(reactionCounts).length > 0 && (
            <div
              className={cn(
                'flex flex-wrap items-center gap-1 mt-1 z-10',
                isMe ? 'justify-end' : 'justify-start'
              )}
            >
              {Object.entries(reactionCounts).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(message.id, emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-transform active:scale-110',
                    data.hasReacted
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-card border-border/80 text-foreground hover:bg-muted'
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-[11px]">{data.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover / Long-press Action Bar */}
        {showActions && !message.isDeleted && (
          <div
            className={cn(
              'flex items-center gap-0.5 p-1 rounded-2xl bg-card/95 border border-border shadow-lg backdrop-blur-md transition-all select-none animate-fade-in z-20',
              isMe ? 'order-first mr-1' : 'ml-1'
            )}
          >
            {/* Quick emoji reactions */}
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(message.id, emoji)}
                className="w-7 h-7 flex items-center justify-center text-sm rounded-xl hover:bg-muted transition-transform active:scale-125"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}

            {/* Custom Emoji Picker Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                title="More reactions"
              >
                <Smile className="w-4 h-4" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-9 left-0 z-50">
                  <EmojiPicker
                    onSelect={(emoji) => toggleReaction(message.id, emoji)}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button
              onClick={handleReply}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Reply"
            >
              <Reply className="w-4 h-4" />
            </button>

            {/* Edit (only sender) */}
            {isMe && message.type === 'TEXT' && (
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Edit message"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {/* Delete (only sender) */}
            {isMe && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Delete message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
