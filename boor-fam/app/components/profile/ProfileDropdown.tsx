import { useEffect, useRef, useState } from "react";

export default function ProfileDropdown({
  userName,
  userEmail,
  onEditProfile,
  onEditPin,
  onLogout,
}: {
  userName: string;
  userEmail: string;
  onEditProfile: () => void;
  onEditPin: () => void;
  onLogout: () => void;
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
        className="text-left cursor-pointer flex items-center gap-3 hover:opacity-80 transition"
        onClick={() => setOpen(o => !o)}
      >
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
          {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg> */}
          {userName.split(' ').map(n => n[0]).join('').slice(0,2)}
        </div>
        <div className="text-xs sm:text-sm">
          <div className="font-semibold text-slate-900">{userName}</div>
          <div className="text-xs text-slate-500">{userEmail}</div>
        </div>
        {/* Modern arrow heads only */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-slate-400 transition-transform ml-auto ${open ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEditProfile();
            }}
            className="w-full flex items-center gap-3 text-left rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-indigo-50 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div>
              <div className="font-semibold">Edit Profile</div>
              <div className="text-xs text-slate-500">Update your information</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEditPin();
            }}
            className="w-full flex items-center gap-3 text-left rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-blue-50 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <div className="font-semibold">Edit Login PIN</div>
              <div className="text-xs text-slate-500">Change your security PIN</div>
            </div>
          </button>

          <div className="h-px bg-slate-200 my-2"></div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 text-left rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <div>
              <div className="font-semibold">Logout</div>
              <div className="text-xs text-slate-500">Sign out of your account</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

