"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, getStatesByCountry, getCitiesByCountry } from '../lib/locations';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    primary_name: '',
    primary_email: '',
    gender: '',
    spouse_name: '',
    spouse_email: '',
    spouse_contact: '',
    contact: '',
    dob: '',
    address: '',
    country: '',
    state: '',
    city: '',
    pin: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const email = localStorage.getItem('user_email');
    if (email) {
      router.replace('/profile');
    }
  }, [router]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.primary_email) {
      setError('Primary email is mandatory.');
      return;
    }

    if (form.pin.length !== 4) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pin: parseInt(form.pin, 10) }),
      });

      if (!res.ok) {
        throw new Error('Unable to create profile');
      }

      const data = await res.json();
      localStorage.setItem('user_email', form.primary_email);
      // Directly redirect to profile after successful registration
      router.push('/profile');
    } catch (err) {
      setError('Could not create profile. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full border border-slate-200 bg-slate-50/50 p-3.5 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all";
  const labelStyle = "text-xs font-bold text-slate-500 ml-1 mb-1 block";

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
        <div className="w-full max-w-xl bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-indigo-100 border border-slate-100">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Your Profile</h1>
            <p className="text-slate-500 mt-2">Join the digital home of the Boorlagadda family.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Full Name *</label>
                  <input className={inputStyle} placeholder="Your name" value={form.primary_name} onChange={(e) => setForm({ ...form, primary_name: e.target.value })} required />
                </div>
                <div>
                  <label className={labelStyle}>Contact Number *</label>
                  <input className={inputStyle} placeholder="Phone number" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelStyle}>Date of Birth *</label>
                  <input type="date" className={inputStyle} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
                </div>
                <div>
                  <label className={labelStyle}>Primary Email *</label>
                  <input type="email" className={inputStyle} placeholder="Email address" value={form.primary_email} onChange={(e) => setForm({ ...form, primary_email: e.target.value })} required />
                </div>
                <div>
                  <label className={labelStyle}>Gender *</label>
                  <select className={inputStyle} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Security PIN *</label>
                <input type="password" inputMode="numeric" maxLength={4} className={inputStyle} placeholder="Create a 4-digit login PIN" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} required />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Spouse Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <input className={`${inputStyle} bg-white`} placeholder="Spouse Name" value={form.spouse_name} onChange={(e) => setForm({ ...form, spouse_name: e.target.value })} />
                <input className={`${inputStyle} bg-white`} placeholder="Spouse Contact" value={form.spouse_contact} onChange={(e) => setForm({ ...form, spouse_contact: e.target.value })} />
                <input type="email" className={`${inputStyle} bg-white`} placeholder="Spouse Email" value={(form as any).spouse_email || ''} onChange={(e) => setForm({ ...form, spouse_email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select className={inputStyle} value={form.country} onChange={(e) => handleCountryChange(e.target.value)}>
                  <option value="">Select Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {form.country && states.length > 0 && (
                  <select className={inputStyle} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                    <option value="">Select State</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.country && cities.length > 0 && (
                  <select className={inputStyle} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                <input className={inputStyle} placeholder="Full Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>

            {error && <p className="text-rose-600 text-sm font-medium bg-rose-50 p-4 rounded-2xl border border-rose-100">{error}</p>}

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Setting things up...
                  </span>
                ) : 'Complete Registration'}
              </button>
              <button 
                type="button" 
                onClick={() => router.push('/login')} 
                className="text-slate-500 font-bold text-sm hover:text-slate-700 transition"
              >
                Already have a profile? Login here
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
