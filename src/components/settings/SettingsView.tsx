'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { soundEffects } from '@/lib/sound';
import { Avatar } from '@/components/ui/Avatar';
import {
  User,
  Shield,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Monitor,
  Download,
  LogOut,
  Check,
  Loader2,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
];

export function SettingsView({ onClose }: { onClose?: () => void }) {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [showOnlineStatus, setShowOnlineStatus] = useState(user?.showOnlineStatus !== false);
  const [readReceipts, setReadReceipts] = useState(user?.readReceipts !== false);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.isEnabled());
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile({
        name: name.trim(),
        statusMessage: statusMessage.trim(),
        avatar: selectedAvatar || null,
        showOnlineStatus,
        readReceipts,
        theme,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.setEnabled(next);
    if (next) soundEffects.playSent();
  };

  return (
    <div className="flex flex-col h-full bg-card/40 overflow-y-auto p-4 sm:p-6 select-none max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div>
          <h2 className="text-xl font-bold">Settings & Profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your account, privacy preferences, and app appearance
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
            <User className="w-4 h-4" />
            Profile Information
          </h3>

          <div className="flex items-center gap-4">
            <Avatar
              src={selectedAvatar}
              name={name || user?.name}
              size="xl"
            />
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Choose Preset Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                      selectedAvatar === url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Username
              </label>
              <input
                type="text"
                disabled
                value={`@${user?.username || ''}`}
                className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Status Message / Bio
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. In a meeting / Available"
              className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
            <Shield className="w-4 h-4" />
            Privacy & Status
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-muted/40 transition-colors">
              <div>
                <p className="text-sm font-medium">Show Online Status</p>
                <p className="text-xs text-muted-foreground">
                  Allow other contacts to see when you are active
                </p>
              </div>
              <input
                type="checkbox"
                checked={showOnlineStatus}
                onChange={(e) => setShowOnlineStatus(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-muted/40 transition-colors">
              <div>
                <p className="text-sm font-medium">Read Receipts</p>
                <p className="text-xs text-muted-foreground">
                  Show blue double check marks when messages are read
                </p>
              </div>
              <input
                type="checkbox"
                checked={readReceipts}
                onChange={(e) => setReadReceipts(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Appearance & Sound */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
            <Monitor className="w-4 h-4" />
            Theme & Sounds
          </h3>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  theme === 'system'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="w-4 h-4" />
                System
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Notification Sounds</p>
                  <p className="text-xs text-muted-foreground">
                    Play soft chime on incoming and sent messages
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={toggleSound}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Saved Successfully!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2.5 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}
