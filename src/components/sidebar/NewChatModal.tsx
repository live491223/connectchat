'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Search, UserPlus, Users, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NewChatModal() {
  const { user } = useAuth();
  const { isNewChatOpen, setIsNewChatOpen, startDirectChat, refreshConversations, setActiveConversationId } = useChat();

  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isNewChatOpen) {
      setSearch('');
      setSelectedUserIds([]);
      setGroupName('');
      setGroupDescription('');
      return;
    }

    setIsLoading(true);
    fetch(`/api/users?q=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch((e) => console.error('Error fetching users:', e))
      .finally(() => setIsLoading(false));
  }, [isNewChatOpen, search]);

  const handleStartDirect = async (targetUser: UserProfile) => {
    try {
      setIsSubmitting(true);
      await startDirectChat(targetUser);
      setIsNewChatOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGroup: true,
          name: groupName.trim(),
          groupDescription: groupDescription.trim() || null,
          participantIds: selectedUserIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.conversation) {
        await refreshConversations();
        setActiveConversationId(data.conversation.id);
        setIsNewChatOpen(false);
      }
    } catch (e) {
      console.error('Failed to create group:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isNewChatOpen}
      onClose={() => setIsNewChatOpen(false)}
      title="Start Conversation"
      description="Connect with a team member or start a collaborative group."
      maxWidth="md"
    >
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setMode('direct')}
          className={cn(
            'flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors',
            mode === 'direct'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <UserPlus className="w-4 h-4" />
          Direct Chat
        </button>
        <button
          onClick={() => setMode('group')}
          className={cn(
            'flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors',
            mode === 'group'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {mode === 'direct' ? (
        <div>
          {/* Search Contacts */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search team members by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/60 border border-transparent focus:border-primary/50 text-sm focus:outline-none"
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No contacts found</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => !isSubmitting && handleStartDirect(u)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors"
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
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                  <button
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Chat
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Group Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 🚀 Design & Product Sync"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Group Description (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Channel for real-time design updates"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Select Members ({selectedUserIds.length})
              </label>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-border/30 border border-border rounded-xl p-1 bg-muted/20">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSelectUser(u.id)}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                      isSelected ? 'bg-primary/15' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar} name={u.name} size="sm" isOnline={u.isOnline} />
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/40'
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !groupName.trim() || selectedUserIds.length === 0}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Group...
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </form>
      )}
    </Modal>
  );
}
