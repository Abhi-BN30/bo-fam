"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      router.replace('/profile');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-indigo-900 mb-4">Welcome to The Boorlagadda's</h1>
          <p className="text-gray-600 text-lg">Log in to view our family tree or create your account to get started</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push('/login')}
            className="rounded-3xl bg-indigo-600 text-white py-5 text-lg font-semibold hover:bg-indigo-700 transition"
          >
            Login
          </button>

          <button
            onClick={() => router.push('/register')}
            className="rounded-3xl border border-indigo-600 text-indigo-700 py-5 text-lg font-semibold hover:bg-indigo-50 transition"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
