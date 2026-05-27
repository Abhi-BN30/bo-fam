"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddModal from '../components/addModal';
import ChoiceModal from '../components/choiceModal';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    primary_name: '',
    primary_email: '',
    spouse_name: '',
    spouse_email: '',
    contact: '',
    dob: '',
    address: '',
    city: '',
    state: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'add-new' | 'add-self'>('add-new');
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
      setShowChoiceModal(true);
    } catch (err) {
      setError('Could not create profile. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChoiceSelect = (mode: 'add-self' | 'add-new') => {
    setAddMode(mode);
    setShowChoiceModal(false);
    setShowAddModal(true);
  };

  const handleAddClose = () => {
    setShowAddModal(false);
    router.push('/profile');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-4 sm:mb-6">Create Your Profile</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Enter details to create your profile and access our family page.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Your Full Name"
              value={form.primary_name}
              onChange={(e) => setForm({ ...form, primary_name: e.target.value })}
              required
            />

            <input
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Contact Number"
              value={(form as any).contact || ''}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              required
            />

            <input
              type="date"
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black focus:border-indigo-500 outline-none"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              required
            />

            <input
              type="email"
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Your email (optional)"
              value={form.primary_email}
              onChange={(e) => setForm({ ...form, primary_email: e.target.value })}
            />

            <input
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Spouse Full Name (optional)"
              value={form.spouse_name}
              onChange={(e) => setForm({ ...form, spouse_name: e.target.value })}
            />

            <input
              type="email"
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Spouse email (optional)"
              value={(form as any).spouse_email || ''}
              onChange={(e) => setForm({ ...form, spouse_email: e.target.value })}
            />

            <input
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="Address (optional)"
              value={(form as any).address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <input
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="City (optional)"
              value={(form as any).city || ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />

            <input
              className="w-full border-2 border-gray-200 p-2.5 sm:p-3 rounded-xl text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-indigo-500 outline-none"
              placeholder="State (optional)"
              value={(form as any).state || ''}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />

            {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white p-2.5 sm:p-3 rounded-xl text-sm sm:text-base font-bold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Creating profile…' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>

      {showChoiceModal && currentUser && (
        <ChoiceModal
          isOpen={showChoiceModal}
          currentUser={currentUser}
          onClose={() => {
            setShowChoiceModal(false);
            router.push('/profile');
          }}
          onSelectAddSelf={() => handleChoiceSelect('add-self')}
          onSelectAddOther={() => handleChoiceSelect('add-new')}
        />
      )}

      {showAddModal && currentUser && (
        <AddModal
          parentId={null}
          onClose={handleAddClose}
          onRefresh={() => {}}
          mode={addMode}
          currentUser={addMode === 'add-self' ? currentUser : undefined}
        />
      )}
    </>
  );
}
