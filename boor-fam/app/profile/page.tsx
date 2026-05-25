"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FamilyTree, { TreeNode } from '../components/familyTree';
import AddModal from '../components/addModal';
import UserModal from '../components/userModal';
import SetupModal from '../components/setupModal';

export default function Home() {
  const [treeRoots, setTreeRoots] = useState<TreeNode[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [selectedUser, setSelectedUser] = useState<Record<string, any> | null>(null);
  const [session, setSession] = useState<Record<string, any> | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
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

  const openAddModal = (parentId: number | null = null) => {
    setAddParentId(parentId);
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

    return roots;
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/tree');
      const data = await res.json();
      const tree = buildTree(data);
      setTreeRoots(tree);
      
      // Check if current user is in the tree
      if (session?.id) {
        const isInTree = tree.some(root => isUserInTree(root, session.id));
        if (!isInTree && data.length > 0) {
          // User exists but not in tree, show setup
          setShowSetupModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to load:', err);
    }
  };

  const isUserInTree = (node: TreeNode, userId: number): boolean => {
    if (node.id === userId) return true;
    if (node.children) {
      return node.children.some(child => isUserInTree(child, userId));
    }
    return false;
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

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-600">Family Tree</p>
            <h1 className="text-3xl font-semibold text-slate-900">The Boorlagadda's</h1>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <div className="text-sm">
                  <div className="font-semibold text-slate-900">{session.primary_name}</div>
                  <div className="text-xs text-slate-500">{session.spouse_name ? `${session.spouse_name} • ` : ''}{session.primary_email}</div>
                </div>
                <button onClick={logout} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-36">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.9fr_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-indigo-600">Tree view</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Your family tree in a cleaner, faster layout.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Tap any family member to open details, add children directly from the card, and enjoy a polished tree presentation without the clutter of a graph editor.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-xl shadow-slate-200/40">
            <div className="space-y-4">
              <div className="rounded-3xl bg-indigo-600 px-5 py-5 text-white shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-200">Logged in as</p>
                <p className="mt-3 text-xl font-semibold">{session?.primary_name}</p>
                <p className="mt-1 text-sm text-indigo-100">{session?.primary_email || 'No email added yet'}</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Family size</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{treeRoots.reduce((count, node) => count + 1 + (node.children?.length ?? 0), 0)}</p>
                <p className="mt-2 text-sm text-slate-500">Active members displayed in the tree.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <FamilyTree nodes={treeRoots} onShow={handleShowUser} onAdd={openAddModal} onReorder={handleReorder} />
        </section>
      </main>

      {isAddModalOpen && (
        <AddModal
          parentId={addParentId}
          onClose={() => { setIsAddModalOpen(false); setAddParentId(null); }}
          onRefresh={handleRefresh}
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

      {showSetupModal && session && (
        <SetupModal
          isOpen={showSetupModal}
          currentUser={session}
          onClose={() => setShowSetupModal(false)}
          onSkip={() => setShowSetupModal(false)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
