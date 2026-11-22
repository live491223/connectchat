'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ResponsiveShell } from '@/components/layout/ResponsiveShell';
import { PendingApprovalView } from '@/components/auth/PendingApprovalView';
import LoginPage from './login/page';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background select-none">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Starting ConnectChat...
        </p>
      </div>
    );
  }

  // If not authenticated, render LoginPage directly
  if (!user) {
    return <LoginPage />;
  }

  // If user is registered but awaiting admin approval, render PendingApprovalView
  if (user.role !== 'ADMIN' && user.isApproved === false) {
    return <PendingApprovalView />;
  }

  return <ResponsiveShell />;
}
