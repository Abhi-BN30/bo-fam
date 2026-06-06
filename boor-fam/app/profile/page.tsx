"use client";
import { useEffect, useState } from 'react';
import { Great_Vibes, Cormorant_Garamond } from 'next/font/google';
import { useRouter } from 'next/navigation';
import FamilyTree, { TreeNode } from '../components/familyTree';
import AddModal from '../components/addModal';
import UserModal from '../components/userModal';
import ChoiceModal from '../components/choiceModal';
import SearchableUserSelect from '../components/SearchableUserSelect';
import { calculateGeneration, findAllRelationsAtGeneration, FlattenedNode } from '../lib/utils';
import ProfileDropdown from '../components/profile/ProfileDropdown';
import PinModal from '../components/profile/PinModal';

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: '400',
});


export default function Home() {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [treeRoots, setTreeRoots] = useState<TreeNode[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<'add-new' | 'add-self'>('add-new');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [selectedUser, setSelectedUser] = useState<Record<string, any> | null>(null);
  const [session, setSession] = useState<Record<string, any> | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [userGeneration, setUserGeneration] = useState<number | null>(null);
  const [relatedUsers, setRelatedUsers] = useState<Array<{ user: FlattenedNode; relationship: string }>>([]);
  const [userInTree, setUserInTree] = useState(false);
  const [highlightPathIds, setHighlightPathIds] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [finderSelection, setFinderSelection] = useState<{ p1: string; p2: string }>({ p1: '', p2: '' });
  const [relationshipResult, setRelationshipResult] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUserSession = async () => {
      const userEmail = localStorage.getItem('user_email');
      if (!userEmail) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth', {
          headers: { 'x-user-email': userEmail },
        });

        if (!res.ok) {
          router.replace('/login');
          return;
        }

        const userData = await res.json();
        setSession(userData);
      } catch (err) {
        console.error('Failed to load user session:', err);
        router.replace('/login');
      } finally {
        setIsSessionLoaded(true);
      }
    };

    loadUserSession();
  }, [router]);

  const countAllNodes = (nodes: TreeNode[]): number => {
    let count = 0;
    nodes.forEach(node => {
      count += 1;
      if (node.children && node.children.length > 0) {
        count += countAllNodes(node.children);
      }
    });
    return count;
  };

  const flattenTree = (nodes: TreeNode[]): FlattenedNode[] => {
    const flattened: FlattenedNode[] = [];
    const traverse = (node: TreeNode) => {
      flattened.push({
        id: node.id,
        parent_id: node.parent_id || undefined,
        primary_name: node.primary_name,
        spouse_name: node.spouse_name,
      });
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    nodes.forEach(traverse);
    return flattened;
  };

  const isUserInTree = (userId: number, nodes: TreeNode[]): boolean => {
    const traverse = (node: TreeNode): boolean => {
      if (node.id === userId) return true;
      if (node.children) {
        return node.children.some(traverse);
      }
      return false;
    };
    return nodes.some(traverse);
  };

  const openAddModal = (parentId: number | null = null) => {
    setAddParentId(parentId);
    // Only show ChoiceModal if the user is NOT already in the tree and a parent is selected
    if (parentId !== null && treeRoots.length > 0 && !userInTree) {
      setShowChoiceModal(true);
    } else {
      // Bypasses the choice modal if user is already in the tree
      setAddMode('add-new');
      setIsAddModalOpen(true);
    }
  };

  const handleChoiceSelect = (mode: 'add-self' | 'add-new') => {
    setAddMode(mode);
    setShowChoiceModal(false);
    setIsAddModalOpen(true);
  };

  const handleShowUser = async (id: number) => {
    try {
      const res = await fetch(`/api/users?id=${id}`);
      const data = await res.json();
      setSelectedUser(data);
      setUserModalMode('view');
      setIsUserModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  const buildTree = (data: Record<string, any>[]) => {
    const nodeMap = new Map<number, TreeNode>();
    const nodes = data.map((item) => ({ ...(item as any), children: [] })) as TreeNode[];
    nodes.forEach((node) => nodeMap.set(node.id, node));

    const roots: TreeNode[] = [];
    nodes.forEach((node) => {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children by order
    const sortChildren = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => (a.order || 0) - (b.order || 0));
        node.children.forEach(sortChildren);
      }
    };
    roots.forEach(sortChildren);

    return roots;
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/tree');
      const data = await res.json();
      setAllUsers(data);
      const tree = buildTree(data);
      setTreeRoots(tree);

      if (session) {
        const inTree = isUserInTree(session.id, tree);
        setUserInTree(inTree);

        if (inTree) {
          const flattened = flattenTree(tree);
          const gen = calculateGeneration(session.id, flattened);
          setUserGeneration(gen);

          const relations = findAllRelationsAtGeneration(session.id, flattened);
          
          // Sort relationships: Siblings first, then First Cousins, then Distant Cousins
          const relationshipOrder = { 'Sibling': 0, 'First Cousin': 1, 'Distant Cousin': 2 };
          const sortedRelations = relations.sort((a, b) => 
            (relationshipOrder[a.relationship as keyof typeof relationshipOrder] ?? 3) - 
            (relationshipOrder[b.relationship as keyof typeof relationshipOrder] ?? 3)
          );
          
          setRelatedUsers(sortedRelations);

          // Calculate path from root to current user
          const path: number[] = [];
          let currentId: number | undefined | null = session.id;
          while (currentId) {
            path.push(currentId);
            const found = flattened.find(n => n.id === currentId);
            currentId = found?.parent_id;
          }
          setHighlightPathIds(path);
        }
      }
    } catch (err) {
      console.error('Failed to load:', err);
    }
  };

  const handleReorder = async (parentId: number, updates: Array<{ user_id: number; order: number }>) => {
    try {
      const res = await fetch('/api/tree/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        throw new Error('Failed to reorder');
      }

      await loadData();
    } catch (err) {
      console.error('Failed to reorder:', err);
    }
  };

  const handleFindRelationship = () => {
    const id1 = Number(finderSelection.p1);
    const id2 = Number(finderSelection.p2);
    if (!id1 || !id2) return;
    if (id1 === id2) { setRelationshipResult("Same person!"); return; }

    const getUser = (id: number) => allUsers.find((u: any) => u.id === id);

    const getPath = (id: number): any[] => {
      const path = [];
      let currId: number | undefined | null = id;
      while (currId) {
        const node = getUser(currId);
        if (!node) break;
        path.push(node);
        currId = node.parent_id;
      }
      return path;
    };

    const path1 = getPath(id1);
    const path2 = getPath(id2);

    let lca: any = null;
    let d1 = -1, d2 = -1;

    for (let i = 0; i < path1.length; i++) {
      const idx2 = path2.findIndex(p => p.id === path1[i].id);
      if (idx2 !== -1) {
        lca = path1[i]; d1 = i; d2 = idx2; break;
      }
    }

    if (!lca) { setRelationshipResult("No direct blood relation found."); return; }

    const target = path2[0];
    const targetGender = (target.gender || '').toLowerCase();
    const viewer = path1[0];
    const viewerGender = (viewer.gender || '').toLowerCase();

    const genderize = (male: string, female: string, other: string) => {
      if (targetGender === 'male') return male;
      if (targetGender === 'female') return female;
      return other;
    };

    const isTargetHigher = d1 > d2;
    const delta = Math.abs(d1 - d2);
    const highDepth = Math.min(d1, d2);
    const lowDepth = Math.max(d1, d2);
    const pathHigh = isTargetHigher ? path2 : path1;
    const pathLow = isTargetHigher ? path1 : path2;

    let result = "";

    // Helper to determine Parallel vs Cross based on ancestors at LCA level
    const checkLineage = () => {
      if (highDepth === 0) return { isParallel: true, isCross: false };
      const aHigh = pathHigh[highDepth - 1];
      const aLow = pathLow[lowDepth - 1];
      const gHigh = (aHigh.gender || '').toLowerCase();
      const gLow = (aLow.gender || '').toLowerCase();
      return {
        isParallel: gHigh === gLow && gHigh !== '',
        isCross: gHigh !== gLow && gHigh !== '' && gLow !== '',
        gHigh,
        gLow
      };
    };

    if (delta >= 2) {
      // Grandparent/Grandchild logic (Simplified to standard terms for grand-relatives)
      if (isTargetHigher) {
        if (targetGender === 'male') result = "Thathayya";
        else if (targetGender === 'female') {
          const branchAncestor = pathLow[lowDepth - 1]; // Lineage start at LCA
          result = (branchAncestor.gender || '').toLowerCase() === 'male' ? "Nanamma" : "Ammamma";
        } else result = "Grandparent";
        
        if (highDepth === 0 && delta > 2) result = "Muni-" + result;
      } else {
        result = genderize("Manavadu", "Manavaraalu", "Grandchild");
        if (highDepth === 0 && delta > 2) result = "Muni-" + result;
      }
    } else if (delta === 1) {
      // Parent/Child or Aunt/Uncle/Niece/Nephew logic
      if (highDepth === 0) {
        // Direct Parent/Child
        result = isTargetHigher ? genderize("Nana", "Amma", "Parent") : genderize("Koduku", "Kuthuru", "Child");
      } else {
        const { isParallel, isCross } = checkLineage();
        if (isTargetHigher) {
          // Target is Aunt/Uncle level
          if (isParallel) result = genderize("Peddanana/Babai", "Peddamma/Pinni", "Aunt/Uncle");
          else if (isCross) result = genderize("Mavayya", "Atta", "Aunt/Uncle");
          else result = genderize("Uncle", "Aunt", "Aunt/Uncle");
        } else {
          // Target is Niece/Nephew level
          // Logic: "Parallel" sibling's kids are like own kids, "Cross" sibling's kids are Alludu/Kodalu
          const viewerSideGender = (pathHigh[highDepth - 1].gender || '').toLowerCase();
          const isViewerMale = viewerGender === 'male';
          const targetSideGender = (pathLow[highDepth - 1].gender || '').toLowerCase();
          
          if (isParallel) {
            const prefix = isViewerMale ? "Anna/Thammudu" : "Akka/Chelli";
            result = `${prefix} ${genderize("Koduku", "Kuthuru", "Child")}`;
          } else if (isCross) {
            // For cross relationship, use the target's gender to determine alludu/kodalu
            result = genderize("Alludu", "Kodalu", "Niece/Nephew");
          }
        }
      }
    } else {
      // Same generation: Siblings or Cousins
      if (highDepth === 1) {
        result = genderize("Annayya/Thammudu", "Akka/Chelli", "Sibling");
      } else {
        const { isParallel, isCross } = checkLineage();
        const degree = highDepth - 1;
        const ordinal = (n: number) => {
          const s = ["th", "st", "nd", "rd"], v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };

        let base = "Cousin";
        if (isParallel) base = genderize("Annayya/Thammudu", "Akka/Chelli", "Cousin");
        else if (isCross) base = genderize("Bava/Mardi", "Vadina/Mardalu", "Cousin");

        result = degree === 1 ? base : `${ordinal(degree)} ${base}`;
      }
    }

    // Format the result with user names and relationship direction
    const user1Name = getUser(id1)?.primary_name || "User 1";
    const user2Name = getUser(id2)?.primary_name || "User 2";
    
    const formattedResult = `${user2Name}, ${user1Name} ki ${result} avthaaru`;
    setRelationshipResult(formattedResult);
  };

  const refreshSession = async () => {
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) {
      setSession(null);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        headers: { 'x-user-email': userEmail },
      });

      if (res.ok) {
        const userData = await res.json();
        setSession(userData);
      }
    } catch (err) {
      console.error('Failed to refresh user session:', err);
    }
  };

  const handleRefresh = async () => {
    await loadData();
    refreshSession();
  };

  useEffect(() => {
    if (isSessionLoaded) {
      loadData();
    }
  }, [isSessionLoaded]);

  const logout = () => {
    localStorage.removeItem('user_email');
    setSession(null);
    router.push('/login');
  };

  if (!isSessionLoaded) return null;

  const familyCount = countAllNodes(treeRoots);
  const currentMonth = new Date().getMonth() + 1;
  const monthName = new Date().toLocaleString('default', { month: 'long' });


  const birthdaysThisMonth = allUsers.filter((u: any) => {
    if (!u.dob) return false;
    const date = new Date(u.dob);
    if (isNaN(date.getTime())) return false;
    
    // `dob` is DATE in DB. It may come as 'YYYY-MM-DD' (no timezone) or with
    // a timezone offset depending on the driver. Use local-safe parsing by
    // extracting month/day from the ISO date string when possible.
    const dobRaw = typeof u.dob === 'string' ? u.dob : null;
    if (dobRaw) {
      // Expect: YYYY-MM-DD
      const m = dobRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const birthMonth = Number(m[2]);
        return birthMonth === currentMonth;
      }
    }

    // Fallback: Date object
    const birthMonth = date.getMonth() + 1;

    return birthMonth === currentMonth;
  }).sort((a: any, b: any) => {
    const dayA = new Date(a.dob).getUTCDate();
    const dayB = new Date(b.dob).getUTCDate();
    return dayA - dayB;
  });

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-5 flex-col sm:flex-row">
          <div className="relative">
            <h1 className={`${greatVibes.className} text-4xl sm:text-5xl font-medium text-slate-900 relative z-10 drop-shadow-sm select-none`}>
              The Boorlagadda's
            </h1>
            <p className={`${cormorantGaramond.className} text-base sm:text-lg uppercase tracking-[0.5em] text-indigo-600 font-black text-center`}> 
              Family 
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm flex-wrap justify-end sm:justify-start">
            {session ? (
              <>
                <ProfileDropdown
                  userName={session.primary_name}
                  userEmail={session.primary_email}
                  onEditProfile={() => {
                    setSelectedUser(session);
                    setUserModalMode('edit');
                    setIsUserModalOpen(true);
                  }}
                  onEditPin={() => {
                    setIsPinModalOpen(true);
                  }}
                  onLogout={logout}
                />
              </>
            ) : (
              <button onClick={() => router.push('/login')} className="rounded-full bg-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-indigo-700">
                Login
              </button>
            )}
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-7xl px-3 sm:px-6 pb-12 sm:pb-20 pt-28 sm:pt-36">
        {/* Description and Generation - Horizontal Layout */}
        <section className="mb-6 sm:mb-10 space-y-4 sm:space-y-6">
          {/* Description Card */}
          <div className="rounded-lg sm:rounded-[2rem] bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            <h1 className="mt-1 text-2xl sm:text-3xl font-medium uppercase tracking-[0.35em] text-indigo-600">The Home</h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-7 text-slate-600">
              Born a boorlagadda and aren't sure who our entire family is ?? Well, this is an effort to bring all of us under one roof. 
              Just tap on any of our relatives to know more info. 
              If you or anyone is missing, please add it to the tree to complete our entire family connections
            </p>
          </div>

          {/* Relationship Finder Section */}
          <div className="rounded-lg sm:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-3 mb-6">
              {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg> */}
              <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Relationship Finder</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <SearchableUserSelect
                users={allUsers}
                value={finderSelection.p1}
                onChange={(val) => setFinderSelection({...finderSelection, p1: val})}
                label="Person 1"
                icon="👤"
              />
              <SearchableUserSelect
                users={allUsers}
                value={finderSelection.p2}
                onChange={(val) => setFinderSelection({...finderSelection, p2: val})}
                label="Person 2"
                icon="👤"
              />
              <button 
                onClick={handleFindRelationship}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find
              </button>
            </div>
            {relationshipResult && (
              <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl shadow-sm">
                <p className="text-xs text-indigo-500 uppercase font-bold mb-4 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Relationship
                </p>
                <div className="space-y-2">
                  <p className="text-center text-base sm:text-lg font-bold text-indigo-900">
                    {relationshipResult}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generation and Related Users */}
          <div className="rounded-lg sm:rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8 shadow-xl shadow-slate-200/40">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {userInTree ? (
                <>
                  <div className="flex-1 rounded-2xl sm:rounded-3xl bg-indigo-600 px-4 sm:px-5 py-4 sm:py-5 text-white shadow-lg min-w-0 flex flex-col">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-indigo-200">Your Generation</p>
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
                      <p className="text-lg sm:text-2xl font-semibold">Generation {userGeneration}</p>
                      {/* <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-indigo-100">{userGeneration === 1 ? 'Family Root' : userGeneration === 2 ? 'Direct descendants' : `Generation ${userGeneration}`}</p> */}
                    </div>
                  </div>
                  {relatedUsers.length > 0 && (
                    <div className="flex-1 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">Same Generation</p>
                      <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                        {relatedUsers.map((rel) => (
                          <div key={rel.user.id} className="text-xs sm:text-sm p-2 bg-indigo-50 rounded-lg border border-slate-200">
                            <span className="font-medium text-slate-700">{rel.user.primary_name}</span>
                            <span className="text-indigo-500 font-bold text-[10px] ml-2 ">({rel.relationship})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex-1 rounded-2xl sm:rounded-3xl bg-indigo-600 px-4 sm:px-5 py-4 sm:py-5 text-white shadow-lg min-w-0 flex flex-col">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-indigo-200">Welcome</p>
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
                      <p className="text-lg sm:text-xl font-semibold">{session?.primary_name}</p>
                      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-indigo-100">{session?.primary_email || 'No email added yet'}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Birthday Alerts Card */}
              <div className="flex-1 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span>🎂</span> Birthdays in {monthName}
                </p>
                <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto pr-2">
                  {birthdaysThisMonth.length > 0 ? birthdaysThisMonth.map((u: any) => (
                    <div key={u.id} className="flex justify-between items-center text-xs p-2 bg-indigo-50 rounded border border-indigo-100">
                      <span className="font-medium text-slate-700">{u.primary_name}</span>
                      <span className="text-indigo-500 font-bold">{new Date(u.dob).getUTCDate()} {monthName.substring(0, 3)}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic">No birthdays this month</p>
                  )}
                </div>
              </div>

              <div className="flex-none lg:w-32 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Family Size</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">{familyCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg sm:rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/40">
          <div className="max-w-full overflow-x-auto">
            <FamilyTree nodes={treeRoots} onShow={handleShowUser} onAdd={openAddModal} onReorder={handleReorder} highlightPathIds={highlightPathIds} />
          </div>
        </section>
      </main>

      {showChoiceModal && (
        <ChoiceModal
          isOpen={showChoiceModal}
          currentUser={session || {}}
          onClose={() => setShowChoiceModal(false)}
          onSelectAddSelf={() => { if (!userInTree) handleChoiceSelect('add-self'); }}
          onSelectAddOther={() => handleChoiceSelect('add-new')}
          hideAddSelf={userInTree}
        />
      )}

      {isAddModalOpen && (
        <AddModal
          parentId={addParentId}
          onClose={() => { setIsAddModalOpen(false); setAddParentId(null); }}
          onRefresh={handleRefresh}
          mode={addMode}
          currentUser={addMode === 'add-self' ? session : undefined}
        />
      )}

      {isUserModalOpen && selectedUser && (
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => { setIsUserModalOpen(false); setUserModalMode('view'); }}
          onRefresh={handleRefresh}
          mode={userModalMode}
          initialData={selectedUser}
          onEditRequested={() => setUserModalMode('edit')}
        />
      )}

      {isPinModalOpen && session && (
        <PinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          email={session.primary_email}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
