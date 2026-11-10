'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/ui/Avatar';
import { Plus, Settings, Moon, Sun, Monitor, LogOut } from 'lucide-react';

export function SidebarHeader() {
  const { user, logout } = useAuth();
  const { setIsNewChatOpen, setIsSettingsOpen } = useChat();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="p-4 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between select-none">
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setIsSettingsOpen(true)}
      >
        <Avatar
          src={user?.avatar}
          name={user?.name || 'User'}
          size="md"
          isOnline={user?.isOnline}
          showStatus
        />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {user?.name || 'Guest'}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[130px]">
            {user?.statusMessage || 'Available'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title={`Theme: ${theme}`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Moon className="w-5 h-5 text-indigo-400" />
          ) : theme === 'light' ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Monitor className="w-5 h-5 text-blue-400" />
          )}
        </button>

        {/* New Conversation Button */}
        <button
          onClick={() => setIsNewChatOpen(true)}
          className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all transform active:scale-95"
          title="New Chat or Group"
          aria-label="New chat or group"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Settings & Profile"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
