'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  MessageSquare,
  Lock,
  Mail,
  User,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, loginWithGoogle, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>('');

  // Google Sign-In Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Load configured Google Client ID from public settings
  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((data) => {
        if (data.google_client_id) {
          setGoogleClientId(data.google_client_id);
          // Load Google Identity Services script
          if (!document.getElementById('google-jssdk')) {
            const script = document.createElement('script');
            script.id = 'google-jssdk';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Handle standard Email / Username + Password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.');
    } else {
      router.push('/');
    }
  };

  // Handle new User Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await register({ name, username, email, password });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Registration failed. Please try again.');
    } else {
      router.push('/');
    }
  };

  // Handle Google Sign-In click
  const handleGoogleClick = () => {
    setError(null);
    const clientId = googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // If official Google Client ID is configured and GIS is loaded
    if (clientId && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential) {
              setSubmitting(true);
              const res = await loginWithGoogle({ credential: response.credential });
              setSubmitting(false);
              if (res.success) {
                router.push('/');
              } else {
                setError(res.error || 'Google sign-in failed');
              }
            }
          },
        });
        (window as any).google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('GIS prompt error:', err);
      }
    }

    // Default: Open sleek Telegram-styled Google Sign-In prompt
    setShowGoogleModal(true);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setError(null);
    setSubmitting(true);
    setShowGoogleModal(false);

    const displayName = googleName.trim() || googleEmail.split('@')[0];
    const googleAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(googleEmail)}`;

    const res = await loginWithGoogle({
      email: googleEmail.trim(),
      name: displayName,
      avatar: googleAvatar,
    });

    setSubmitting(false);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Google sign-in failed');
    }
  };

  const fillAdminCredentials = () => {
    setIdentifier('admin');
    setPassword('password123');
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0e1621]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2481cc]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0e1621] text-[#f5f5f5] relative overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2481cc]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#17212b] border border-[#242f3d] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        {/* Telegram-style Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#2481cc] flex items-center justify-center text-white shadow-lg shadow-[#2481cc]/30 mb-3">
            <MessageSquare className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ConnectChat</h1>
          <p className="text-xs text-[#708499] mt-1">
            Fast, secure, universal messaging & calls (Telegram Edition)
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex border border-[#242f3d] rounded-2xl p-1 bg-[#0e1621] mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={cn(
              'flex-1 py-2 rounded-xl transition-all',
              mode === 'login'
                ? 'bg-[#2481cc] text-white shadow-xs font-bold'
                : 'text-[#708499] hover:text-white'
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
                ? 'bg-[#2481cc] text-white shadow-xs font-bold'
                : 'text-[#708499] hover:text-white'
            )}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-rose-400 text-xs font-medium text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={submitting}
          className="w-full py-2.5 px-4 rounded-xl border border-[#242f3d] bg-[#202b36] hover:bg-[#2b3947] text-white font-medium text-xs transition-all flex items-center justify-center gap-3 shadow-xs mb-4 group"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#242f3d] w-full" />
          <span className="bg-[#17212b] px-3 text-[11px] uppercase tracking-wider text-[#708499] shrink-0">
            or with credentials
          </span>
          <div className="border-t border-[#242f3d] w-full" />
        </div>

        {/* Mode 1: Sign In */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#708499]" />
                <input
                  type="text"
                  required
                  placeholder="admin or user@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#708499] uppercase">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#708499]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#708499] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Admin quick access helper */}
            <div className="p-2.5 rounded-xl bg-[#202b36] border border-[#242f3d] flex items-center justify-between text-[11px]">
              <span className="text-[#708499] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Administrator:
              </span>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="text-[#2481cc] hover:underline font-bold"
              >
                Auto-fill (admin)
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        )}

        {/* Mode 2: Create Account / Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-[#708499]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#708499]">@</span>
                <input
                  type="text"
                  required
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#708499]" />
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#708499] uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#708499]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#708499] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#202b36] border border-[#242f3d] text-[11px] text-[#708499] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2481cc] shrink-0" />
              <span>Naya account create hone ke baad Admin approval ke liye submit hoga.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#242f3d] text-center">
          <p className="text-[11px] text-[#708499]">
            🔒 Telegram-grade encryption &middot; PWA offline capable &middot; Multi-device sync
          </p>
        </div>
      </div>

      {/* Google Sign-In Dialog / Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#17212b] border border-[#242f3d] rounded-3xl p-6 shadow-2xl relative text-white">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-[#708499] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-2 p-2">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
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
              <h3 className="text-lg font-bold">Sign in with Google</h3>
              <p className="text-xs text-[#708499] mt-1">
                Enter your Gmail address to sign in or register:
              </p>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">
                  Google Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#708499] uppercase mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202b36] border border-[#242f3d] text-sm text-white focus:outline-none focus:border-[#2481cc]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white font-bold text-sm shadow-md transition-all"
              >
                Continue with Google
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
