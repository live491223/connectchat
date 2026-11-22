'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { ShieldAlert, RefreshCw, LogOut, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

export function PendingApprovalView() {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  // Poll every 3.5 seconds to auto-detect when admin approves the user
  useEffect(() => {
    const timer = setInterval(async () => {
      await refreshUser();
    }, 3500);

    return () => clearInterval(timer);
  }, [refreshUser]);

  const handleManualCheck = async () => {
    setChecking(true);
    await refreshUser();
    setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0e1621] text-[#f5f5f5] select-none">
      <div className="w-full max-w-md bg-[#17212b] border border-[#242f3d] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#2481cc]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Telegram logo badge */}
        <div className="w-16 h-16 rounded-2xl bg-[#2481cc] flex items-center justify-center text-white shadow-lg shadow-[#2481cc]/30 mb-5">
          <MessageSquare className="w-8 h-8" />
        </div>

        {/* User Avatar */}
        <div className="relative mb-3">
          <Avatar
            src={user?.avatar || undefined}
            name={user?.name || 'User'}
            size="2xl"
            className="border-3 border-[#2481cc]"
          />
          <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-black shadow-md">
            <Clock className="w-3.5 h-3.5" />
          </span>
        </div>

        <h2 className="text-xl font-bold tracking-tight">{user?.name || 'New User'}</h2>
        <p className="text-xs text-[#708499] mt-0.5">@{user?.username} &middot; {user?.email}</p>

        {/* Status Card */}
        <div className="w-full my-6 p-4 rounded-2xl bg-[#202b36] border border-[#2b5278]/40 text-left space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Awaiting Administrator Approval
            </h4>
          </div>
          <p className="text-xs text-[#a2b5c7] leading-relaxed">
            Aapka account successfully register ho chuka hai. Security aur privacy ke liye, Admin approval ke baad hi chat aur call privileges activate honge.
          </p>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-[#708499] border-t border-[#242f3d]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>Checking live approval status every 3 seconds...</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Approval Status</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 rounded-xl bg-[#202b36] hover:bg-[#2b3947] text-[#e53935] hover:text-white font-semibold text-xs border border-[#e53935]/30 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>

        <p className="text-[10px] text-[#708499] mt-6">
          ConnectChat Telegram Edition &middot; End-to-end encrypted sessions
        </p>
      </div>
    </div>
  );
}
