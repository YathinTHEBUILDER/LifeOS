'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      toast.info('Supabase keys not yet configured. Continuing in local-first mode.');
      router.push('/');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Account created! Please check your email or proceed.');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Create your LifeOS account</h1>
          <p className="text-xs text-muted-foreground">Start your personal productivity operating system</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Alex Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full text-xs pl-10 pr-3 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-hidden text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                minLength={6}
                className="w-full text-xs pl-10 pr-3 py-2.5 bg-secondary/50 border border-border rounded-xl focus:outline-hidden text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
