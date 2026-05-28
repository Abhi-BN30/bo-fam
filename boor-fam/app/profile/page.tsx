"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FamilyTree, { TreeNode } from '../components/familyTree';
import AddModal from '../components/addModal';
import UserModal from '../components/userModal';
import ChoiceModal from '../components/choiceModal';
import { calculateGeneration, findAllRelationsAtGeneration, FlattenedNode } from '../lib/utils';

export default function Home() {
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
    const stored = localStorage.getItem('user_session');
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(JSON.parse(stored));
    setIsSessionLoaded(true);
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

    const getPath = (id: number) => {
      const path = [];
      let currId: number | undefined | null = id;
      while (currId) {
        const node = allUsers.find((u: any) => u.id === currId);
        if (!node) break;
        path.push({ id: node.id, name: node.primary_name });
        currId = node.parent_id;
      }
      return path;
    };

    const path1 = getPath(id1);
    const path2 = getPath(id2);

    let lca = null;
    let d1 = -1, d2 = -1;

    for (let i = 0; i < path1.length; i++) {
      const idx2 = path2.findIndex(p => p.id === path1[i].id);
      if (idx2 !== -1) {
        lca = path1[i]; d1 = i; d2 = idx2; break;
      }
    }

    if (!lca) { setRelationshipResult("No direct blood relation found."); return; }

    let result = "";
    if (d1 === 0 || d2 === 0) {
      const dist = Math.max(d1, d2);
      const isAncestor = d1 === 0;
      if (dist === 1) result = isAncestor ? "Parent" : "Child";
      else if (dist === 2) result = isAncestor ? "Grandparent" : "Grandchild";
      else {
        const greats = "Great-".repeat(dist - 2);
        result = `${greats}${isAncestor ? "Grandparent" : "Grandchild"}`;
      }
    } else if (d1 === 1 && d2 === 1) result = "Sibling";
    else if (d1 === 1 || d2 === 1) {
      const dist = Math.max(d1, d2);
      const isNieceNephew = d1 > d2;
      result = `${"Great-".repeat(Math.max(0, dist - 2))}${isNieceNephew ? "Niece/Nephew" : "Aunt/Uncle"}`;
    } else {
      const degree = Math.min(d1, d2) - 1;
      const removed = Math.abs(d1 - d2);
      const ordinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"], v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      result = `${ordinal(degree)} Cousin${removed > 0 ? ` ${removed}x removed` : ""}`;
    }
    setRelationshipResult(result);
  };

  const refreshSession = () => {
    const stored = localStorage.getItem('user_session');
    setSession(stored ? JSON.parse(stored) : null);
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
    localStorage.removeItem('user_session');
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
    
    // Use UTC month to avoid timezone shifts for Date-only fields
    const birthMonth = date.getUTCMonth() + 1; 
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
          <div>            
            <h1 className="text-xl sm:text-3xl font-semibold text-slate-900">The Boorlagadda's</h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-indigo-600">Family Tree</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-2 shadow-sm text-xs sm:text-sm flex-wrap justify-end sm:justify-start">
            {session ? (
              <>
                <div className="text-xs sm:text-sm">
                  <div className="font-semibold text-slate-900">{session.primary_name}</div>
                  <div className="text-xs text-slate-500">{session.spouse_name ? `${session.spouse_name} • ` : ''}{session.primary_email}</div>
                </div>
                <button onClick={logout} className="rounded-full bg-rose-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-rose-600 whitespace-nowrap">
                  Logout
                </button>
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
            <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base leading-7 text-slate-600">
              Born a boorlagadda and aren't sure who our entire family is ?? Well, this is an effort to bring all of us under one roof. 
              Just tap on any of our relatives to know more info. 
              If you or anyone is missing, please add it to the tree to complete our entire family connections
            </p>
          </div>

          {/* Relationship Finder Section */}
          <div className="rounded-lg sm:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-4">Relationship Finder</h2>
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Person 1</label>
                <select 
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={finderSelection.p1}
                  onChange={(e) => setFinderSelection({...finderSelection, p1: e.target.value})}
                >
                  <option value="">Select someone...</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.primary_name}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Person 2</label>
                <select 
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={finderSelection.p2}
                  onChange={(e) => setFinderSelection({...finderSelection, p2: e.target.value})}
                >
                  <option value="">Select someone...</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.primary_name}</option>)}
                </select>
              </div>
              <button 
                onClick={handleFindRelationship}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition w-full sm:w-auto"
              >
                Find
              </button>
            </div>
            {relationshipResult && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                <p className="text-xs text-indigo-400 uppercase font-bold mb-1">Result</p>
                <p className="text-lg font-bold text-indigo-900">{relationshipResult}</p>
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
                      <p className="text-lg sm:text-xl font-semibold">Level {userGeneration}</p>
                      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-indigo-100">{userGeneration === 1 ? 'Family Root' : userGeneration === 2 ? 'Direct descendants' : `Generation ${userGeneration}`}</p>
                    </div>
                  </div>
                  {relatedUsers.length > 0 && (
                    <div className="flex-1 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">Same Generation</p>
                      <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                        {relatedUsers.map((rel) => (
                          <div key={rel.user.id} className="text-xs sm:text-sm p-2 bg-slate-50 rounded border border-slate-200">
                            <span className="font-medium text-slate-700">{rel.user.primary_name}</span>
                            <span className="text-slate-400 text-[10px] ml-2 italic">({rel.relationship})</span>
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
                    <div key={u.id} className="flex justify-between items-center text-xs p-2 bg-rose-50 rounded border border-rose-100">
                      <span className="font-medium text-slate-700">{u.primary_name}</span>
                      <span className="text-rose-500 font-bold">{parseInt(u.dob.split('-')[2])} {monthName.substring(0, 3)}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic">No birthdays this month</p>
                  )}
                </div>
              </div>

              <div className="flex-none lg:w-32 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Size</p>
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
    </div>
  );
}
