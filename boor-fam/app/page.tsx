﻿"use client";
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white shadow-2xl shadow-indigo-100 rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-12">
          <div className="inline-flex h-20 w-20 bg-indigo-600 rounded-3xl items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">The Boorlagadda's</h1>
          <p className="text-slate-500 text-lg sm:text-xl font-medium max-w-md mx-auto">
            Our history, our legacy. Connect with the roots and branches of our family.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <button
            onClick={() => router.push('/login')}
            className="group relative flex items-center justify-center rounded-2xl bg-indigo-600 text-white py-5 text-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95"
          >
            Access Portal
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>

          <button
            onClick={() => router.push('/register')}
            className="rounded-2xl border-2 border-slate-100 text-slate-700 py-5 text-lg font-bold hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95"
          >
            Join the Tree
          </button>
        </div>
      </div>
    </div>
  );
}
