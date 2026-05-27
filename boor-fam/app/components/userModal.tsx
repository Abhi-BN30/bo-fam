import { useEffect, useState } from 'react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  mode: 'add' | 'edit' | 'view';
  initialData?: Record<string, any>;
  onEditRequested?: () => void;
}

export default function UserModal({ isOpen, onClose, onRefresh, mode, initialData, onEditRequested }: UserModalProps) {
  const [form, setForm] = useState<Record<string, any>>(initialData || {});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const normalizeDob = (value: string | undefined) => {
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
  };

  useEffect(() => {
    setForm({ ...(initialData || {}), dob: normalizeDob(initialData?.dob) });
    setError('');
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || data?.message || 'Unable to save changes');
        return;
      }

      if (mode === 'edit' && form?.id) {
        const stored = localStorage.getItem('user_session');
        const currentSession = stored ? JSON.parse(stored) : null;
        if (currentSession?.id === form.id) {
          localStorage.setItem('user_session', JSON.stringify({ ...currentSession, ...form }));
        }
      }

      onRefresh();
      onClose();
    } catch (err) {
      setError('Unable to save changes.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form?.id) return;
    if (!confirm('Delete this user? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.error || 'Unable to delete user.');
        return;
      }

      onRefresh();
      onClose();
    } catch (err) {
      setError('Unable to delete user.');
      console.error(err);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl max-h-[90vh] overflow-auto">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 text-slate-900">{mode === 'edit' ? 'Edit User' : mode === 'add' ? 'Add User' : 'User details'}</h2>

        <div className="space-y-3">
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="Full name" value={form.primary_name || ''} onChange={e => setForm({ ...form, primary_name: e.target.value })} required />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="Contact" value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} required />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} required />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="Primary email" type="email" value={form.primary_email || ''} onChange={e => setForm({ ...form, primary_email: e.target.value })} />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="Spouse Name" value={form.spouse_name || ''} onChange={e => setForm({ ...form, spouse_name: e.target.value })} />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="Spouse email" type="email" value={form.spouse_email || ''} onChange={e => setForm({ ...form, spouse_email: e.target.value })} />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="City" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
          <input disabled={mode === 'view'} className={`w-full border p-2.5 sm:p-3 text-sm sm:text-base mb-0 rounded-lg transition ${mode === 'view' ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`} placeholder="State" value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} />
        </div>

        {error && <p className="text-red-500 text-xs sm:text-sm mt-3 sm:mt-4">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 sm:mt-6 md:mt-8">
          {mode === 'edit' ? (
            <>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition order-3 sm:order-1">Cancel</button>
              <button type="button" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition flex-1 sm:flex-none order-2 sm:order-2">Delete</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition flex-1 sm:flex-none order-1 sm:order-3">Save</button>
            </>
          ) : mode === 'add' ? (
            <>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition">Create</button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition order-3 sm:order-1">Close</button>
              <button type="button" onClick={() => { if (typeof onEditRequested === 'function') onEditRequested(); }} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition flex-1 sm:flex-none order-1 sm:order-2">Edit</button>
              <button type="button" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white p-2.5 sm:p-3 text-sm sm:text-base rounded-lg transition flex-1 sm:flex-none order-2 sm:order-3">Delete</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}