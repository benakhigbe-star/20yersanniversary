'use client';

import { useState } from 'react';
import Link from 'next/link';

export function InvitationForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setResult(null);

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          preferred_name: preferredName || null,
          email,
          note: note || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setResult({ status: 'error', message: data.error ?? 'Something went wrong. Please try again.' });
        return;
      }

      setStatus('idle');
      setResult({ status: data.status, message: data.message });
    } catch {
      setStatus('error');
      setResult({ status: 'error', message: 'Network error — please check your connection and try again.' });
    }
  }

  if (result && result.status !== 'error') {
    return (
      <div className="mt-5 space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl">
          {result.status === 'already_guest' ? '👋' : '✅'}
        </div>
        <p className="text-sm text-white/90">{result.message}</p>
        <Link
          href="/"
          className="tap-target inline-flex w-full items-center justify-center rounded-xl bg-white py-3 text-base font-semibold text-ocean-800 shadow-glow transition active:scale-[0.98]"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="first_name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60">
            First name
          </label>
          <input
            id="first_name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="tap-target w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/40 outline-none ring-ocean-300 transition focus:border-white/40 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="last_name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60">
            Last name
          </label>
          <input
            id="last_name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="tap-target w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/40 outline-none ring-ocean-300 transition focus:border-white/40 focus:ring-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="preferred_name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60">
          Preferred name (optional)
        </label>
        <input
          id="preferred_name"
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
          placeholder="What should we call you?"
          className="tap-target w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/40 outline-none ring-ocean-300 transition focus:border-white/40 focus:ring-2"
        />
      </div>

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

      <div>
        <label htmlFor="note" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60">
          Note for the organiser (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. how you know the group"
          rows={2}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/40 outline-none ring-ocean-300 transition focus:border-white/40 focus:ring-2"
        />
      </div>

      {result?.status === 'error' && (
        <p className="rounded-lg bg-sunset-500/20 px-3 py-2 text-sm text-sunset-100" role="alert">
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !firstName || !lastName || !email}
        className="tap-target w-full rounded-xl bg-white py-3 text-base font-semibold text-ocean-800 shadow-glow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Send Request'}
      </button>
    </form>
  );
}
