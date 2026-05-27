

import { useState } from 'react';

export interface TreeNode {
  id: number;
  primary_name: string;
  spouse_name?: string;
  contact?: string;
  primary_email?: string;
  spouse_email?: string;
  parent_id?: number | null;
  order?: number;
  children: TreeNode[];
}

interface FamilyTreeProps {
  nodes: TreeNode[];
  onShow: (id: number) => void;
  onAdd: (parentId: number) => void;
  onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
  isRoot?: boolean;
}

interface TreeBranchProps {
  node: TreeNode;
  onShow: (id: number) => void;
  onAdd: (parentId: number) => void;
  onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
  isRootChild?: boolean;
}

function UserCard({ node, onShow, onAdd }: { node: TreeNode; onShow: (id: number) => void; onAdd: (parentId: number) => void }) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-5 w-56 sm:w-72 text-center transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="mx-auto mb-2 sm:mb-3 flex h-12 sm:h-16 w-12 sm:w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-base sm:text-lg">{node.primary_name?.charAt(0) || '?'}</div>

      <div className="text-base sm:text-lg font-semibold text-slate-900">{node.primary_name}</div>
      {node.spouse_name ? <div className="text-xs sm:text-sm text-slate-500">&amp; {node.spouse_name}</div> : null}

      <div className="mt-2 sm:mt-3 text-left text-xs sm:text-sm text-slate-600 space-y-0.5 sm:space-y-1">
        {node.contact ? <div><span className="font-semibold text-slate-700">Phone:</span> <span className="text-xs">{node.contact}</span></div> : null}
        {node.primary_email ? <div><span className="font-semibold text-slate-700">Email:</span> <span className="text-xs">{node.primary_email}</span></div> : null}
      </div>

      <div className="mt-3 sm:mt-5 flex gap-1 sm:gap-2 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onShow(node.id)}
          className="rounded-full bg-indigo-600 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          View
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(node.id);
          }}
          className="rounded-full bg-emerald-500 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ChildrenLayout({ node, onShow, onAdd, onReorder, isRootChild }: TreeBranchProps) {
  const [showReorder, setShowReorder] = useState(false);

  if (!node.children || node.children.length === 0) return null;

  const handleMoveChild = (index: number, direction: 'up' | 'down') => {
    const children = [...(node.children || [])];
    if (direction === 'up' && index > 0) {
      [children[index], children[index - 1]] = [children[index - 1], children[index]];
    } else if (direction === 'down' && index < children.length - 1) {
      [children[index], children[index + 1]] = [children[index + 1], children[index]];
    } else {
      return;
    }

    const updates = children.map((child, idx) => ({
      user_id: child.id,
      order: idx,
    }));

    onReorder?.(node.id, updates);
  };

  return (
    <>
      <div className="absolute top-full left-1/2 h-6 sm:h-8 w-px bg-slate-300" />
      <div className="mt-6 sm:mt-8 flex flex-col items-center gap-4 sm:gap-6 pl-8 sm:pl-12">
        {node.children.map((child, idx) => (
          <div key={child.id} className="relative flex flex-col items-start w-full">
            <div className="relative flex items-center gap-3 sm:gap-4 group">
              <div className="absolute -left-5 sm:-left-6 top-1/2 h-px w-4 sm:w-6 bg-slate-300 -translate-y-1/2" />
              
              {isRootChild && node.children && node.children.length > 1 && (
                <div className={`flex gap-1 ${showReorder ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} transition`}>
                  <button
                    onClick={() => handleMoveChild(idx, 'up')}
                    disabled={idx === 0}
                    className="bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveChild(idx, 'down')}
                    disabled={idx === node.children!.length - 1}
                    className="bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              )}

              <TreeBranch node={child} onShow={onShow} onAdd={onAdd} onReorder={onReorder} isRootChild={false} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TreeBranch({ node, onShow, onAdd, onReorder, isRootChild = false }: TreeBranchProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="relative flex flex-col items-start">
      <div className="flex items-center gap-2">
        {isRootChild && node.children && node.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-sm bg-slate-200 hover:bg-slate-300 rounded transition"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
        <UserCard node={node} onShow={onShow} onAdd={onAdd} />
      </div>

      {isExpanded && <ChildrenLayout node={node} onShow={onShow} onAdd={onAdd} onReorder={onReorder} isRootChild={isRootChild} />}
    </div>
  );
}

export default function FamilyTree({ nodes, onShow, onAdd, onReorder }: FamilyTreeProps) {
  if (nodes.length === 0) {
    return <div className="py-8 sm:py-16 text-center text-slate-500 text-sm sm:text-base">No family tree data found yet.</div>;
  }

  return (
    <div className="w-full h-96 sm:h-[600px] overflow-auto border border-slate-200 rounded-lg bg-slate-50 relative">
      <div className="flex flex-wrap gap-6 sm:gap-10 py-6 sm:py-10 px-4 sm:px-6">
        {nodes.map((root) => (
          <div key={root.id} className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-6">
              {root.children && root.children.length > 0 && (
                <div className="px-2 py-1 text-xs font-semibold bg-slate-200 rounded">
                  {root.children.length} child{root.children.length !== 1 ? 'ren' : ''}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-start gap-6">
              <UserCard node={root} onShow={onShow} onAdd={onAdd} />
              
              {root.children && root.children.length > 0 && (
                <div className="flex gap-4 sm:gap-8 flex-wrap items-start">
                  {root.children.map((child) => (
                    <TreeBranch
                      key={child.id}
                      node={child}
                      onShow={onShow}
                      onAdd={onAdd}
                      onReorder={onReorder}
                      isRootChild={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
