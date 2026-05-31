import { useEffect, useState } from 'react';
import { COUNTRIES, getStatesByCountry, getCitiesByCountry } from '../lib/locations';

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
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityValue, setCustomCityValue] = useState('');

  const normalizeDob = (value: string | undefined) => {
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
  };

  useEffect(() => {
    const data = initialData || {};
    setForm({ ...data, dob: normalizeDob(data.dob) });
    setError('');

    if (data.country) {
      const fetchedStates = getStatesByCountry(data.country);
      const fetchedCities = getCitiesByCountry(data.country);
      setStates(fetchedStates);
      setCities(fetchedCities);

      // Detect if the user has a custom city not present in the standard location list
      const isCustom = data.city && !fetchedCities.includes(data.city);
      setShowCustomCityInput(!!isCustom);
      setCustomCityValue(isCustom ? data.city : '');
    } else {
      setStates([]);
      setCities([]);
      setShowCustomCityInput(false);
      setCustomCityValue('');
    }
  }, [initialData]);

  const handleCountryChange = (country: string) => {
    setForm({ ...form, country, state: '', city: '' });
    setStates(getStatesByCountry(country));
    setCities(getCitiesByCountry(country));
    setShowCustomCityInput(false);
    setCustomCityValue('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === 'view') return;
    
    setError('');
    setIsSaving(true);

    try {
      // Validate primary email
      if (!form.primary_email) {
        setError('Primary email is mandatory.');
        setIsSaving(false);
        return;
      }

      if (form.pin && form.pin.toString().length !== 4) {
        setError('PIN must be exactly 4 digits.');
        setIsSaving(false);
        return;
      }

      // Use custom city value if enabled
      const finalForm = { ...form };
      if (showCustomCityInput) {
        if (!customCityValue.trim()) {
          setError('Custom city cannot be empty.');
          setIsSaving(false);
          return;
        }
        finalForm.city = customCityValue.trim();
      }

      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...finalForm, pin: parseInt(finalForm.pin, 10) }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error || data?.message || 'Unable to save changes');
        return;
      }

      if (mode === 'edit' && finalForm?.id) {
        const stored = localStorage.getItem('user_session');
        const currentSession = stored ? JSON.parse(stored) : null;
        if (currentSession?.id === finalForm.id) {
          // Exclude PIN when updating session storage
          const { pin: _, ...sessionUpdate } = finalForm;
          localStorage.setItem('user_session', JSON.stringify({ ...currentSession, ...sessionUpdate }));
        }
      }

      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!form?.id) return;
    if (!confirm('Remove this person from the family tree? They will stay in the database and can be added back later if needed.')) return;

    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id }),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setError(data?.error || data?.message || 'Unable to delete user.');
        } else {
          const text = await res.text();
          setError(text || 'An unexpected error occurred while trying to delete the user.');
        }
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

  const inputStyle = `w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${mode === 'view' ? 'bg-slate-100 cursor-not-allowed text-slate-600' : 'bg-slate-50/50'}`;
  const labelStyle = "text-xs font-bold text-slate-500 ml-1";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-600">
            {mode === 'view' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{mode === 'edit' ? 'Edit Details' : mode === 'add' ? 'Add User' : 'Profile View'}</h2>
          <p className="text-sm text-slate-500 mt-1">{mode === 'view' ? 'Reviewing family member information.' : 'Update information to keep the tree accurate.'}</p>
        </div>

        {error && <p className="text-rose-600 text-sm mb-6 p-3 bg-rose-50 rounded-xl border border-rose-100 font-medium">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className={labelStyle}>Full Name *</label>
              <input className={inputStyle} readOnly={mode === 'view'} placeholder="e.g. Satyanarayana Boorlagadda" value={form.primary_name || ''} onChange={e => setForm({ ...form, primary_name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyle}>Contact Number *</label>
                <input className={inputStyle} readOnly={mode === 'view'} placeholder="Contact" value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Date of Birth *</label>
                <input className={inputStyle} readOnly={mode === 'view'} type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelStyle}>Primary Email *</label>
              <input className={inputStyle} readOnly={mode === 'view'} placeholder="email@example.com" type="email" value={form.primary_email || ''} onChange={e => setForm({ ...form, primary_email: e.target.value })} required />
            </div>

            {/* <div className="space-y-1">
              <label className={labelStyle}>Security PIN *</label>
              <input className={inputStyle} type="password" inputMode="numeric" maxLength={4} readOnly={mode === 'view'} placeholder="4-digit PIN" value={form.pin || ''} onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} required />
            </div> */}

            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Spouse Details (Optional)</p>
              <input className={`${inputStyle.replace('bg-slate-50/50', 'bg-white')} p-2.5`} readOnly={mode === 'view'} placeholder="Spouse Name" value={form.spouse_name || ''} onChange={e => setForm({ ...form, spouse_name: e.target.value })} />
              <input className={`${inputStyle.replace('bg-slate-50/50', 'bg-white')} p-2.5`} readOnly={mode === 'view'} placeholder="Spouse Contact Number" value={form.spouse_contact || ''} onChange={e => setForm({ ...form, spouse_contact: e.target.value })} />
              <input className={`${inputStyle.replace('bg-slate-50/50', 'bg-white')} p-2.5`} readOnly={mode === 'view'} placeholder="Spouse Email" type="email" value={form.spouse_email || ''} onChange={e => setForm({ ...form, spouse_email: e.target.value })} />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Living In</p>
            <select disabled={mode === 'view'} className={inputStyle} value={form.country || ''} onChange={e => handleCountryChange(e.target.value)}>
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {form.country && states.length > 0 && (
              <select disabled={mode === 'view'} className={inputStyle} value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })}>
                <option value="">Select State/Province</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {form.country && (
              <select 
                disabled={mode === 'view'} 
                className={inputStyle} 
                value={showCustomCityInput ? 'other' : (form.city || '')} 
                onChange={e => {
                  if (e.target.value === 'other') {
                    setShowCustomCityInput(true);
                    setForm({ ...form, city: '' });
                  } else {
                    setShowCustomCityInput(false);
                    setCustomCityValue('');
                    setForm({ ...form, city: e.target.value });
                  }
                }}
              >
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                {(mode !== 'view' || showCustomCityInput) && <option value="other">Other / Not Listed</option>}
              </select>
            )}

            {showCustomCityInput && (
              <input className={`${inputStyle} border-indigo-200 bg-indigo-50/30 animate-in slide-in-from-top-1`} placeholder="Specify City/Town/Village" value={customCityValue} onChange={e => setCustomCityValue(e.target.value)} required readOnly={mode === 'view'} />
            )}

            <div className="space-y-1">
              <label className={labelStyle}>Full Address</label>
              <input className={inputStyle} readOnly={mode === 'view'} placeholder="House No, Street, Landmark" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {mode === 'view' ? (
              <>
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditRequested?.(); }} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Edit Profile</button>
                <button type="button" onClick={handleDelete} className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95">Delete</button>
              </>
            ) : (
              <>
                <button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={handleDelete} className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95">Delete</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}