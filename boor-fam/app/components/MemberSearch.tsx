'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface PathStep {
  personName: string;   // the person at this node
  edgeLabel: string;    // label on the arrow TO the next node
}

// ── Helpers ──────────────────────────────────────────────────────────────
function getAncestorPath(id: number, users: any[]): any[] {
  const path: any[] = [];
  let curr = users.find(u => u.id === id);
  while (curr) {
    path.push(curr);
    curr = curr.parent_id ? users.find(u => u.id === curr.parent_id) : null;
  }
  return path;
}

function childLabel(child: any): string {
  const g = (child?.gender || '').toLowerCase();
  if (g === 'male')   return 'son of';
  if (g === 'female') return 'daughter of';
  return 'child of';
}

function parentLabel(parent: any): string {
  const g = (parent?.gender || '').toLowerCase();
  if (g === 'male')   return 'father of';
  if (g === 'female') return 'mother of';
  return 'parent of';
}

function genderize(u: any, male: string, female: string, other: string): string {
  const g = (u?.gender || '').toLowerCase();
  if (g === 'male')   return male;
  if (g === 'female') return female;
  return other;
}

function computeRelAndPath(viewerId: number, targetId: number, users: any[]): {
  label: string;
  steps: PathStep[];
} {
  if (viewerId === targetId) return { label: 'Yourself', steps: [] };

  const path1 = getAncestorPath(viewerId, users);
  const path2 = getAncestorPath(targetId, users);

  let lcaIdx1 = -1, lcaIdx2 = -1;
  for (let i = 0; i < path1.length; i++) {
    const j = path2.findIndex(p => p.id === path1[i].id);
    if (j !== -1) { lcaIdx1 = i; lcaIdx2 = j; break; }
  }

  if (lcaIdx1 === -1) return { label: 'No direct relation found', steps: [] };

  const lca      = path1[lcaIdx1];
  const viewer   = path1[0];
  const target   = path2[0];
  const d1       = lcaIdx1;
  const d2       = lcaIdx2;
  const delta    = Math.abs(d1 - d2);
  const highDepth = Math.min(d1, d2);
  const isTargetHigher = d1 > d2;
  const pathHigh = isTargetHigher ? path2 : path1;
  const pathLow  = isTargetHigher ? path1 : path2;
  const targetGender = (target.gender || '').toLowerCase();
  const viewerGender  = (viewer.gender || '').toLowerCase();

  const checkLineage = () => {
    if (highDepth === 0) return { isParallel: true, isCross: false };
    const aHigh = pathHigh[highDepth - 1];
    const aLow  = pathLow[Math.max(d1, d2) - 1];
    const gH = (aHigh?.gender || '').toLowerCase();
    const gL = (aLow?.gender  || '').toLowerCase();
    return { isParallel: gH === gL && gH !== '', isCross: gH !== gL && gH !== '' && gL !== '' };
  };

  // Helper: build "Muni-" prefix string for (delta - 2) extra generations beyond grandparent/grandchild
  const muniPrefix = (extraGens: number) => 'Muni-'.repeat(Math.max(0, extraGens));

  let label = '';
  if (delta >= 2) {
    if (isTargetHigher) {
      label = targetGender === 'male' ? 'Thathayya'
            : targetGender === 'female'
              ? ((pathLow[Math.max(d1,d2)-1]?.gender||'').toLowerCase() === 'male' ? 'Nanamma' : 'Ammamma')
              : 'Grandparent';
      if (highDepth === 0 && delta > 2) label = muniPrefix(delta - 2) + label;
    } else {
      label = genderize(target, 'Manavadu', 'Manavaraalu', 'Grandchild');
      if (highDepth === 0 && delta > 2) label = muniPrefix(delta - 2) + label;
    }
  } else if (delta === 1) {
    if (highDepth === 0) {
      label = isTargetHigher
        ? genderize(target, 'Nana', 'Amma', 'Parent')
        : genderize(target, 'Koduku', 'Kuthuru', 'Child');
    } else {
      const { isParallel, isCross } = checkLineage();
      if (isTargetHigher) {
        label = isParallel ? genderize(target, 'Peddanana/Babai', 'Peddamma/Pinni', 'Aunt/Uncle')
              : isCross    ? genderize(target, 'Mavayya', 'Atta', 'Aunt/Uncle')
              :               genderize(target, 'Uncle', 'Aunt', 'Aunt/Uncle');
      } else {
        // Niece/Nephew: prefix comes from the parent's gender (the sibling/cousin), not viewer's gender
        const parentOfTarget = pathLow[highDepth - 1]; // the person one step above target on their path
        const parentGender = (parentOfTarget?.gender || '').toLowerCase();
        label = isParallel ? `${parentGender === 'male' ? 'Anna/Thammudu' : 'Akka/Chelli'} ${genderize(target,'Koduku','Kuthuru','Child')}`
              : isCross    ? genderize(target, 'Alludu', 'Kodalu', 'Niece/Nephew')
              :               genderize(target, 'Nephew', 'Niece', 'Niece/Nephew');
      }
    }
  } else {
    if (highDepth === 1) {
      label = genderize(target, 'Annayya/Thammudu', 'Akka/Chelli', 'Sibling');
    } else {
      const { isParallel, isCross } = checkLineage();
      const degree = highDepth - 1;
      const ordinal = (n: number) => { const s=['th','st','nd','rd'],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
      let base = 'Cousin';
      if (isParallel) base = genderize(target, 'Annayya/Thammudu', 'Akka/Chelli', 'Cousin');
      else if (isCross) base = genderize(target, 'Bava/Mardi', 'Vadina/Mardalu', 'Cousin');
      label = degree === 1 ? base : `${ordinal(degree)} ${base}`;
    }
  }

  const steps: PathStep[] = [];
  for (let i = 0; i < d1; i++) {
    steps.push({
      personName: path1[i].primary_name,
      edgeLabel: childLabel(path1[i]),
    });
  }
  for (let i = d2; i > 0; i--) {
    const ancestor = path2[i];
    steps.push({
      personName: ancestor.primary_name,
      edgeLabel: parentLabel(ancestor),
    });
  }
  steps.push({
    personName: target.primary_name,
    edgeLabel: '',
  });

  return { label, steps };
}

function formatDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(m[3])} ${months[parseInt(m[2])-1]} ${m[1]}`;
}

// ── Descendant helpers ────────────────────────────────────────────────────
interface DescendantInfo {
  children: any[];
  totalDescendants: number;
  generations: number;
}

function getDescendantInfo(userId: number, users: any[]): DescendantInfo {
  const directChildren = users.filter(u => u.parent_id === userId);
  
  function countBelow(id: number, depth: number): { count: number; maxDepth: number } {
    const kids = users.filter(u => u.parent_id === id);
    if (kids.length === 0) return { count: 0, maxDepth: depth };
    let total = kids.length;
    let maxD = depth + 1;
    for (const k of kids) {
      const sub = countBelow(k.id, depth + 1);
      total += sub.count;
      if (sub.maxDepth > maxD) maxD = sub.maxDepth;
    }
    return { count: total, maxDepth: maxD };
  }

  const { count, maxDepth } = countBelow(userId, 0);
  return {
    children: directChildren,
    totalDescendants: count,
    generations: directChildren.length > 0 ? maxDepth : 0,
  };
}

// ── Component ─────────────────────────────────────────────────────────────
interface MemberSearchProps {
  allUsers: any[];
  session: any;
  onNavigateToUser?: (userId: number) => void;
}

export default function MemberSearch({ allUsers, session, onNavigateToUser }: MemberSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [result, setResult] = useState<{ label: string; steps: PathStep[] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allUsers.slice(0, 10);
    const q = query.toLowerCase();
    return allUsers.filter((u: any) =>
      u.primary_name?.toLowerCase().includes(q) ||
      u.spouse_name?.toLowerCase().includes(q) ||
      u.primary_email?.toLowerCase().includes(q) ||
      u.contact?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, allUsers]);

  const handleSelect = (u: any) => {
    setSelected(u);
    setQuery(u.primary_name);
    setOpen(false);
    if (session) {
      setResult(computeRelAndPath(session.id, u.id, allUsers));
    }
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setResult(null);
    setOpen(false);
  };

  const handleNavigateToTree = () => {
    if (selected && onNavigateToUser) {
      onNavigateToUser(selected.id);
    }
  };

  const descendantInfo = useMemo(() => {
    if (!selected) return null;
    return getDescendantInfo(selected.id, allUsers);
  }, [selected, allUsers]);

  return (
    <div className="rounded-lg sm:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 mb-6 sm:mb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600">Member Search</h2>
          <p className="text-xs text-slate-400 mt-0.5">Search by name, spouse, email or contact</p>
        </div>
      </div>

      {/* Combo: trigger button + search input + dropdown */}
      <div ref={containerRef} className="relative mb-4">
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 text-sm hover:border-indigo-300 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {selected ? (
                <span className="text-slate-900 font-medium truncate">{selected.primary_name}</span>
              ) : (
                <span className="text-slate-400">Select or search a member…</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {selected && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); handleClear(); }}
                  onKeyDown={e => e.key === 'Enter' && handleClear()}
                  className="text-slate-300 hover:text-slate-500 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        )}

        {open && (
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type name, email, contact…"
              className="w-full pl-11 pr-10 py-3 border-2 border-indigo-400 rounded-2xl text-sm outline-none bg-white shadow-sm"
            />
            <button
              onClick={() => { setOpen(false); if (!selected) setQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {open && (
          <div className="absolute top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No members found</div>
            ) : (
              <>
                {!query.trim() && (
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All members</p>
                  </div>
                )}
                {filtered.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition border-b border-slate-100 last:border-0"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {u.primary_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{u.primary_name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {[u.contact, u.city && `${u.city}, ${u.country}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Result: full detail card + relationship + path */}
      {selected && result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">

          {/* Full detail card — clickable to navigate to tree */}
          <div
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            onClick={handleNavigateToTree}
            title="Click to locate in family tree"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-bold flex-shrink-0">
                {selected.primary_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-bold text-slate-900">{selected.primary_name}</p>
                  {onNavigateToUser && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 group-hover:bg-indigo-100 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Find in tree ↓
                    </span>
                  )}
                </div>
                {selected.gender && <p className="text-xs text-slate-400">{selected.gender}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {selected.dob && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Date of Birth</span>
                  <span className="text-slate-700">{formatDate(selected.dob)}</span>
                </div>
              )}
              {selected.primary_email && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Email</span>
                  <span className="text-slate-700 break-all">{selected.primary_email}</span>
                </div>
              )}
              {selected.contact && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Contact</span>
                  <span className="text-slate-700">{selected.contact}</span>
                </div>
              )}
              {selected.address && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Address</span>
                  <span className="text-slate-700">{selected.address}</span>
                </div>
              )}
              {(selected.city || selected.country) && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Lives in</span>
                  <span className="text-slate-700">{[selected.city, selected.state, selected.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {selected.anniversary && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Anniversary</span>
                  <span className="text-slate-700">{formatDate(selected.anniversary)}</span>
                </div>
              )}
            </div>

            {/* Spouse section */}
            {selected.spouse_name && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Spouse</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Name</span>
                    <span className="text-slate-700">{selected.spouse_name}</span>
                  </div>
                  {selected.spouse_contact && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Contact</span>
                      <span className="text-slate-700">{selected.spouse_contact}</span>
                    </div>
                  )}
                  {selected.spouse_email && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 font-semibold w-24 flex-shrink-0">Email</span>
                      <span className="text-slate-700 break-all">{selected.spouse_email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Descendants summary — minimalistic pill/stat display */}
          {descendantInfo && descendantInfo.children.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Family Below</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Stats row */}
                <div className="flex items-center gap-1.5 bg-white border border-amber-100 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-base">👶</span>
                  <span className="text-xs font-bold text-slate-700">{descendantInfo.children.length}</span>
                  <span className="text-[10px] text-slate-400">{descendantInfo.children.length === 1 ? 'child' : 'children'}</span>
                </div>
                {descendantInfo.totalDescendants > descendantInfo.children.length && (
                  <div className="flex items-center gap-1.5 bg-white border border-amber-100 rounded-xl px-3 py-1.5 shadow-sm">
                    <span className="text-base">🌳</span>
                    <span className="text-xs font-bold text-slate-700">{descendantInfo.totalDescendants}</span>
                    <span className="text-[10px] text-slate-400">total descendants</span>
                  </div>
                )}
                {descendantInfo.generations > 1 && (
                  <div className="flex items-center gap-1.5 bg-white border border-amber-100 rounded-xl px-3 py-1.5 shadow-sm">
                    <span className="text-base">📍</span>
                    <span className="text-xs font-bold text-slate-700">{descendantInfo.generations}</span>
                    <span className="text-[10px] text-slate-400">generations deep</span>
                  </div>
                )}
              </div>
              {/* Children names as pills */}
              <div className="flex flex-wrap gap-1.5">
                {descendantInfo.children.map((child: any) => (
                  <span
                    key={child.id}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-full px-2.5 py-1"
                  >
                    <span className="text-[9px]">{(child.gender || '').toLowerCase() === 'female' ? '♀' : '♂'}</span>
                    {child.primary_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Relationship */}
          {session && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Your Relationship</p>
              <p className="text-sm font-bold text-indigo-800 mb-4">
                {selected.primary_name} is your{' '}
                <span className="text-indigo-600">{result.label}</span>
              </p>

              {result.steps.length > 0 && (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">How you're connected</p>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-center min-w-max gap-0">
                      {result.steps.map((step, i) => {
                        const isFirst  = i === 0;
                        const isLast   = i === result.steps.length - 1;
                        const isViewer = isFirst;
                        return (
                          <div key={i} className="flex items-center gap-0">
                            <div className="flex flex-col items-center">
                              <div className={`text-[10px] font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-sm text-center min-w-[80px]
                                ${isViewer
                                  ? 'bg-indigo-600 text-white'
                                  : isLast
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700'
                                }`}>
                                {step.personName}
                                {isViewer && <div className="text-[8px] opacity-70 font-normal">You</div>}
                                {isLast   && <div className="text-[8px] opacity-80 font-normal">{result.label}</div>}
                              </div>
                            </div>

                            {step.edgeLabel && (
                              <div className="flex flex-col items-center mx-2 flex-shrink-0">
                                <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap mb-1">
                                  {step.edgeLabel}
                                </span>
                                <div className="flex items-center">
                                  <div className="h-px w-6 bg-slate-300" />
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400 -ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}