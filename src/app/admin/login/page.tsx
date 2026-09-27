import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/admin-login-form';

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <p className="text-3xl">⚓</p>
          <h1 className="mt-2 text-xl font-bold text-white">Admin Portal</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage the cruise party.</p>
        </div>
        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
