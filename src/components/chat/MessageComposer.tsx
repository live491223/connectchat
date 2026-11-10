'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { VoiceRecorder } from './VoiceRecorder';
import { EmojiPicker } from './EmojiPicker';
import {
  Send,
  Paperclip,
  Mic,
  Smile,
  X,
  Image,
  FileText,
  Video,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MessageComposer() {
  const {
    sendMessage,
    editMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    sendTyping,
  } = useChat();

  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize text when editing message
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Typing indicator
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed && !isUploading) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, trimmed);
      setEditingMessage(null);
      setText('');
      return;
    }

    if (trimmed) {
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      await sendMessage({
        content: trimmed,
        type: 'TEXT',
        replyToId: replyingTo?.id,
      });
      setReplyingTo(null);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await sendMessage({
          type: data.type,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          replyToId: replyingTo?.id,
        });
        setReplyingTo(null);
      } else {
        alert(data.error || 'Failed to upload attachment');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  // Voice note send handler
  const handleSendVoice = async (file: File, duration: number) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await sendMessage({
          type: 'AUDIO',
          fileUrl: data.fileUrl,
          fileName: 'voice-note.webm',
          fileSize: data.fileSize,
          duration,
          replyToId: replyingTo?.id,
        });
      }
    } catch (e) {
      console.error('Failed to send voice note:', e);
    } finally {
      setIsUploading(false);
      setIsRecording(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  if (isRecording) {
    return (
      <div className="p-3 bg-card/80 border-t border-border">
        <VoiceRecorder
          onSendVoice={handleSendVoice}
          onCancel={() => setIsRecording(false)}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'p-3 border-t border-border bg-card/70 backdrop-blur-md relative select-none transition-colors',
        isDragging && 'bg-primary/10 border-primary border-dashed'
      )}
    >
      {/* Replying-to Bar */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-muted/80 rounded-xl text-xs border-l-4 border-primary animate-fade-in">
          <div className="truncate pr-2">
            <span className="font-semibold text-primary">Replying to {replyingTo.sender.name}: </span>
            <span className="text-muted-foreground truncate">{replyingTo.content || 'Media message'}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editing-message Bar */}
      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-amber-500/10 border-l-4 border-amber-500 rounded-xl text-xs text-amber-700 dark:text-amber-400 animate-fade-in">
          <div className="truncate pr-2">
            <span className="font-semibold">Editing message</span>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileUpload(files[0]);
            }
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
          title="Attach file or photo"
          aria-label="Attach file"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        {/* Input Wrapper */}
        <div className="flex-1 flex items-end bg-muted/60 focus-within:bg-background border border-transparent focus-within:border-primary/50 rounded-2xl px-3 py-1.5 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? 'Edit message...' : 'Type a message... (Enter to send)'}
            className="flex-1 max-h-32 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60 leading-relaxed py-1"
          />

          {/* Emoji Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors"
              title="Add emoji"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-10 right-0 z-50">
                <EmojiPicker
                  onSelect={(emoji) => {
                    setText((prev) => prev + emoji);
                    textareaRef.current?.focus();
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Button: Voice Record OR Send */}
        {text.trim() || editingMessage ? (
          <button
            onClick={handleSubmit}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-md transition-all transform active:scale-95"
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 fill-current" />
          </button>
        ) : (
          <button
            onClick={() => setIsRecording(true)}
            className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all transform active:scale-95"
            title="Record voice message"
            aria-label="Record voice message"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
