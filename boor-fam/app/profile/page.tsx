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
    if (parentId !== null && treeRoots.length > 0) {
      setShowChoiceModal(true);
    } else if (parentId === null && treeRoots.length === 0) {
      setAddMode('add-new');
      setIsAddModalOpen(true);
    } else {
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
          setRelatedUsers(relations);
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
        <section className="mb-6 sm:mb-10 grid gap-4 sm:gap-6 lg:grid-cols-[1.9fr_1fr]">
          <div className="rounded-lg sm:rounded-[2rem] bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            <h1 className="mt-1 text-2xl sm:text-3xl font-medium uppercase tracking-[0.35em] text-indigo-600">The Home</h1>
            <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base leading-7 text-slate-600">
              Born a boorlagadda and aren't sure who our entire family is ?? Well, this is an effort to bring all of us under one roof. 
              Just tap on any of our relatives to know more info. 
              If you or anyone is missing, please add it to the tree to complete our entire family connections
            </p>
          </div>

          <div className="rounded-lg sm:rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8 shadow-xl shadow-slate-200/40">
            <div className="space-y-3 sm:space-y-4">
              {userInTree ? (
                <>
                  <div className="rounded-2xl sm:rounded-3xl bg-indigo-600 px-4 sm:px-5 py-4 sm:py-5 text-white shadow-lg">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-indigo-200">Your Generation</p>
                    <p className="mt-2 sm:mt-3 text-lg sm:text-xl font-semibold">Level {userGeneration}</p>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-indigo-100">{userGeneration === 1 ? 'Family Root' : userGeneration === 2 ? 'Direct descendants' : `Generation ${userGeneration}`}</p>
                  </div>
                  {relatedUsers.length > 0 && (
                    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-100">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">Same Generation</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {relatedUsers.map((rel) => (
                          <div key={rel.user.id} className="text-xs sm:text-sm p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="font-medium text-slate-700">{rel.user.primary_name}</div>
                            <div className="text-slate-500 text-xs">{rel.relationship}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-2xl sm:rounded-3xl bg-indigo-600 px-4 sm:px-5 py-4 sm:py-5 text-white shadow-lg">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-indigo-200">Welcome</p>
                    <p className="mt-2 sm:mt-3 text-lg sm:text-xl font-semibold">{session?.primary_name}</p>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-indigo-100">{session?.primary_email || 'No email added yet'}</p>
                  </div>
                </>
              )}
              <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-xs sm:text-sm font-semibold text-slate-900">Family size</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{familyCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg sm:rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/40">
          <FamilyTree nodes={treeRoots} onShow={handleShowUser} onAdd={openAddModal} onReorder={handleReorder} />
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
