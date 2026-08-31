'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, User, Lock, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      toast.error('Supabase configuration missing.');
      setLoading(false);
      return;
    }

    const trimmedUser = username.trim().toLowerCase();

    // Map username to owner accounts
    const primaryEmail = trimmedUser === 'yathin' ? 'yathin@lifeos.app' : `${trimmedUser}@lifeos.app`;
    const fallbackEmail = 'yathing52@gmail.com';

    // 1. Try primary owner account
    const { data: primaryData, error: primaryError } = await supabase.auth.signInWithPassword({
      email: primaryEmail,
      password,
    });

    if (!primaryError && primaryData.user) {
      toast.success('Welcome back, Yathin.');
      window.location.href = redirectTarget;
      return;
    }

    // 2. Try fallback owner account
    const { data: fallbackData, error: fallbackError } = await supabase.auth.signInWithPassword({
      email: fallbackEmail,
      password,
    });

    if (!fallbackError && fallbackData.user) {
      toast.success('Welcome back, Yathin.');
      window.location.href = redirectTarget;
      return;
    }

    toast.error(fallbackError?.message || primaryError?.message || 'Invalid username or password.');
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-8 shadow-2xl space-y-6">
      {/* Brand */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">LifeOS</h1>
        <p className="text-xs text-muted-foreground">Sign in to access your personal schedule and tasks</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Username</label>
          <div className="relative">
            <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Yathin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full text-xs pl-10 pr-3 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-hidden text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-xs pl-10 pr-3 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-hidden text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
              className="w-3.5 h-3.5 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <span className="text-[11px] text-muted-foreground">Stay logged in on this device</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="pt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3 text-muted-foreground/70" />
        <span>LifeOS · Private Single-Owner System</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense fallback={<div className="w-full max-w-md h-96 rounded-3xl bg-card animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
