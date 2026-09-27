'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setStatus('error');
      setMessage('Network error — please check your connection and try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60">
          Email address
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="tap-target w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/40 outline-none ring-ocean-300 transition focus:border-white/40 focus:ring-2"
        />
      </div>

      {message && (
        <p className="rounded-lg bg-sunset-500/20 px-3 py-2 text-sm text-sunset-100" role="alert">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !email}
        className="tap-target w-full rounded-xl bg-white py-3 text-base font-semibold text-ocean-800 shadow-glow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Checking the list…' : 'Enter Party'}
      </button>
    </form>
  );
}
