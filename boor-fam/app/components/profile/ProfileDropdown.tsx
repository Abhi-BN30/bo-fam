"use client";

import { useEffect, useRef, useState } from 'react';

export default function ProfileDropdown({
  userName,
  userEmail,
  onEditProfile,
  onEditPin,
}: {
  userName: string;
  userEmail: string;
  onEditProfile: () => void;
  onEditPin: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="text-left cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="text-xs sm:text-sm">
          <div className="font-semibold text-slate-900">{userName}</div>
          <div className="text-xs text-slate-500">{userEmail}</div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl p-2 z-50">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEditProfile();
            }}
            className="w-full text-left rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-indigo-50 transition"
          >
            Edit Profile
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEditPin();
            }}
            className="w-full text-left rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-indigo-50 transition"
          >
            Edit Login PIN
          </button>
        </div>
      )}
    </div>
  );
}

