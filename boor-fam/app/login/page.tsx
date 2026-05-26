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
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-3 sm:px-4 md:px-6">
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-900 mb-4 sm:mb-5 md:mb-6">Family Portal</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 md:mb-8 leading-relaxed">Enter your registered email to access our family page.</p>
        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <input
            type="email"
            className="w-full border-2 border-gray-200 p-2.5 sm:p-3 text-sm sm:text-base text-black placeholder:text-gray-500 rounded-lg sm:rounded-xl focus:border-indigo-500 outline-none transition"
            placeholder="Your email address"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white p-2.5 sm:p-3 text-sm sm:text-base rounded-lg sm:rounded-xl font-bold hover:bg-indigo-700 transition">
            Click here to access our family
          </button>
        </form>
        <p className="mt-5 sm:mt-6 md:mt-8 text-center text-xs sm:text-sm text-gray-600">
          New here? <button onClick={() => router.push('/register')} className="text-indigo-600 underline hover:text-indigo-700 transition">Create your Profile</button>
        </p>
      </div>
    </div>
  );
}
