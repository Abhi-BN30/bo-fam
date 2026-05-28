"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      router.replace('/profile');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem('user_session', JSON.stringify(data.user));
      router.push('/profile');
    } else {
      setError("Email not found in our family database.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-100 w-full max-w-md border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="mb-10 text-center">
          <div className="inline-flex h-14 w-14 bg-indigo-50 rounded-2xl items-center justify-center text-indigo-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Family Portal</h1>
          <p className="text-slate-500 mt-2">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            className="w-full border border-slate-200 bg-slate-50/50 p-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            placeholder="Enter your registered email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-rose-600 text-sm font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            Click here to access our family
          </button>
        </form>
        <p className="mt-10 text-center text-slate-500 font-medium">
          New to the family? <button onClick={() => router.push('/register')} className="text-indigo-600 font-bold hover:text-indigo-700 transition">Register here</button>
        </p>
      </div>
    </div>
  );
}
