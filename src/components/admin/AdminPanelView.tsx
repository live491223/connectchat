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
  Globe,
  Key,
  ExternalLink,
  UserPlus,
  Edit,
  Lock,
  Eye,
  EyeOff,
  Save,
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
  google_client_id?: string;
  google_client_secret?: string;
}

interface AdminPanelViewProps {
  onClose?: () => void;
}

export function AdminPanelView({ onClose }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'google' | 'settings'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    pwa_enabled: true,
    announcement_enabled: false,
    announcement_text: '',
    require_user_approval: true,
    google_client_id: '',
    google_client_secret: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Change Admin Password state
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // 2. Add New User Modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'USER' | 'ADMIN'>('USER');
  const [addApproved, setAddApproved] = useState(true);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // 3. Edit User Modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editApproved, setEditApproved] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
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
      setErrorMessage('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Approval toggle
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
          `User ${!currentApproved ? 'approved! They can now chat and call.' : 'approval revoked.'}`
        );
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (e) {
      setErrorMessage('Error updating user approval');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setStatusMessage(`User @${username} deleted from database`);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to delete user');
      }
    } catch (e) {
      setErrorMessage('Error deleting user');
    }
  };

  // Add New User Handler
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          username: addUsername.trim(),
          email: addEmail.trim(),
          password: addPassword,
          role: addRole,
          isApproved: addApproved,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create user');
      } else {
        setUsers((prev) => [data.user, ...prev]);
        setShowAddUserModal(false);
        setAddName('');
        setAddUsername('');
        setAddEmail('');
        setAddPassword('');
        setStatusMessage(`User @${data.user.username} created successfully!`);
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (e) {
      setErrorMessage('Error adding user');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Edit User Modal
  const openEditUser = (u: AdminUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditUsername(u.username);
    setEditEmail(u.email);
    setEditPassword('');
    setEditRole(u.role);
    setEditApproved(u.isApproved);
  };

  // Save Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingEdit(true);
    setErrorMessage(null);
    try {
      const payload: Record<string, any> = {
        userId: editingUser.id,
        name: editName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        role: editRole,
        isApproved: editApproved,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update user record');
      } else {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? data.user : u)));
        setEditingUser(null);
        setStatusMessage(`User @${data.user.username} updated in database!`);
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (e) {
      setErrorMessage('Error updating user');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Change Admin Password Handler
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (newAdminPassword !== confirmAdminPassword) {
      setErrorMessage('New password and confirmation do not match');
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentAdminPassword,
          newPassword: newAdminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to change admin password');
      } else {
        setStatusMessage('Admin password updated successfully! Keep your new password safe.');
        setCurrentAdminPassword('');
        setNewAdminPassword('');
        setConfirmAdminPassword('');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (e) {
      setErrorMessage('Error changing password');
    } finally {
      setChangingPass(false);
    }
  };

  // Save System Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setStatusMessage('Settings updated successfully! Changes saved across all devices.');
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        setErrorMessage('Failed to save settings');
      }
    } catch (e) {
      setErrorMessage('Error saving settings');
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
    <div className="flex flex-col h-full max-h-[85vh] bg-[#17212b] text-[#f5f5f5] rounded-2xl overflow-hidden border border-[#242f3d]">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-[#242f3d] flex items-center justify-between bg-[#0e1621]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2481cc] flex items-center justify-center text-white shadow-md shadow-[#2481cc]/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Management & Database Panel</h2>
            <p className="text-xs text-[#708499]">
              User CRUD, Admin Password, Google OAuth API & System Controls
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-xl text-[#708499] hover:text-white hover:bg-[#202b36] transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#708499] hover:text-white hover:bg-[#202b36] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#242f3d] px-6 pt-2 gap-4 bg-[#0e1621]/30 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap',
            activeTab === 'users'
              ? 'border-[#2481cc] text-[#2481cc] font-bold'
              : 'border-transparent text-[#708499] hover:text-white'
          )}
        >
          <Users className="w-4 h-4" />
          <span>User Database (CRUD)</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold">
              {pendingCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap',
            activeTab === 'security'
              ? 'border-[#2481cc] text-[#2481cc] font-bold'
              : 'border-transparent text-[#708499] hover:text-white'
          )}
        >
          <Lock className="w-4 h-4" />
          <span>Admin Password</span>
        </button>

        <button
          onClick={() => setActiveTab('google')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap',
            activeTab === 'google'
              ? 'border-[#2481cc] text-[#2481cc] font-bold'
              : 'border-transparent text-[#708499] hover:text-white'
          )}
        >
          <Globe className="w-4 h-4" />
          <span>Google API Connect</span>
          {settings.google_client_id && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap',
            activeTab === 'settings'
              ? 'border-[#2481cc] text-[#2481cc] font-bold'
              : 'border-transparent text-[#708499] hover:text-white'
          )}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>PWA & Broadcast Toggles</span>
        </button>
      </div>

      {/* Status & Error Alerts */}
      {statusMessage && (
        <div className="mx-6 mt-3 p-2.5 rounded-xl bg-[#2481cc]/15 border border-[#2481cc]/40 text-[#2481cc] text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mx-6 mt-3 p-2.5 rounded-xl bg-destructive/15 border border-destructive/40 text-rose-400 text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Tab 1: User Database CRUD */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Top Toolbar: Search + Add User Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#708499]" />
                <input
                  type="text"
                  placeholder="Search database by name, @username, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="py-2 px-4 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add User to Database</span>
              </button>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#202b36] border border-[#242f3d]">
                <p className="text-[11px] text-[#708499] uppercase font-semibold">Total Accounts</p>
                <p className="text-xl font-bold mt-0.5">{users.length}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#202b36] border border-[#242f3d]">
                <p className="text-[11px] text-[#708499] uppercase font-semibold">Pending Approval</p>
                <p className="text-xl font-bold mt-0.5 text-amber-400">{pendingCount}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#202b36] border border-[#242f3d]">
                <p className="text-[11px] text-[#708499] uppercase font-semibold">Online Users</p>
                <p className="text-xl font-bold mt-0.5 text-emerald-400">
                  {users.filter((u) => u.isOnline).length}
                </p>
              </div>
            </div>

            {/* Users Table / Records List */}
            <div className="border border-[#242f3d] rounded-2xl overflow-hidden divide-y divide-[#242f3d] bg-[#17212b]">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#708499]">
                  No accounts found. Click &quot;+ Add User to Database&quot; to create one.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#202b36]/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="md" isOnline={u.isOnline} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold truncate text-white">{u.name}</h4>
                          {u.role === 'ADMIN' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2481cc]/20 text-[#2481cc]">
                              ADMIN
                            </span>
                          )}
                          {u.isApproved ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Approved
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> Pending Approval
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#708499] truncate">
                          @{u.username} &middot; {u.email}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons: Edit, Approve/Revoke, Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Approve / Revoke Button */}
                      <button
                        onClick={() => handleToggleApproval(u.id, u.isApproved)}
                        title={u.isApproved ? 'Revoke User Access' : 'Approve User'}
                        className={cn(
                          'py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all',
                          u.isApproved
                            ? 'bg-[#202b36] text-[#708499] hover:text-amber-400 hover:bg-amber-400/10 border border-[#242f3d]'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                        )}
                      >
                        {u.isApproved ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Revoke</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>

                      {/* Edit Database Record (Pencil) */}
                      <button
                        onClick={() => openEditUser(u)}
                        title="Edit User Database Record"
                        className="p-2 rounded-xl border border-[#242f3d] bg-[#202b36] text-[#708499] hover:text-[#2481cc] hover:bg-[#202b36] transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete User */}
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          title="Delete User from Database"
                          className="p-2 rounded-xl text-[#708499] hover:text-rose-400 hover:bg-rose-500/10 border border-[#242f3d] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Admin Password Change */}
        {activeTab === 'security' && (
          <div className="max-w-md mx-auto space-y-5">
            <div className="p-5 rounded-2xl bg-[#202b36] border border-[#242f3d] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Change Administrator Password</h4>
                  <p className="text-xs text-[#708499]">
                    Update the root password for the Admin account.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangeAdminPassword} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                    Current Password
                  </label>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    placeholder="Enter current password (e.g. password123)"
                    value={currentAdminPassword}
                    onChange={(e) => setCurrentAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                    New Password
                  </label>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#708499]">
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAdminPass ? 'Hide Passwords' : 'Show Passwords'}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={changingPass}
                  className="w-full py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {changingPass && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Update Admin Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Google API Connect */}
        {activeTab === 'google' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#202b36] border border-[#242f3d] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google OAuth API Integration</h4>
                  <p className="text-xs text-[#708499]">
                    Connect your official Google Cloud OAuth Client ID for native Google Sign-In.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#708499] uppercase mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#2481cc]" />
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com"
                  value={settings.google_client_id || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, google_client_id: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] text-xs text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#708499] uppercase mb-1.5">
                  Google Client Secret (Optional)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  value={settings.google_client_secret || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, google_client_secret: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] text-xs text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc] font-mono"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e1621] border border-[#242f3d] space-y-2 text-xs">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#2481cc]" />
                  How to get your Google Client ID:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[#a2b5c7] text-[11px]">
                  <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#2481cc] underline">Google Cloud Console &rarr; Credentials</a>.</li>
                  <li>Click <strong>Create Credentials &rarr; OAuth client ID</strong>.</li>
                  <li>Select Application type: <strong>Web application</strong>.</li>
                  <li>Under <strong>Authorized JavaScript origins</strong>, add: <code className="bg-[#202b36] px-1 py-0.5 rounded text-white font-mono">https://connectchat-peach.vercel.app</code></li>
                  <li>Copy your <strong>Client ID</strong> and paste it above, then click Save.</li>
                </ol>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Google API Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: PWA & System Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* 1. PWA Controls */}
            <div className="p-4 rounded-2xl bg-[#202b36] border border-[#242f3d] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#2481cc]" />
                    PWA App Installation Prompt (ON / OFF)
                  </h4>
                  <p className="text-xs text-[#708499] mt-0.5">
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
                    settings.pwa_enabled ? 'bg-[#2481cc]' : 'bg-[#708499]/30'
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

              <div className="flex items-center gap-4 text-xs text-[#708499] pt-1 border-t border-[#242f3d]">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-[#2481cc]" /> Desktop PWA
                </span>
                <span className="flex items-center gap-1">
                  <Tablet className="w-3.5 h-3.5 text-[#2481cc]" /> Tablet Adaptive
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-[#2481cc]" /> Mobile Standalone
                </span>
              </div>
            </div>

            {/* 2. User Notification / Broadcast Banner */}
            <div className="p-4 rounded-2xl bg-[#202b36] border border-[#242f3d] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    Broadcast Notification Banner (ON / OFF)
                  </h4>
                  <p className="text-xs text-[#708499] mt-0.5">
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
                    settings.announcement_enabled ? 'bg-[#2481cc]' : 'bg-[#708499]/30'
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
                <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                  Notification Text
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 🚀 Welcome to ConnectChat Telegram Edition! Fast, secure & universal."
                  value={settings.announcement_text}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, announcement_text: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0e1621] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc] resize-none"
                />
              </div>
            </div>

            {/* Save Settings Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save System Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL 1: ADD USER DIRECTLY TO DATABASE --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#17212b] border border-[#242f3d] rounded-3xl p-6 shadow-2xl relative text-white">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 text-[#708499] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2481cc] flex items-center justify-center text-white">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Add User to Database</h3>
                <p className="text-xs text-[#708499]">Admin Direct Account Insertion</p>
              </div>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Kumar"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="amitkumar"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Role</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as 'USER' | 'ADMIN')}
                    className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="amit@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Password (min 6 chars)"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addApprovedCheck"
                  checked={addApproved}
                  onChange={(e) => setAddApproved(e.target.checked)}
                  className="w-4 h-4 accent-[#2481cc] rounded cursor-pointer"
                />
                <label htmlFor="addApprovedCheck" className="text-xs text-[#a2b5c7] cursor-pointer">
                  Approve immediately (User can chat and call right away)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202b36] text-xs text-[#708499] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {submittingAdd && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Insert User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT USER DATABASE RECORD --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#17212b] border border-[#242f3d] rounded-3xl p-6 shadow-2xl relative text-white">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-[#708499] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#202b36] flex items-center justify-center text-[#2481cc]">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Edit Database Record</h3>
                <p className="text-xs text-[#708499]">User ID: {editingUser.id.substring(0, 12)}...</p>
              </div>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'USER' | 'ADMIN')}
                    className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="text"
                  minLength={6}
                  placeholder="Enter new password to overwrite"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-xs text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editApprovedCheck"
                  checked={editApproved}
                  onChange={(e) => setEditApproved(e.target.checked)}
                  className="w-4 h-4 accent-[#2481cc] rounded cursor-pointer"
                />
                <label htmlFor="editApprovedCheck" className="text-xs text-[#a2b5c7] cursor-pointer">
                  Approval Status: {editApproved ? 'Approved (Active)' : 'Pending (Restricted)'}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#202b36] text-xs text-[#708499] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {submittingEdit && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
