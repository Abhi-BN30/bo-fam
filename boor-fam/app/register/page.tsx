"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SetupModal from '../components/setupModal';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    primary_name: '',
    primary_email: '',
    spouse_name: '',
    spouse_email: '',
    contact: '',
    dob: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      router.replace('/profile');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Unable to create profile');
      }

      const data = await res.json();
      const userSession = { id: data.id, ...form };
      localStorage.setItem('user_session', JSON.stringify(userSession));
      setCurrentUser(userSession);
      setShowSetupModal(true);
    } catch (err) {
      setError('Could not create profile. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupClose = () => {
    setShowSetupModal(false);
    router.push('/profile');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-10 shadow-2xl">
          <h1 className="text-3xl font-bold text-indigo-900 mb-6">Create Your Family Profile</h1>
          <p className="text-gray-600 mb-6">Enter your details to create a new family profile and access the family tree.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border-2 border-gray-200 p-3 rounded-xl text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Your Full Name"
              value={form.primary_name}
              onChange={(e) => setForm({ ...form, primary_name: e.target.value })}
              required
            />

            <input
              className="w-full border-2 border-gray-200 p-3 rounded-xl text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Contact Number"
              value={(form as any).contact || ''}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              required
            />

            <input
              type="date"
              className="w-full border-2 border-gray-200 p-3 rounded-xl text-black focus:border-indigo-500 outline-none"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              required
            />

            <input
              type="email"
              className="w-full border-2 border-gray-200 p-3 rounded-xl text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Your email (optional)"
              value={form.primary_email}
              onChange={(e) => setForm({ ...form, primary_email: e.target.value })}
            />

            <input
              className="w-full border-2 border-gray-200 p-3 rounded-xl text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Spouse Name (optional)"
              value={form.spouse_name}
              onChange={(e) => setForm({ ...form, spouse_name: e.target.value })}
            />

            <input
              type="email"
              className="w-full border-2 border-gray-200 p-3 rounded-xl text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Spouse email (optional)"
              value={(form as any).spouse_email || ''}
              onChange={(e) => setForm({ ...form, spouse_email: e.target.value })}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Creating profile…' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>

      {showSetupModal && currentUser && (
        <SetupModal
          isOpen={showSetupModal}
          currentUser={currentUser}
          onClose={handleSetupClose}
          onSkip={handleSetupClose}
          onRefresh={() => {}}
        />
      )}
    </>
  );
}
