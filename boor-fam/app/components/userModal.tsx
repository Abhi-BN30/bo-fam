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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl w-96 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">{mode === 'edit' ? 'Edit User' : mode === 'add' ? 'Add User' : 'User details'}</h2>

        <input className="w-full border p-2 mb-2 rounded" placeholder="Full name" value={form.primary_name || ''} onChange={e => setForm({ ...form, primary_name: e.target.value })} required />
        <input className="w-full border p-2 mb-2 rounded" placeholder="contact" value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} required />
        <input className="w-full border p-2 mb-2 rounded" type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} required />
        <input className="w-full border p-2 mb-2 rounded" placeholder="Primary email" type="email" value={form.primary_email || ''} onChange={e => setForm({ ...form, primary_email: e.target.value })} />
        <input className="w-full border p-2 mb-2 rounded" placeholder="Spouse name" value={form.spouse_name || ''} onChange={e => setForm({ ...form, spouse_name: e.target.value })} />
        <input className="w-full border p-2 mb-2 rounded" placeholder="Spouse email" type="email" value={form.spouse_email || ''} onChange={e => setForm({ ...form, spouse_email: e.target.value })} />
        <input className="w-full border p-2 mb-2 rounded" placeholder="Profile Pic URL" value={form.profile_pic_url || ''} onChange={e => setForm({ ...form, profile_pic_url: e.target.value })} />

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          {mode === 'edit' ? (
            <>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 p-2 rounded">Cancel</button>
              <button type="button" onClick={handleDelete} className="bg-red-500 text-white p-2 rounded">Delete</button>
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded">Save</button>
            </>
          ) : mode === 'add' ? (
            <>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 p-2 rounded">Cancel</button>
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded">Create</button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="flex-1 bg-gray-200 p-2 rounded">Close</button>
              <button type="button" onClick={() => { if (typeof onEditRequested === 'function') onEditRequested(); }} className="bg-yellow-500 text-white p-2 rounded">Edit</button>
              <button type="button" onClick={handleDelete} className="bg-red-500 text-white p-2 rounded">Delete</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}