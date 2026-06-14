import { useState } from 'react';

export interface TreeNode {
  id: number;
  primary_name: string;
  spouse_name?: string;
  contact?: string;
  primary_email?: string;
  spouse_email?: string;
  country?: string;
  state?: string;
  city?: string;
  parent_id?: number | null;
  order?: number;
  deceased_primary?: boolean;
  deceased_spouse?: boolean;
  children: TreeNode[];
}

interface FamilyTreeProps {
  nodes: TreeNode[];
  onShow: (id: number) => void;
  onAdd: (parentId: number) => void;
  onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
  isReorderMode?: boolean;
  highlightPathIds?: number[];
}

interface TreeNodeProps {
  node: TreeNode;
  onShow: (id: number) => void;
  onAdd: (parentId: number) => void;
  onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
  level?: number;
  childIndex?: number;
  totalSiblings?: number;
  isReorderMode: boolean;
  highlightPathIds: number[];
  onMove?: (direction: 'up' | 'down') => void;
}

// Renders a single person's name + optional deceased indicator
// Scoped entirely to that one person — no color bleeds to card border or children
function PersonName({ name, deceased }: { name: string; deceased: boolean }) {
  if (!deceased) {
    return <div className="text-sm font-semibold text-slate-900">{name}</div>;
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Name with strikethrough — clearly marks this person only */}
      <div className="text-sm font-semibold text-slate-500 decoration-slate-400">
        {name}
      </div>
      {/* Tiny pill — no red, uses neutral slate so it reads "gone" not "error" */}
      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-400 leading-none">
        {/* <span>✝</span> */}
        <span>Deceased</span>
      </span>
    </div>
  );
}

function TreeNodeComponent({
  node, onShow, onAdd, onReorder,
  level = 0, childIndex = 0, totalSiblings = 1,
  isReorderMode, highlightPathIds, onMove,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = node.children && node.children.length > 0;
  const indentClass = "ml-[300px] sm:ml-[350px]";
  const isOnHighlightPath = highlightPathIds.includes(node.id);
  const trunkHighlighted = node.children?.some(child => highlightPathIds.includes(child.id));

  const primaryDeceased = !!node.deceased_primary;
  const spouseDeceased  = !!node.deceased_spouse && !!node.spouse_name;

  // Card border: always indigo — deceased status never affects the card frame
  const borderColor = isOnHighlightPath ? 'border-indigo-600' : 'border-indigo-500';
  const cardShadow  = isOnHighlightPath ? 'shadow-indigo-100 ring-2 ring-indigo-500/20' : 'hover:shadow-xl';

  return (
    <div className="relative flex flex-col items-start">
      <div className="flex items-start gap-2 sm:gap-4 mb-6 relative">

        {/* Vertical bridge to children */}
        {isExpanded && hasChildren && (
          <div
            className={`absolute left-[56px] sm:left-[64px] transition-colors ${trunkHighlighted ? 'bg-indigo-500' : 'bg-slate-300'}`}
            style={{ top: '100%', bottom: '-1.5rem', width: trunkHighlighted ? '4px' : '2px' }}
          />
        )}

        {/* Horizontal connector from parent trunk */}
        {level > 0 && (
          <div
            className={`absolute left-[-244px] w-[244px] sm:left-[-286px] sm:w-[286px] ${isOnHighlightPath ? 'border-indigo-500 border-t-[4px]' : 'border-slate-300 border-t-2'}`}
            style={{ top: '2.5rem' }}
          />
        )}

        {/* ── Card ── border colour never changes for deceased ── */}
        <div className={`flex-shrink-0 bg-white border-l-4 rounded-xl p-4 sm:p-5 w-56 sm:w-64 shadow-md transition-all ${borderColor} ${cardShadow}`}>

          {/* Top row: collapse toggle + child count */}
          <div className="flex items-start justify-between gap-2 mb-3">
            {hasChildren ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded transition border border-slate-300 flex-shrink-0"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? '−' : '+'}
              </button>
            ) : (
              <div className="w-12" />
            )}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex-shrink-0">
              {hasChildren ? `${node.children!.length} child${node.children!.length !== 1 ? 'ren' : ''}` : ''}
            </div>
          </div>

          {/* Names — each person's deceased state is scoped to their own name block only */}
          <div className="mb-3 text-center space-y-1">
            <PersonName name={node.primary_name} deceased={primaryDeceased} />

            {node.spouse_name && (
              <>
                <div className="h-px bg-slate-200 my-2" />
                <PersonName name={node.spouse_name} deceased={spouseDeceased} />
              </>
            )}
          </div>

          {/* Location */}
          {(node.city?.trim() || node.state?.trim() || node.country?.trim()) && (
            <div className="mb-3 text-center px-2">
              <p className="text-[12px] sm:text-[11px] text-slate-600 font-medium leading-tight break-words">
                {[node.city, node.state, node.country].filter(v => typeof v === 'string' && v.trim() !== '').join(', ')}
              </p>
            </div>
          )}

          {/* Contact */}
          {(node.contact || node.primary_email) && (
            <div className="mb-3 text-xs text-slate-600 space-y-0.5 pb-3 border-b border-slate-100">
              {node.contact && <div className="truncate"><span className="font-semibold">Ph:</span> {node.contact}</div>}
              {node.primary_email && <div className="truncate"><span className="font-semibold">Email:</span> {node.primary_email}</div>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onShow(node.id)}
              className="flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              View
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onAdd(node.id); }}
              className="flex-1 rounded-md bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
            >
              Add Child
            </button>
          </div>
        </div>

        {/* Reorder controls */}
        {isReorderMode && totalSiblings > 1 && (
          <div className="flex flex-col gap-1 pt-4">
            <button onClick={() => onMove?.('up')} disabled={childIndex === 0} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded transition min-w-max">↑</button>
            <button onClick={() => onMove?.('down')} disabled={childIndex === totalSiblings - 1} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded transition min-w-max">↓</button>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className={`relative ${indentClass} border-l border-transparent`}>
          {node.children!.map((child, idx) => {
            const isChildInPath = highlightPathIds.includes(child.id);
            const isTargetBelowLaterSibling = node.children!.slice(idx + 1).some(sib => highlightPathIds.includes(sib.id));
            const isLastChild = idx === node.children!.length - 1;

            return (
              <div key={child.id} className="relative">
                <div
                  className={`absolute left-[-244px] sm:left-[-286px] transition-colors ${(isChildInPath || isTargetBelowLaterSibling) ? 'bg-indigo-500 z-10' : 'bg-slate-300'}`}
                  style={{ top: 0, width: (isChildInPath || isTargetBelowLaterSibling) ? '4px' : '2px', height: '2.5rem' }}
                />
                {!isLastChild && (
                  <div
                    className={`absolute left-[-244px] sm:left-[-286px] transition-colors ${isTargetBelowLaterSibling ? 'bg-indigo-500 z-10' : 'bg-slate-300'}`}
                    style={{ top: '2.5rem', width: isTargetBelowLaterSibling ? '4px' : '2px', height: 'calc(100% - 2.5rem)' }}
                  />
                )}
                <TreeNodeComponent
                  node={child}
                  onShow={onShow}
                  onAdd={onAdd}
                  onReorder={onReorder}
                  level={level + 1}
                  childIndex={idx}
                  totalSiblings={node.children!.length}
                  isReorderMode={isReorderMode}
                  highlightPathIds={highlightPathIds}
                  onMove={direction => {
                    if (!node.children) return;
                    const newChildren = [...node.children];
                    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                    if (targetIdx >= 0 && targetIdx < newChildren.length) {
                      [newChildren[idx], newChildren[targetIdx]] = [newChildren[targetIdx], newChildren[idx]];
                      onReorder?.(node.id, newChildren.map((c, i) => ({ user_id: c.id, order: i })));
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FamilyTree({ nodes, onShow, onAdd, onReorder, highlightPathIds = [] }: FamilyTreeProps) {
  const [isReorderMode, setIsReorderMode] = useState(false);

  if (nodes.length === 0) {
    return <div className="py-8 sm:py-16 text-center text-slate-500 text-sm sm:text-base">No family tree data found yet.</div>;
  }

  return (
    <div className="w-full overflow-auto border border-slate-200 rounded-lg sm:rounded-[1.5rem] bg-white-50 p-8">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsReorderMode(!isReorderMode)}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition shadow-lg flex items-center gap-2 ${isReorderMode ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          {isReorderMode ? (
            <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Finish Reordering</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>Enable Reordering</>
          )}
        </button>
      </div>

      <div className="relative space-y-12">
        {nodes.map((root, idx) => (
          <TreeNodeComponent
            key={root.id}
            node={root}
            onShow={onShow}
            onAdd={onAdd}
            onReorder={onReorder}
            level={0}
            childIndex={idx}
            totalSiblings={nodes.length}
            isReorderMode={isReorderMode}
            highlightPathIds={highlightPathIds}
            onMove={direction => {
              const newRoots = [...nodes];
              const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
              if (targetIdx >= 0 && targetIdx < newRoots.length) {
                [newRoots[idx], newRoots[targetIdx]] = [newRoots[targetIdx], newRoots[idx]];
                onReorder?.(0, newRoots.map((n, i) => ({ user_id: n.id, order: i })));
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}