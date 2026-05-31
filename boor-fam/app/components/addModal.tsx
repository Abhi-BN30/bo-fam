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
    spouse_contact: currentUser.spouse_contact || '',
    dob: currentUser.dob || '',
    address: currentUser.address || '',
    country: currentUser.country || '',
    state: currentUser.state || '',
    city: currentUser.city || '',
    pin: currentUser.pin ? currentUser.pin.toString() : '',
    parent_id: parentId
  } : {
    primary_name: '',
    spouse_name: '',
    primary_email: '',
    spouse_email: '',
    spouse_contact: '',
    contact: '',
    dob: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pin: '',
    parent_id: parentId
  };

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityValue, setCustomCityValue] = useState('');

  useEffect(() => {
    if (form.country) {
      setStates(getStatesByCountry(form.country));
      const fetchedCities = getCitiesByCountry(form.country);
      setCities(fetchedCities);

      // Check if existing city (e.g. from currentUser in add-self mode) is a custom value
      const isCustom = form.city && !fetchedCities.includes(form.city);
      setShowCustomCityInput(!!isCustom);
      setCustomCityValue(isCustom ? form.city : '');
    } else {
      setStates([]);
      setCities([]);
      setShowCustomCityInput(false);
      setCustomCityValue('');
    }
  }, [form.country, form.state]);

  const handleCountryChange = (country: string) => {
    setForm({ ...form, country, state: '', city: '' });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate primary email
    if (!form.primary_email) {
      setError('Primary email is mandatory.');
      return;
    }

    if (form.pin.length !== 4) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    // Use custom city value if enabled
    const finalForm = { ...form };
    if (showCustomCityInput) {
      if (!customCityValue.trim()) {
        setError('Custom city cannot be empty.');
        return;
      }
      finalForm.city = customCityValue.trim();
    }


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
        const pinDigits = finalForm.pin?.toString().replace(/\D/g, '') ?? '';
        const parsedPin = Number(pinDigits);

        const res = await fetch('/api/users', { // Use finalForm for submission
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...finalForm,
            pin: parsedPin,
          }),
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{mode === 'add-self' ? 'Join the Tree' : 'New Member'}</h2>
          <p className="text-sm text-slate-500 mt-1">Fill in the details to expand our family connections.</p>
        </div>

        {error && <p className="text-rose-600 text-sm mb-6 p-3 bg-rose-50 rounded-xl border border-rose-100 font-medium">{error}</p>}
        
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Full Name *</label>
              <input className="w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50" placeholder="e.g. Satynarana Boorlagadda" required readOnly={mode === 'add-self'} value={form.primary_name} onChange={e => setForm({ ...form, primary_name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Contact Number *</label>
                <input className="w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50" placeholder="Contact" required readOnly={mode === 'add-self'} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Date of Birth *</label>
                <input className="w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50" type="date" required readOnly={mode === 'add-self'} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Primary Email *</label>
              <input className="w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50" placeholder="email@example.com" type="email" required readOnly={mode === 'add-self'} value={form.primary_email} onChange={e => setForm({ ...form, primary_email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Security PIN *</label>
              <input className="w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50" type="password" inputMode="numeric" maxLength={4} placeholder="4-digit PIN" required readOnly={mode === 'add-self'} value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Spouse Details (Optional)</p>
              <input className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" placeholder="Spouse Name" value={form.spouse_name} onChange={e => setForm({ ...form, spouse_name: e.target.value })} />
              <input className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" placeholder="Spouse Contact Number" value={form.spouse_contact} onChange={e => setForm({ ...form, spouse_contact: e.target.value })} />
              <input className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" placeholder="Spouse Email" type="email" value={form.spouse_email} onChange={e => setForm({ ...form, spouse_email: e.target.value })} />
            </div>
          </div>

          {/* Location Section - Country, State, City */}
          <div className="space-y-3 pt-2">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Living In</p>
             <select
               className="w-full border border-slate-200 p-3 rounded-2xl text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none"
               value={form.country}
               onChange={e => handleCountryChange(e.target.value)}
             >
               <option value="">Select Country</option>
               {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>

             {form.country && (
               <select
                 className="w-full border border-slate-200 p-3 rounded-2xl text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={form.state}
                 onChange={e => setForm({ ...form, state: e.target.value, city: '' })}
               >
                 <option value="">Select State/Province</option>
                 {states.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             )}

             {form.country && form.state && (
               <select
                 className="w-full border border-slate-200 p-3 rounded-2xl text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={showCustomCityInput ? 'other' : form.city}
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
                 <option value="other">Other / Not Listed</option>
               </select>
             )}

             {showCustomCityInput && (
               <input
                 type="text"
                 className="w-full border border-indigo-200 p-3 rounded-2xl text-sm bg-indigo-50/30 focus:ring-2 focus:ring-indigo-500 outline-none animate-in slide-in-from-top-1"
                 placeholder="Specify City/Town/Village"
                 value={customCityValue}
                 onChange={e => setCustomCityValue(e.target.value)}
                 required
               />
             )}
          </div>

          <div className="flex gap-3 mt-8">
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
              {isSubmitting ? 'Processing...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}