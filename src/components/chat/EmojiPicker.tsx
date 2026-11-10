'use client';

import React, { useState } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_CATEGORIES = {
  Quick: ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'],
  Smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '😎', '🥳', '😏', '🧐', '🤓'],
  Gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '👋', '🤝', '🙏', '💪', '👏', '🙌'],
  Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  Fun: ['🔥', '✨', '🌟', '💥', '🚀', '🎉', '🎊', '🎁', '🏆', '💯', '⚡', '☕', '🍕', '🍻', '🎈', '🎯'],
};

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Quick');

  return (
    <div className="w-72 bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-3 z-50 animate-fade-in select-none">
      {/* Category selector */}
      <div className="flex border-b border-border/60 pb-2 mb-2 gap-1 overflow-x-auto">
        {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of emojis */}
      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-1">
        {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              if (onClose) onClose();
            }}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-muted/80 transition-transform active:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
