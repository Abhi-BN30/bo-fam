"use client";

import { useEffect, useRef, useState } from "react";

interface User {
  id: number;
  primary_name: string;
  spouse_name?: string;
}

interface SearchableUserSelectProps {
  users: User[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  icon?: React.ReactNode;
}

export default function SearchableUserSelect({ users, value, onChange, label }: SearchableUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filtered = users.filter(u =>
    u.primary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.spouse_name && u.spouse_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selected = users.find(u => u.id === Number(value));

  return (
    <div ref={ref} className="relative flex-1 w-full">
      <label className="text-[10px] text-indigo-500 uppercase font-bold mb-2 block tracking-widest">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left text-sm bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between gap-2"
      >
        <span className={selected ? "text-slate-900 font-medium" : "text-slate-400 font-normal"}>
          {selected ? selected.primary_name : "Select someone…"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-72 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-slate-400">No results found</div>
            ) : (
              filtered.map(user => {
                const isSelected = value === String(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => { onChange(String(user.id)); setIsOpen(false); setSearchTerm(""); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2
                      ${isSelected
                        ? "bg-indigo-50 text-indigo-800 font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <span className="truncate">{user.primary_name}</span>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}