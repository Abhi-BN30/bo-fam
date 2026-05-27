import { useState, useEffect } from 'react';
import { COUNTRIES, getStatesByCountry, getCitiesByCountry } from '../lib/locations';

interface AddModalProps {
  onClose: () => void;
  onRefresh: () => void;
  parentId?: number | string | null;
  mode?: 'add-new' | 'add-self';
  currentUser?: Record<string, any> | null;
}

export default function AddModal({ onClose, onRefresh, parentId = null, mode = 'add-new', currentUser }: AddModalProps) {
  const initialForm = mode === 'add-self' && currentUser ? {
    primary_name: currentUser.primary_name || '',
    spouse_name: currentUser.spouse_name || '',
    primary_email: currentUser.primary_email || '',
    spouse_email: currentUser.spouse_email || '',
    contact: currentUser.contact || '',
    dob: currentUser.dob || '',
    address: currentUser.address || '',
    country: currentUser.country || '',
    state: currentUser.state || '',
    city: currentUser.city || '',
    parent_id: parentId
  } : {
    primary_name: '',
    spouse_name: '',
    primary_email: '',
    spouse_email: '',
    contact: '',
    dob: '',
    address: '',
    country: '',
    state: '',
    city: '',
    parent_id: parentId
  };

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (form.country) {
      setStates(getStatesByCountry(form.country));
      setCities(getCitiesByCountry(form.country));
    } else {
      setStates([]);
      setCities([]);
    }
  }, [form.country]);

  const handleCountryChange = (country: string) => {
    setForm({ ...form, country, state: '', city: '' });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'add-self' && currentUser) {
        // For Add Self: just add user to tree
        const res = await fetch('/api/tree/add-to-tree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            parent_id: parentId,
          }),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(error || 'Failed to add to tree');
        }
      } else {
        // For Add New: create new user
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(error || 'Failed to add user');
        }
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error adding member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full sm:w-96 max-h-[90vh] overflow-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4">{mode === 'add-self' ? 'Add Yourself to Tree' : 'Add Member'}</h2>
        {error && <p className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
        
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Full name"
            required
            readOnly={mode === 'add-self'}
            value={form.primary_name}
            onChange={e => setForm({ ...form, primary_name: e.target.value })}
          />
          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Contact number"
            required
            readOnly={mode === 'add-self'}
            value={form.contact}
            onChange={e => setForm({ ...form, contact: e.target.value })}
          />
          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Date of Birth"
            type="date"
            required
            readOnly={mode === 'add-self'}
            value={form.dob}
            onChange={e => setForm({ ...form, dob: e.target.value })}
          />
          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Primary email"
            type="email"
            readOnly={mode === 'add-self'}
            value={form.primary_email}
            onChange={e => setForm({ ...form, primary_email: e.target.value })}
          />
          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Spouse Name"
            value={form.spouse_name}
            onChange={e => setForm({ ...form, spouse_name: e.target.value })}
          />
          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Spouse email"
            type="email"
            value={form.spouse_email}
            onChange={e => setForm({ ...form, spouse_email: e.target.value })}
          />
          <input
            className="w-full border p-2 rounded text-sm"
            placeholder="Address"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
          
          {/* Location Section - Country, State, City */}
          <select
            className="w-full border p-2 rounded text-sm"
            value={form.country}
            onChange={e => handleCountryChange(e.target.value)}
          >
            <option value="">Select Country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {form.country && states.length > 0 && (
            <select
              className="w-full border p-2 rounded text-sm"
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
            >
              <option value="">Select State/Province</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {form.country && cities.length > 0 && (
            <select
              className="w-full border p-2 rounded text-sm"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
            >
              <option value="">Select City</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 px-3 sm:px-4 py-2 rounded text-sm font-medium hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded flex-1 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}