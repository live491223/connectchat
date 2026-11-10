'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import {
  MessageSquare,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEMO_PERSONAS = [
  {
    name: 'Sarah Connor',
    username: 'sarah',
    role: 'Tech Lead & AI Architect',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    name: 'Alex Morgan',
    username: 'alex',
    role: 'Senior Product Designer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    color: 'from-violet-600 to-purple-600',
  },
  {
    name: 'Elena Rostova',
    username: 'elena',
    role: 'PWA & Offline Specialist',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    name: 'David Chen',
    username: 'david',
    role: 'Full Stack Cloud Engineer',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    color: 'from-amber-600 to-orange-600',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, switchDemoUser, isLoading } = useAuth();

  const [mode, setMode] = useState<'demo' | 'login' | 'register'>('demo');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    } else {
      router.push('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await register({ name, username, email, password });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Registration failed');
    } else {
      router.push('/');
    }
  };

  const handleSelectDemo = async (demoUsername: string) => {
    setError(null);
    setSubmitting(true);
    const res = await switchDemoUser(demoUsername);
    setSubmitting(false);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Demo switch failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary/30 mb-3">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ConnectChat</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Universal Real-Time Messenger for Mobile, Tablet & Desktop
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border border-border/80 rounded-2xl p-1 bg-muted/40 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('demo');
              setError(null);
            }}
            className={cn(
              'flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5',
              mode === 'demo'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            1-Click Demo
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={cn(
              'flex-1 py-2 rounded-xl transition-all',
              mode === 'login'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={cn(
              'flex-1 py-2 rounded-xl transition-all',
              mode === 'register'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Mode 1: 1-Click Demo Personas */}
        {mode === 'demo' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Select a team persona to test real-time chat instantly:
            </p>
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.username}
                type="button"
                disabled={submitting}
                onClick={() => handleSelectDemo(p.username)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted border border-border/60 hover:border-primary/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={p.avatar} name={p.name} size="md" />
                  <div>
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{p.role}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        )}

        {/* Mode 2: Standard Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="e.g. sarah or sarah@connectchat.io"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                (Default demo password for seeded accounts: <code>password123</code>)
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        )}

        {/* Mode 3: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">@</span>
                <input
                  type="text"
                  required
                  placeholder="janedoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground">
            🔒 End-to-end encrypted sessions &middot; PWA offline capable &middot; Multi-device sync
          </p>
        </div>
      </div>
    </div>
  );
}
