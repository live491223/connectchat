'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Info } from 'lucide-react';

export function PWAAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{
    enabled: boolean;
    text: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const res = await fetch('/api/settings/public');
        if (res.ok) {
          const data = await res.json();
          if (data.announcement_enabled && data.announcement_text) {
            setAnnouncement({
              enabled: true,
              text: data.announcement_text,
            });
          } else {
            setAnnouncement(null);
          }
        }
      } catch (e) {
        // Silent fail
      }
    }

    loadAnnouncement();
    // Poll settings every 30s
    const interval = setInterval(loadAnnouncement, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!announcement?.enabled || dismissed || !announcement.text) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md relative z-40 animate-fade-in">
      <div className="flex items-center gap-2 max-w-full overflow-hidden">
        <span className="p-1 rounded-full bg-white/20 shrink-0">
          <Bell className="w-3.5 h-3.5" />
        </span>
        <span className="truncate">{announcement.text}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-full hover:bg-white/20 transition-colors ml-2 shrink-0"
        title="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
