import { useState, useEffect } from 'react';
import { COUNTRIES, getStatesByCountry, getCitiesByCountry } from '../lib/locations';
import { authFetch } from '../lib/authFetch';

interface AddModalProps {
  onClose: () => void;
  onRefresh: () => void;
  parentId?: number | string | null;
  mode?: 'add-new' | 'add-self';
  currentUser?: Record<string, any> | null;
}

export default function AddModal({ onClose, onRefresh, parentId = null, mode = 'add-new', currentUser }: AddModalProps) {
  const blankForm = {
    primary_name: '',
    spouse_name: '',
    primary_email: '',
    spouse_email: '',
    spouse_contact: '',
    contact: '',
    dob: '',
    gender: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pin: '',
    parent_id: parentId,
    deceased_primary: false,
    deceased_spouse: false,
    anniversary: '',
  };

  const selfForm = mode === 'add-self' && currentUser ? {
    primary_name: currentUser.primary_name || '',
    spouse_name: currentUser.spouse_name || '',
    primary_email: currentUser.primary_email || '',
    spouse_email: currentUser.spouse_email || '',
    contact: currentUser.contact || '',
    spouse_contact: currentUser.spouse_contact || '',
    dob: currentUser.dob || '',
    gender: currentUser.gender || '',
    address: currentUser.address || '',
    country: currentUser.country || '',
    state: currentUser.state || '',
    city: currentUser.city || '',
    pin: currentUser.pin ? currentUser.pin.toString() : '',
    parent_id: parentId,
    deceased_primary: false,
    deceased_spouse: false,
    anniversary: currentUser.anniversary || '',
  } : null;

  const initialForm = selfForm ?? blankForm;

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityValue, setCustomCityValue] = useState('');

  const [existingUser, setExistingUser] = useState<Record<string, any> | null>(null);
  const [showExistingWarning, setShowExistingWarning] = useState(false);

  useEffect(() => {
    if (form.country) {
      setStates(getStatesByCountry(form.country));
      const fetchedCities = getCitiesByCountry(form.country);
      setCities(fetchedCities);
      const isCustom = form.city && !fetchedCities.includes(form.city);
      setShowCustomCityInput(!!isCustom);
      setCustomCityValue(isCustom ? form.city : '');
    } else {
      setStates([]); setCities([]); setShowCustomCityInput(false); setCustomCityValue('');
    }
  }, [form.country, form.state]);

  useEffect(() => {
    if (existingUser) {
      setForm(prev => ({
        ...prev,
        primary_name: existingUser.primary_name || '',
        spouse_name: existingUser.spouse_name || '',
        primary_email: existingUser.primary_email || '',
        spouse_email: existingUser.spouse_email || '',
        contact: existingUser.contact || '',
        spouse_contact: existingUser.spouse_contact || '',
        dob: existingUser.dob || '',
        gender: existingUser.gender || '',
        address: existingUser.address || '',
        country: existingUser.country || '',
        state: existingUser.state || '',
        city: existingUser.city || '',
        anniversary: existingUser.anniversary || '',
      }));
    }
  }, [existingUser]);

  const handleCountryChange = (country: string) => setForm({ ...form, country, state: '', city: '' });

  const handleAddExistingToTree = async () => {
    if (!existingUser) return;
    setIsSubmitting(true); setError('');
    try {
      const res = await authFetch('/api/tree/add-to-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: existingUser.id, parent_id: parentId }),
      });
      if (!res.ok) throw new Error(await res.text() || 'Failed to add to tree');
      onRefresh(); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding member');
    } finally { setIsSubmitting(false); }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (showExistingWarning && existingUser) { await handleAddExistingToTree(); return; }
    if (!form.primary_email) { setError('Primary email is mandatory.'); return; }
    if (form.pin.length !== 4) { setError('PIN must be exactly 4 digits.'); return; }

    const finalForm = { ...form };
    if (showCustomCityInput) {
      if (!customCityValue.trim()) { setError('Custom city cannot be empty.'); return; }
      finalForm.city = customCityValue.trim();
    }

    setIsSubmitting(true); setError('');

    try {
      if (mode === 'add-self' && currentUser) {
        const res = await authFetch('/api/tree/add-to-tree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id, parent_id: parentId }),
        });
        if (!res.ok) throw new Error(await res.text() || 'Failed to add to tree');
      } else {
        const pinDigits = finalForm.pin?.toString().replace(/\D/g, '') ?? '';
        const res = await authFetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...finalForm,
            pin: Number(pinDigits),
            anniversary: finalForm.anniversary || null,
          }),
        });

        if (res.status === 409) {
          const data = await res.json();
          if (data.alreadyExists && data.existingUser) {
            setExistingUser(data.existingUser); setShowExistingWarning(true); setIsSubmitting(false); return;
          }
        }

        if (!res.ok) throw new Error(await res.text() || 'Failed to add user');
      }

      onRefresh(); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding member');
    } finally { setIsSubmitting(false); }
  };

  const isLocked = showExistingWarning && !!existingUser;
  const hasSpouse = !!form.spouse_name?.trim();

  const inputClass = "w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50 disabled:opacity-70 disabled:cursor-not-allowed";
  const spouseInputClass = "w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10" title="Close">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{mode === 'add-self' ? 'Join the Tree' : 'New Member'}</h2>
          <p className="text-sm text-slate-500 mt-1">Fill in the details to expand our family connections.</p>
        </div>

        {showExistingWarning && existingUser && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">User already exists</p>
                <p className="text-xs text-amber-700 mt-0.5">A profile for <span className="font-semibold">{existingUser.primary_name}</span> with this email is already registered. Click <span className="font-semibold">"Add to Tree"</span> to place them without creating a duplicate.</p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-rose-600 text-sm mb-4 p-3 bg-rose-50 rounded-xl border border-rose-100 font-medium">{error}</p>}

        <form onSubmit={submit} className="space-y-4">

          {/* Full name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Full Name *</label>
            <input className={inputClass} placeholder="e.g. Satynarana Boorlagadda" required readOnly={mode === 'add-self' || isLocked} disabled={isLocked} value={form.primary_name} onChange={e => setForm({ ...form, primary_name: e.target.value })} />
          </div>

          {/* Contact / DOB / Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Contact *</label>
              <input className={inputClass} placeholder="Contact" required readOnly={mode === 'add-self' || isLocked} disabled={isLocked} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Date of Birth *</label>
              <input className={inputClass} type="date" required readOnly={mode === 'add-self' || isLocked} disabled={isLocked} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Gender *</label>
              <select className={inputClass} required disabled={mode === 'add-self' || isLocked} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Primary Email *</label>
            <input className={inputClass} placeholder="email@example.com" type="email" required readOnly={mode === 'add-self' || isLocked} disabled={isLocked} value={form.primary_email} onChange={e => setForm({ ...form, primary_email: e.target.value })} />
          </div>

          {/* PIN */}
          {!isLocked && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Security PIN *</label>
              <input className={inputClass} type="password" inputMode="numeric" maxLength={4} placeholder="4-digit PIN" required={!isLocked} readOnly={mode === 'add-self'} value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} />
            </div>
          )}

          {/* ── Spouse section ── */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spouse Details (Optional)</p>

            <input className={spouseInputClass} placeholder="Spouse Name" disabled={isLocked} value={form.spouse_name} onChange={e => setForm({ ...form, spouse_name: e.target.value })} />
            <input className={spouseInputClass} placeholder="Spouse Contact Number" disabled={isLocked} value={form.spouse_contact} onChange={e => setForm({ ...form, spouse_contact: e.target.value })} />
            <input className={spouseInputClass} placeholder="Spouse Email" type="email" disabled={isLocked} value={form.spouse_email} onChange={e => setForm({ ...form, spouse_email: e.target.value })} />

            {/* Anniversary — only shown once spouse name is entered */}
            {hasSpouse && (
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                  <span>💍</span> Anniversary Date
                  <span className="text-[10px] font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="date"
                  className={spouseInputClass}
                  disabled={isLocked}
                  value={form.anniversary}
                  onChange={e => setForm({ ...form, anniversary: e.target.value })}
                />
              </div>
            )}

            {/* Deceased checkboxes */}
            {mode !== 'add-self' && !isLocked && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Deceased</p>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={!!form.deceased_primary} onChange={e => setForm({ ...form, deceased_primary: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400 cursor-pointer" />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition">
                    {form.primary_name?.trim() ? <><span className="font-semibold text-slate-800">{form.primary_name}</span> is deceased</> : 'Primary member is deceased'}
                  </span>
                </label>
                {hasSpouse && (
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={!!form.deceased_spouse} onChange={e => setForm({ ...form, deceased_spouse: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400 cursor-pointer" />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition">
                      <span className="font-semibold text-slate-800">{form.spouse_name}</span> is deceased
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Living In</p>
            <select className={`${inputClass} disabled:opacity-70`} value={form.country} disabled={isLocked} onChange={e => handleCountryChange(e.target.value)}>
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.country && (
              <select className={`${inputClass} disabled:opacity-70`} value={form.state} disabled={isLocked} onChange={e => setForm({ ...form, state: e.target.value, city: '' })}>
                <option value="">Select State/Province</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {form.country && form.state && !isLocked && (
              <select className={inputClass} value={showCustomCityInput ? 'other' : form.city} onChange={e => {
                if (e.target.value === 'other') { setShowCustomCityInput(true); setForm({ ...form, city: '' }); }
                else { setShowCustomCityInput(false); setCustomCityValue(''); setForm({ ...form, city: e.target.value }); }
              }}>
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="other">Other / Not Listed</option>
              </select>
            )}
            {form.country && form.state && isLocked && (
              <input className={`${inputClass} opacity-70 cursor-not-allowed`} value={form.city} readOnly />
            )}
            {showCustomCityInput && !isLocked && (
              <input type="text" className="w-full border border-indigo-200 p-3 rounded-2xl text-sm bg-indigo-50/30 focus:ring-2 focus:ring-indigo-500 outline-none animate-in slide-in-from-top-1" placeholder="Specify City/Town/Village" value={customCityValue} onChange={e => setCustomCityValue(e.target.value)} required />
            )}
          </div>

          <div className="flex gap-3 mt-8">
            {showExistingWarning && (
              <button type="button" onClick={() => { setShowExistingWarning(false); setExistingUser(null); setForm(initialForm); }} className="flex-1 bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95">
                Go Back
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
              {isSubmitting ? 'Processing...' : isLocked ? 'Add to Tree' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}