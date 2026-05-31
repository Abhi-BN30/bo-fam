"use client";

import { useEffect, useState } from 'react';

export default function PinModal({
  isOpen,
  onClose,
  email,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: () => void;
}) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOldPin('');
    setNewPin('');
    setError('');
    setIsSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const oldPinNum = parseInt(oldPin, 10);
    const newPinNum = parseInt(newPin, 10);

    if (oldPin.length !== 4 || newPin.length !== 4) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    if (oldPinNum === newPinNum) {
      setError('New PIN must be different from old PIN.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/update-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          oldPin: oldPinNum,
          newPin: newPinNum,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.message || data?.error || 'Unable to update PIN');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update PIN');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] p-4">
      <div className="h-full flex items-center justify-center">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Login PIN</h2>
          <p className="text-sm text-slate-500 mt-1">Verify your old PIN, then set a new one.</p>
        </div>

        {error && (
          <p className="text-rose-600 text-sm mb-6 p-3 bg-rose-50 rounded-xl border border-rose-100 font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Old PIN *</label>
            <input
              inputMode="numeric"
              maxLength={4}
              className="w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50"
              placeholder="4-digit PIN"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">New PIN *</label>
            <input
              inputMode="numeric"
              maxLength={4}
              className="w-full border border-slate-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-slate-50/50"
              placeholder="4-digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Update PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
