'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useChat } from '@/context/ChatContext';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { formatLastSeen } from '@/lib/utils';

export function ContactsView() {
  const { startDirectChat } = useChat();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/users?q=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [search]);

  return (
    <div className="flex flex-col h-full bg-card/40 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold mb-3">Contacts & Team</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/60 border border-transparent focus:border-primary/50 text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/20 p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground">No contacts found</p>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              onClick={() => startDirectChat(u)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={u.avatar}
                  name={u.name}
                  size="md"
                  isOnline={u.isOnline}
                  showStatus={u.showOnlineStatus}
                />
                <div>
                  <h4 className="text-sm font-semibold">{u.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {formatLastSeen(u.isOnline, u.lastSeen, u.showOnlineStatus)}
                  </p>
                  {u.statusMessage && (
                    <p className="text-xs text-muted-foreground/80 truncate max-w-[200px] mt-0.5">
                      {u.statusMessage}
                    </p>
                  )}
                </div>
              </div>

              <button
                className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Message"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
