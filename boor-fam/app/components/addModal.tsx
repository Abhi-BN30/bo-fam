import { useState } from 'react';

interface AddModalProps {
  onClose: () => void;
  onRefresh: () => void;
  parentId?: number | string | null;
}

export default function AddModal({ onClose, onRefresh, parentId = null }: AddModalProps) {
  const [form, setForm] = useState({ primary_name: '', spouse_name: '', primary_email: '', spouse_email: '', contact: '', dob: '', profile_pic_url: '', parent_id: parentId });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        console.error('Add user failed', await res.text());
        alert('Error adding user');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <h2 className="text-xl font-bold mb-4">Add User</h2>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full border p-2 rounded" placeholder="Full name" required value={form.primary_name} onChange={e => setForm({ ...form, primary_name: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="contact number" required value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Date of birth" type="date" required value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Primary email" type="email" value={form.primary_email} onChange={e => setForm({ ...form, primary_email: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Spouse name" value={form.spouse_name} onChange={e => setForm({ ...form, spouse_name: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Spouse email" type="email" value={form.spouse_email} onChange={e => setForm({ ...form, spouse_email: e.target.value })} />
          <input className="w-full border p-2 rounded" placeholder="Profile image URL" value={form.profile_pic_url} onChange={e => setForm({ ...form, profile_pic_url: e.target.value })} />

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded flex-1">{isSubmitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}