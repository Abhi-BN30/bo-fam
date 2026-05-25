
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
}

interface TreeBranchProps {
  node: TreeNode;
  onShow: (id: number) => void;
  onAdd: (parentId: number) => void;
  onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
}

function TreeBranch({ node, onShow, onAdd, onReorder }: TreeBranchProps) {
  const handleMoveChild = (index: number, direction: 'up' | 'down') => {
    const children = [...(node.children || [])];
    if (direction === 'up' && index > 0) {
      [children[index], children[index - 1]] = [children[index - 1], children[index]];
    } else if (direction === 'down' && index < children.length - 1) {
      [children[index], children[index + 1]] = [children[index + 1], children[index]];
    } else {
      return;
    }

    // Call reorder with new order values
    const updates = children.map((child, idx) => ({
      user_id: child.id,
      order: idx,
    }));

    onReorder?.(node.id, updates);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl p-5 w-72 text-center transition hover:-translate-y-1 hover:shadow-2xl">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-lg">{node.primary_name?.charAt(0) || '?'}</div>

        <div className="text-lg font-semibold text-slate-900">{node.primary_name}</div>
        {node.spouse_name ? <div className="text-sm text-slate-500">&amp; {node.spouse_name}</div> : null}

        <div className="mt-3 text-left text-sm text-slate-600 space-y-1">
          {node.contact ? <div><span className="font-semibold text-slate-700">Phone:</span> {node.contact}</div> : null}
          {node.primary_email ? <div><span className="font-semibold text-slate-700">Email:</span> {node.primary_email}</div> : null}
        </div>

        <div className="mt-5 flex gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => onShow(node.id)}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            View
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(node.id);
            }}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Add Child
          </button>
        </div>
      </div>

      {node.children && node.children.length > 0 ? (
        <>
          <div className="absolute top-full left-1/2 h-8 w-px bg-slate-300" />
          <div className="mt-8 flex min-w-full items-start justify-center gap-8 px-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-slate-300" />
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative flex flex-col items-center pt-8 group">
                {node.children && node.children.length > 1 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition flex gap-1 z-10 bg-white rounded-full p-1 shadow-lg">
                    <button
                      onClick={() => handleMoveChild(idx, 'up')}
                      disabled={idx === 0}
                      className="bg-blue-500 text-white px-2 py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                      title="Move left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleMoveChild(idx, 'down')}
                      disabled={idx === node.children!.length - 1}
                      className="bg-blue-500 text-white px-2 py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                      title="Move right"
                    >
                      →
                    </button>
                  </div>
                )}
                <div className="absolute top-0 left-1/2 h-8 w-px bg-slate-300" />
                <TreeBranch node={child} onShow={onShow} onAdd={onAdd} onReorder={onReorder} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function FamilyTree({ nodes, onShow, onAdd, onReorder }: FamilyTreeProps) {
  if (nodes.length === 0) {
    return <div className="py-16 text-center text-slate-500">No family tree data found yet.</div>;
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-10 py-10">
      {nodes.map((root) => (
        <div key={root.id} className="flex justify-center">
          <TreeBranch node={root} onShow={onShow} onAdd={onAdd} onReorder={onReorder} />
        </div>
      ))}
    </div>
  );
}
