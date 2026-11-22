'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Settings as SettingsIcon,
  Check,
  X,
  Bell,
  Download,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  AlertCircle,
  Smartphone,
  Laptop,
  Tablet,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: 'ADMIN' | 'USER';
  isApproved: boolean;
  isOnline: boolean;
  lastSeen: string | Date;
  createdAt: string | Date;
}

interface AdminSettings {
  pwa_enabled: boolean;
  announcement_enabled: boolean;
  announcement_text: string;
  require_user_approval: boolean;
}

interface AdminPanelViewProps {
  onClose?: () => void;
}

export function AdminPanelView({ onClose }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    pwa_enabled: true,
    announcement_enabled: false,
    announcement_text: '',
    require_user_approval: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const [usersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/settings'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.settings) {
          setSettings(settingsData.settings);
        }
      }
    } catch (err) {
      setStatusMessage('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleApproval = async (userId: string, currentApproved: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isApproved: !currentApproved }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isApproved: !currentApproved } : u))
        );
        setStatusMessage(
          `User ${!currentApproved ? 'approved successfully' : 'approval revoked'}`
        );
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      setStatusMessage('Error updating user approval');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'ADMIN' | 'USER') => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setStatusMessage(`Role updated to ${newRole}`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      setStatusMessage('Error updating role');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user @${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setStatusMessage(`User @${username} deleted`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      setStatusMessage('Error deleting user');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setStatusMessage('Settings updated successfully! Changes reflect across all devices.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      setStatusMessage('Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  const pendingCount = users.filter((u) => !u.isApproved).length;

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-card text-foreground rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Management Panel</h2>
            <p className="text-xs text-muted-foreground">
              User Approvals, PWA Controls & Broadcast Notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6 pt-2 gap-4 bg-muted/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-all',
            activeTab === 'users'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="w-4 h-4" />
          <span>User Approvals & Management</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-500 font-bold">
              {pendingCount} Pending
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-all',
            activeTab === 'settings'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>PWA & System Toggles</span>
        </button>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className="mx-6 mt-3 p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Tab 1: Users & User Approval */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Total Users</p>
                <p className="text-xl font-bold mt-0.5">{users.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Pending Approval</p>
                <p className="text-xl font-bold mt-0.5 text-amber-500">{pendingCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold">Online Now</p>
                <p className="text-xl font-bold mt-0.5 text-emerald-500">
                  {users.filter((u) => u.isOnline).length}
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user by name, @username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {/* Users List */}
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border/60 bg-card">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No users found matching query.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="md" isOnline={u.isOnline} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold truncate">{u.name}</h4>
                          {u.role === 'ADMIN' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">
                              ADMIN
                            </span>
                          )}
                          {u.isApproved ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-500 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Approved
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-500 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> Pending
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{u.username} &middot; {u.email}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Approve / Revoke Button */}
                      <button
                        onClick={() => handleToggleApproval(u.id, u.isApproved)}
                        title={u.isApproved ? 'Revoke Approval' : 'Approve User'}
                        className={cn(
                          'p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all',
                          u.isApproved
                            ? 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                        )}
                      >
                        {u.isApproved ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Approve</span>
                          </>
                        )}
                      </button>

                      {/* Make Admin Toggle */}
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        title={u.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
                      >
                        <Shield className="w-4 h-4" />
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        title="Delete User"
                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: PWA & System Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* 1. PWA Controls for Desktop, Tablet, Mobile */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    PWA App Installation Prompt (ON / OFF)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Controls whether install prompts and banners appear across Desktop, Tablet & Mobile browsers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, pwa_enabled: !prev.pwa_enabled }))
                  }
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative focus:outline-none p-1',
                    settings.pwa_enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform',
                      settings.pwa_enabled ? 'translate-x-6' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-primary" /> Desktop PWA
                </span>
                <span className="flex items-center gap-1">
                  <Tablet className="w-3.5 h-3.5 text-primary" /> Tablet Adaptive
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-primary" /> Mobile Standalone
                </span>
              </div>
            </div>

            {/* 2. User Approval Workflow Requirement */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    Require Admin Approval for New Users (ON / OFF)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When ON, newly registered users cannot chat until an Admin manually approves them.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      require_user_approval: !prev.require_user_approval,
                    }))
                  }
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative focus:outline-none p-1',
                    settings.require_user_approval ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform',
                      settings.require_user_approval ? 'translate-x-6' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 3. User Notification / Broadcast Banner */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    Broadcast Notification Banner (ON / OFF)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Displays a real-time banner at the top of all user screens on Desktop, Tablet & Mobile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      announcement_enabled: !prev.announcement_enabled,
                    }))
                  }
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative focus:outline-none p-1',
                    settings.announcement_enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform',
                      settings.announcement_enabled ? 'translate-x-6' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Notification Text
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 🚀 ConnectChat PWA is live! Download to your desktop or mobile home screen."
                  value={settings.announcement_text}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, announcement_text: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Save Settings Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save System Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
