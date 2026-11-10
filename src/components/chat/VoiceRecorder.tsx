'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface VoiceRecorderProps {
  onSendVoice: (file: File, duration: number) => Promise<void>;
  onCancel: () => void;
}

export function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200); // 200ms slices
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert('Microphone access was denied. Please allow microphone permissions to send voice messages.');
      onCancel();
    }
  };

  const handleCancel = () => {
    cleanup();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    onCancel();
  };

  const handleSend = async () => {
    if (!mediaRecorderRef.current || isUploading) return;

    setIsUploading(true);
    cleanup();

    const mediaRecorder = mediaRecorderRef.current;

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      try {
        await onSendVoice(audioFile, duration);
      } catch (e) {
        console.error('Failed to send voice note:', e);
      } finally {
        setIsUploading(false);
      }
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-card rounded-2xl border border-primary/30 shadow-lg animate-fade-in">
      <div className="flex items-center gap-3">
        {/* Pulsing red mic recording indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm font-semibold text-red-500 font-mono">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Live soundwave animation */}
        <div className="flex items-center gap-1 h-5 px-2">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="w-1 bg-primary/70 rounded-full animate-pulse"
              style={{
                height: `${Math.max(20, (Math.sin(i + duration * 2) + 1) * 50)}%`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          disabled={isUploading}
          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Cancel recording"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {/* Send Voice Note Button */}
        <button
          onClick={handleSend}
          disabled={isUploading}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-md transition-all transform active:scale-95 flex items-center justify-center"
          title="Send voice note"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
