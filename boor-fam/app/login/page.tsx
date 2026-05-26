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
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-900 mb-6">Family Portal</h1>
        <p className="text-gray-600 mb-6">Enter your registered email to access our family page.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full border-2 border-gray-200 p-3 text-black placeholder:text-gray-500 rounded-xl focus:border-indigo-500 outline-none"
            placeholder="Your email address"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Click here to access our family
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          New here? <button onClick={() => router.push('/register')} className="text-indigo-600 underline">Create your Profile</button>
        </p>
      </div>
    </div>
  );
}
