'use client';

import React, { useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { X, Download } from 'lucide-react';

export function MediaPreviewModal() {
  const { previewMedia, setPreviewMedia } = useChat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewMedia) {
        setPreviewMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMedia, setPreviewMedia]);

  if (!previewMedia) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in select-none">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-sm font-medium truncate max-w-xs sm:max-w-md">
          {previewMedia.name || 'Media Preview'}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={previewMedia.url}
            download={previewMedia.name || 'download'}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Download file"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={() => setPreviewMedia(null)}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {previewMedia.type === 'IMAGE' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewMedia.url}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        ) : (
          <video
            src={previewMedia.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
