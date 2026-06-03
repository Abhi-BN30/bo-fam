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

export default function SearchableUserSelect({
  users,
  value,
  onChange,
  label,
  icon,
}: SearchableUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredUsers = users.filter((user) =>
    user.primary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.spouse_name && user.spouse_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedUser = users.find((u) => u.id === Number(value));

  return (
    <div ref={ref} className="relative flex-1 w-full">
      <label className="text-[10px] text-indigo-500 uppercase font-bold mb-2 block flex items-center gap-2">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left text-xs sm:text-sm bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
      >
        <span className={selectedUser ? "text-slate-900 font-medium" : "text-slate-500"}>
          {selectedUser ? selectedUser.primary_name : "Select someone..."}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-slate-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 flex flex-col">
          {/* Search Bar */}
          <div className="sticky top-0 p-3 border-b border-slate-200 bg-white rounded-t-xl">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User List */}
          <div className="overflow-y-auto flex-1">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto mb-2 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zM5 20a3 3 0 01-3-3V7a3 3 0 013-3h1a6 6 0 016 6v1h6a3 3 0 013 3v2h-2v-2a1 1 0 00-1-1h-8V9a4 4 0 00-4-4H5a1 1 0 00-1 1v10a1 1 0 001 1h1.05A3.001 3.001 0 015 20z"
                  />
                </svg> */}
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onChange(String(user.id));
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full text-left px-4 py-3 text-xs sm:text-sm border-b border-slate-100 last:border-b-0 transition flex items-center gap-3 ${
                    value === String(user.id)
                      ? "bg-indigo-50 text-indigo-900 font-semibold"
                      : "text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.primary_name}</div>
                    {/* {user.spouse_name && (
                      <div className="text-xs text-slate-500 truncate">
                        & {user.spouse_name}
                      </div>
                    )} */}
                  </div>
                  {value === String(user.id) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
