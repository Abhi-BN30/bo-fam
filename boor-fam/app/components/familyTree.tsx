import { useState, useEffect } from 'react';

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
  navigateToUserId?: number | null;
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
  navigateToUserId?: number | null;
}

// Check if a node or any of its descendants matches the given id
function subtreeContains(node: TreeNode, id: number): boolean {
  if (node.id === id) return true;
  return node.children?.some(c => subtreeContains(c, id)) ?? false;
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
  isReorderMode, highlightPathIds, onMove, navigateToUserId,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);

  // Auto-expand this node if the navigation target lives somewhere in this subtree
  useEffect(() => {
    if (navigateToUserId && node.id !== navigateToUserId && subtreeContains(node, navigateToUserId)) {
      setIsExpanded(true);
    }
  }, [navigateToUserId, node]);

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
        <div data-node-id={node.id} className={`flex-shrink-0 bg-white border-l-4 rounded-xl p-4 sm:p-5 w-56 sm:w-64 shadow-md transition-all ${borderColor} ${cardShadow}`}>

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

          {/* Contact
          {(node.contact || node.primary_email) && (
            <div className="mb-3 text-xs text-slate-600 space-y-0.5 pb-3 border-b border-slate-100">
              {node.contact && <div className="truncate"><span className="font-semibold">Ph:</span> {node.contact}</div>}
              {node.primary_email && <div className="truncate"><span className="font-semibold">Email:</span> {node.primary_email}</div>}
            </div>
          )} */}

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
                  navigateToUserId={navigateToUserId}
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

export default function FamilyTree({ nodes, onShow, onAdd, onReorder, highlightPathIds = [], navigateToUserId }: FamilyTreeProps) {
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Scroll to a specific node when navigateToUserId changes.
  // We wait 300ms so that child TreeNodeComponents have time to auto-expand
  // (their useEffect fires first, setState schedules a re-render, then we scroll).
  useEffect(() => {
    if (!navigateToUserId) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-node-id="${navigateToUserId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        // Pulse highlight: add then remove classes
        el.classList.add('ring-4', 'ring-indigo-400', 'ring-offset-2', 'scale-105', 'transition-transform');
        setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-400', 'ring-offset-2', 'scale-105', 'transition-transform'), 2500);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [navigateToUserId]);

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
            navigateToUserId={navigateToUserId}
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



// NEW LAYOUT

// 'use client';

// import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// export interface TreeNode {
//   id: number;
//   primary_name: string;
//   spouse_name?: string;
//   contact?: string;
//   primary_email?: string;
//   spouse_email?: string;
//   country?: string;
//   state?: string;
//   city?: string;
//   parent_id?: number | null;
//   order?: number;
//   deceased_primary?: boolean;
//   deceased_spouse?: boolean;
//   children: TreeNode[];
// }

// interface FamilyTreeProps {
//   nodes: TreeNode[];
//   onShow: (id: number) => void;
//   onAdd: (parentId: number) => void;
//   onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
//   isReorderMode?: boolean;
//   highlightPathIds?: number[];
// }

// // ── Layout constants ────────────────────────────────────────────────────
// // Generation-row layout: depth grows DOWN (one row per generation), not
// // diagonally. Siblings/cousins lay out left-to-right within their row.
// const CARD_W = 220;          // card width (px, at 1x zoom)
// const CARD_H = 132;          // approx card height (px, at 1x zoom) — used for connector geometry
// const H_GAP = 28;            // horizontal gap between sibling cards
// const ROW_GAP = 96;          // vertical gap between generations (room for connectors)
// const COLLAPSED_W = 56;      // width reserved for a collapsed subtree's "+N" stub

// // ── Layout computation ──────────────────────────────────────────────────
// // We compute x positions bottom-up (children determine parent's center),
// // and depth top-down. This produces a classic "balanced" tree layout
// // rather than the old purely-recursive indent.

// interface LayoutNode {
//   node: TreeNode;
//   depth: number;
//   x: number;       // center-x in layout units
//   width: number;    // subtree width in layout units (own card or sum of children)
//   collapsed: boolean;
// }

// function buildLayout(
//   roots: TreeNode[],
//   expandedIds: Set<number>,
//   defaultDepthCutoff: number,
// ): { layoutNodes: Map<number, LayoutNode>; rowsByDepth: Map<number, LayoutNode[]>; totalWidth: number } {
//   const layoutNodes = new Map<number, LayoutNode>();
//   const rowsByDepth = new Map<number, LayoutNode[]>();

//   function isExpanded(node: TreeNode, depth: number): boolean {
//     if (expandedIds.has(node.id)) return true;
//     if (expandedIds.has(-node.id - 1)) return false; // explicit collapse marker (see toggle logic)
//     return depth < defaultDepthCutoff;
//   }

//   // Pass 1: compute subtree width bottom-up via recursion, return width in units
//   function measure(node: TreeNode, depth: number): number {
//     const expanded = isExpanded(node, depth);
//     const hasChildren = !!node.children?.length;

//     if (!expanded || !hasChildren) {
//       const w = hasChildren ? Math.max(CARD_W, COLLAPSED_W) : CARD_W;
//       layoutNodes.set(node.id, { node, depth, x: 0, width: w, collapsed: hasChildren && !expanded });
//       return w;
//     }

//     let childTotal = 0;
//     node.children.forEach((child, i) => {
//       if (i > 0) childTotal += H_GAP;
//       childTotal += measure(child, depth + 1);
//     });
//     const width = Math.max(CARD_W, childTotal);
//     layoutNodes.set(node.id, { node, depth, x: 0, width, collapsed: false });
//     return width;
//   }

//   // Pass 2: assign x positions top-down, centering each node over its children
//   function place(node: TreeNode, leftEdge: number, depth: number) {
//     const ln = layoutNodes.get(node.id)!;
//     const expanded = !ln.collapsed && !!node.children?.length;

//     if (!expanded) {
//       ln.x = leftEdge + ln.width / 2;
//     } else {
//       let cursor = leftEdge;
//       node.children.forEach((child, i) => {
//         if (i > 0) cursor += H_GAP;
//         place(child, cursor, depth + 1);
//         cursor += layoutNodes.get(child.id)!.width;
//       });
//       const firstChild = layoutNodes.get(node.children[0].id)!;
//       const lastChild = layoutNodes.get(node.children[node.children.length - 1].id)!;
//       ln.x = (firstChild.x + lastChild.x) / 2;
//     }

//     if (!rowsByDepth.has(depth)) rowsByDepth.set(depth, []);
//     rowsByDepth.get(depth)!.push(ln);
//   }

//   let cursor = 0;
//   roots.forEach((root, i) => {
//     if (i > 0) cursor += H_GAP * 3; // extra breathing room between separate root trees
//     const w = measure(root, 0);
//     place(root, cursor, 0);
//     cursor += w;
//   });

//   return { layoutNodes, rowsByDepth, totalWidth: cursor };
// }

// // ── Person name block ────────────────────────────────────────────────────
// function PersonName({ name, deceased }: { name: string; deceased: boolean }) {
//   if (!deceased) {
//     return <div className="text-[13px] font-semibold text-slate-900 truncate">{name}</div>;
//   }
//   return (
//     <div className="flex flex-col items-center gap-0.5 min-w-0">
//       <div className="text-[13px] font-semibold text-slate-500 truncate">{name}</div>
//       <span className="text-[8px] font-bold uppercase tracking-wider text-rose-400 leading-none">Deceased</span>
//     </div>
//   );
// }

// // ── Card ──────────────────────────────────────────────────────────────────
// function Card({
//   node, isOnPath, isExpanded, hasChildren, collapsed,
//   onToggle, onShow, onAdd, isReorderMode, onMove, canMoveUp, canMoveDown,
// }: {
//   node: TreeNode;
//   isOnPath: boolean;
//   isExpanded: boolean;
//   hasChildren: boolean;
//   collapsed: boolean;
//   onToggle: () => void;
//   onShow: (id: number) => void;
//   onAdd: (parentId: number) => void;
//   isReorderMode: boolean;
//   onMove?: (direction: 'up' | 'down') => void;
//   canMoveUp: boolean;
//   canMoveDown: boolean;
// }) {
//   const primaryDeceased = !!node.deceased_primary;
//   const spouseDeceased = !!node.deceased_spouse && !!node.spouse_name;
//   const borderColor = isOnPath ? 'border-indigo-600' : 'border-indigo-500';
//   const cardShadow = isOnPath ? 'shadow-indigo-200 ring-2 ring-indigo-500/30' : 'hover:shadow-lg';

//   return (
//     <div
//       className={`relative flex-shrink-0 bg-white border-l-4 rounded-xl p-3 shadow-md transition-all ${borderColor} ${cardShadow}`}
//       style={{ width: CARD_W }}
//     >
//       <div className="flex items-start justify-between gap-1 mb-2">
//         {hasChildren ? (
//           <button
//             onClick={onToggle}
//             className="px-1.5 py-0.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 rounded transition border border-slate-300 flex-shrink-0"
//             title={isExpanded ? 'Collapse' : 'Expand'}
//           >
//             {isExpanded ? '−' : '+'}
//           </button>
//         ) : <div className="w-5" />}
//         <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex-shrink-0">
//           {hasChildren ? `${node.children!.length}` : ''}
//         </div>
//       </div>

//       <div className="mb-2 text-center space-y-0.5">
//         <PersonName name={node.primary_name} deceased={primaryDeceased} />
//         {node.spouse_name && (
//           <>
//             <div className="h-px bg-slate-200 my-1" />
//             <PersonName name={node.spouse_name} deceased={spouseDeceased} />
//           </>
//         )}
//       </div>

//       {(node.city?.trim() || node.state?.trim() || node.country?.trim()) && (
//         <div className="mb-2 text-center px-1">
//           <p className="text-[10px] text-slate-500 font-medium leading-tight truncate">
//             {[node.city, node.state, node.country].filter(v => typeof v === 'string' && v.trim() !== '').join(', ')}
//           </p>
//         </div>
//       )}

//       <div className="flex gap-1.5">
//         <button
//           type="button"
//           onClick={(e) => { e.stopPropagation(); onShow(node.id); }}
//           className="flex-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 transition"
//         >
//           View
//         </button>
//         <button
//           type="button"
//           onClick={(e) => { e.stopPropagation(); onAdd(node.id); }}
//           className="flex-1 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600 transition"
//         >
//           + Child
//         </button>
//       </div>

//       {collapsed && (
//         <div className="mt-2 text-center">
//           <button
//             onClick={onToggle}
//             className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
//           >
//             Show {node.children!.length} descendant{node.children!.length !== 1 ? 's' : ''} ↓
//           </button>
//         </div>
//       )}

//       {isReorderMode && (canMoveUp || canMoveDown) && (
//         <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
//           <button onClick={() => onMove?.('up')} disabled={!canMoveUp} className="w-6 h-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded shadow">←</button>
//           <button onClick={() => onMove?.('down')} disabled={!canMoveDown} className="w-6 h-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded shadow">→</button>
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Main canvas (pan + zoom + render) ───────────────────────────────────
// export default function FamilyTree({ nodes, onShow, onAdd, onReorder, highlightPathIds = [] }: FamilyTreeProps) {
//   const [isReorderMode, setIsReorderMode] = useState(false);
//   // expandedIds: positive id => force-expanded, (-id - 1) => force-collapsed.
//   // Anything not in the set falls back to the default-depth rule.
//   const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
//   const [zoom, setZoom] = useState(1);
//   const [pan, setPan] = useState({ x: 24, y: 24 });
//   const [isPanning, setIsPanning] = useState(false);
//   const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
//   const viewportRef = useRef<HTMLDivElement>(null);

//   const DEFAULT_DEPTH_CUTOFF = 1; // root (0) + its direct children (depth<1 expanded) visible; rest collapsed

//   const toggle = useCallback((id: number, depth: number) => {
//     setExpandedIds(prev => {
//       const currentlyExpanded = prev.has(id) ? true : prev.has(-id - 1) ? false : depth < DEFAULT_DEPTH_CUTOFF;
//       const next = new Set(prev);
//       next.delete(id);
//       next.delete(-id - 1);
//       if (currentlyExpanded) {
//         next.add(-id - 1); // was expanded -> force collapse
//       } else {
//         next.add(id); // was collapsed -> force expand
//       }
//       return next;
//     });
//   }, []);

//   // Auto-expand every ancestor of any highlighted node, so search results
//   // are never hidden inside a collapsed branch.
//   useEffect(() => {
//     if (!highlightPathIds.length) return;
//     setExpandedIds(prev => {
//       const next = new Set(prev);
//       highlightPathIds.forEach(id => {
//         next.delete(-id - 1);
//         next.add(id);
//       });
//       return next;
//     });
//   }, [highlightPathIds]);

//   const { layoutNodes, rowsByDepth, totalWidth } = useMemo(
//     () => buildLayout(nodes, expandedIds, DEFAULT_DEPTH_CUTOFF),
//     [nodes, expandedIds]
//   );

//   const maxDepth = useMemo(() => Math.max(0, ...Array.from(rowsByDepth.keys())), [rowsByDepth]);
//   const canvasWidth = Math.max(totalWidth, 600);
//   const canvasHeight = (maxDepth + 1) * (CARD_H + ROW_GAP);

//   // Focus (scroll + zoom) on the deepest highlighted node, once per search.
//   useEffect(() => {
//     if (!highlightPathIds.length || !viewportRef.current) return;
//     const targetId = highlightPathIds[highlightPathIds.length - 1];
//     // Wait a tick so layout has recomputed after auto-expand above.
//     const t = setTimeout(() => {
//       const ln = layoutNodes.get(targetId);
//       const vp = viewportRef.current;
//       if (!ln || !vp) return;
//       const vw = vp.clientWidth, vh = vp.clientHeight;
//       setZoom(1);
//       setPan({
//         x: vw / 2 - ln.x,
//         y: vh / 2 - (ln.depth * (CARD_H + ROW_GAP) + CARD_H / 2),
//       });
//     }, 50);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [highlightPathIds.join(',')]);

//   // ── Pan handlers ──
//   const onPointerDown = (e: React.PointerEvent) => {
//     if ((e.target as HTMLElement).closest('button')) return;
//     setIsPanning(true);
//     panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
//     (e.target as HTMLElement).setPointerCapture(e.pointerId);
//   };
//   const onPointerMove = (e: React.PointerEvent) => {
//     if (!isPanning) return;
//     setPan({
//       x: panStart.current.panX + (e.clientX - panStart.current.x),
//       y: panStart.current.panY + (e.clientY - panStart.current.y),
//     });
//   };
//   const onPointerUp = () => setIsPanning(false);

//   const onWheel = (e: React.WheelEvent) => {
//     if (!e.ctrlKey && !e.metaKey) return; // require modifier so normal page scroll still works
//     e.preventDefault();
//     const delta = -e.deltaY * 0.001;
//     setZoom(z => Math.min(2, Math.max(0.3, z + delta)));
//   };

//   const zoomIn = () => setZoom(z => Math.min(2, z + 0.15));
//   const zoomOut = () => setZoom(z => Math.max(0.3, z - 0.15));
//   const resetView = () => { setZoom(1); setPan({ x: 24, y: 24 }); };
//   const expandAll = () => {
//     const all = new Set<number>();
//     const walk = (n: TreeNode) => { all.add(n.id); n.children?.forEach(walk); };
//     nodes.forEach(walk);
//     setExpandedIds(all);
//   };
//   const collapseToDefault = () => setExpandedIds(new Set());

//   const siblingGroups = useMemo(() => {
//     const groups = new Map<number, TreeNode[]>(); // parentId(or -1 for roots) -> ordered children
//     function walk(list: TreeNode[], parentKey: number) {
//       groups.set(parentKey, list);
//       list.forEach(n => { if (n.children?.length) walk(n.children, n.id); });
//     }
//     walk(nodes, -1);
//     return groups;
//   }, [nodes]);

//   if (nodes.length === 0) {
//     return <div className="py-8 sm:py-16 text-center text-slate-500 text-sm sm:text-base">No family tree data found yet.</div>;
//   }

//   // Build sibling-group lookup for reorder up/down within a row segment
  

//   return (
//     <div className="w-full border border-slate-200 rounded-lg sm:rounded-[1.5rem] bg-slate-50 overflow-hidden">
//       {/* Toolbar */}
//       <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-slate-200 bg-white">
//         <div className="flex items-center gap-1.5 flex-wrap">
//           <button onClick={zoomOut} className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 transition" title="Zoom out">−</button>
//           <span className="text-xs font-semibold text-slate-500 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
//           <button onClick={zoomIn} className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 transition" title="Zoom in">+</button>
//           <button onClick={resetView} className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition">Reset view</button>
//           <div className="w-px h-6 bg-slate-200 mx-1" />
//           <button onClick={collapseToDefault} className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition">Collapse all</button>
//           <button onClick={expandAll} className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition">Expand all</button>
//         </div>
//         <button
//           onClick={() => setIsReorderMode(!isReorderMode)}
//           className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition shadow flex items-center gap-2 ${isReorderMode ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
//         >
//           {isReorderMode ? 'Finish Reordering' : 'Enable Reordering'}
//         </button>
//       </div>

//       {/* Hint */}
//       <div className="px-3 sm:px-4 py-1.5 text-[11px] text-slate-400 bg-white border-b border-slate-100">
//         Drag to pan · Ctrl/⌘ + scroll to zoom · Click − / + on a card to expand or collapse its branch
//       </div>

//       {/* Canvas viewport */}
//       <div
//         ref={viewportRef}
//         className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
//         style={{ height: 'min(70vh, 640px)', touchAction: 'none' }}
//         onPointerDown={onPointerDown}
//         onPointerMove={onPointerMove}
//         onPointerUp={onPointerUp}
//         onPointerLeave={onPointerUp}
//         onWheel={onWheel}
//       >
//         <div
//           className="absolute top-0 left-0"
//           style={{
//             width: canvasWidth,
//             height: canvasHeight,
//             transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
//             transformOrigin: '0 0',
//           }}
//         >
//           {/* Connectors — drawn first so cards sit above them */}
//           <svg
//             className="absolute top-0 left-0 pointer-events-none overflow-visible"
//             width={canvasWidth}
//             height={canvasHeight}
//           >
//             {Array.from(layoutNodes.values()).map(ln => {
//               if (ln.collapsed || !ln.node.children?.length) return null;
//               const parentX = ln.x;
//               const parentY = ln.depth * (CARD_H + ROW_GAP) + CARD_H;
//               const midY = parentY + ROW_GAP / 2;
//               const childLayouts = ln.node.children.map(c => layoutNodes.get(c.id)!);
//               const isParentOnPath = highlightPathIds.includes(ln.node.id);

//               return (
//                 <g key={`conn-${ln.node.id}`}>
//                   {/* trunk down from parent */}
//                   <line x1={parentX} y1={parentY} x2={parentX} y2={midY}
//                     stroke={isParentOnPath ? '#6366f1' : '#cbd5e1'} strokeWidth={isParentOnPath ? 3 : 2} />
//                   {/* horizontal bar spanning children */}
//                   {childLayouts.length > 1 && (
//                     <line x1={childLayouts[0].x} y1={midY} x2={childLayouts[childLayouts.length - 1].x} y2={midY}
//                       stroke="#cbd5e1" strokeWidth={2} />
//                   )}
//                   {/* drop to each child */}
//                   {childLayouts.map(cl => {
//                     const childOnPath = highlightPathIds.includes(cl.node.id);
//                     return (
//                       <line key={`drop-${cl.node.id}`} x1={cl.x} y1={midY} x2={cl.x} y2={cl.depth * (CARD_H + ROW_GAP)}
//                         stroke={childOnPath ? '#6366f1' : '#cbd5e1'} strokeWidth={childOnPath ? 3 : 2} />
//                     );
//                   })}
//                 </g>
//               );
//             })}
//           </svg>

//           {/* Cards */}
//           {Array.from(layoutNodes.values()).map(ln => {
//             const hasChildren = !!ln.node.children?.length;
//             const isExpandedNode = hasChildren && !ln.collapsed;
//             const siblings = siblingGroups.get(ln.node.parent_id ?? -1) ?? [ln.node];
//             const idx = siblings.findIndex(s => s.id === ln.node.id);

//             return (
//               <div
//                 key={ln.node.id}
//                 className="absolute"
//                 style={{
//                   left: ln.x - CARD_W / 2,
//                   top: ln.depth * (CARD_H + ROW_GAP),
//                 }}
//               >
//                 <Card
//                   node={ln.node}
//                   isOnPath={highlightPathIds.includes(ln.node.id)}
//                   isExpanded={isExpandedNode}
//                   hasChildren={hasChildren}
//                   collapsed={ln.collapsed}
//                   onToggle={() => toggle(ln.node.id, ln.depth)}
//                   onShow={onShow}
//                   onAdd={onAdd}
//                   isReorderMode={isReorderMode}
//                   canMoveUp={idx > 0}
//                   canMoveDown={idx >= 0 && idx < siblings.length - 1}
//                   onMove={(direction) => {
//                     if (idx < 0) return;
//                     const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
//                     if (targetIdx < 0 || targetIdx >= siblings.length) return;
//                     const reordered = [...siblings];
//                     [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
//                     const parentKey = ln.node.parent_id ?? 0;
//                     onReorder?.(parentKey, reordered.map((n, i) => ({ user_id: n.id, order: i })));
//                   }}
//                 />
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Minimap */}
//       <Minimap
//         layoutNodes={layoutNodes}
//         canvasWidth={canvasWidth}
//         canvasHeight={canvasHeight}
//         viewportRef={viewportRef}
//         pan={pan}
//         zoom={zoom}
//         setPan={setPan}
//         highlightPathIds={highlightPathIds}
//       />
//     </div>
//   );
// }

// // ── Minimap: small overview + click-to-jump ─────────────────────────────
// function Minimap({
//   layoutNodes, canvasWidth, canvasHeight, viewportRef, pan, zoom, setPan, highlightPathIds,
// }: {
//   layoutNodes: Map<number, LayoutNode>;
//   canvasWidth: number;
//   canvasHeight: number;
//   viewportRef: React.RefObject<HTMLDivElement | null>;
//   pan: { x: number; y: number };
//   zoom: number;
//   setPan: (p: { x: number; y: number }) => void;
//   highlightPathIds: number[];
// }) {
//   const MM_W = 200;
//   const scale = MM_W / Math.max(canvasWidth, 1);
//   const mmH = canvasHeight * scale;
//   const vp = viewportRef.current;
//   const vpW = vp?.clientWidth ?? 0;
//   const vpH = vp?.clientHeight ?? 0;

//   const boxX = (-pan.x / zoom) * scale;
//   const boxY = (-pan.y / zoom) * scale;
//   const boxW = (vpW / zoom) * scale;
//   const boxH = (vpH / zoom) * scale;

//   const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     const clickX = (e.clientX - rect.left) / scale;
//     const clickY = (e.clientY - rect.top) / scale;
//     if (!vp) return;
//     setPan({
//       x: vp.clientWidth / 2 - clickX * zoom,
//       y: vp.clientHeight / 2 - clickY * zoom,
//     });
//   };

//   if (canvasWidth <= 700 && canvasHeight <= 700) return null; // skip for small trees, not useful

//   return (
//     <div className="hidden sm:block absolute bottom-4 right-4 bg-white/95 backdrop-blur border border-slate-300 rounded-lg shadow-lg p-1.5" style={{ pointerEvents: 'auto' }}>
//       <div
//         className="relative bg-slate-100 rounded cursor-pointer overflow-hidden"
//         style={{ width: MM_W, height: Math.max(mmH, 40) }}
//         onClick={handleClick}
//         title="Click to jump"
//       >
//         {Array.from(layoutNodes.values()).map(ln => (
//           <div
//             key={ln.node.id}
//             className={`absolute rounded-sm ${highlightPathIds.includes(ln.node.id) ? 'bg-indigo-600' : 'bg-indigo-300'}`}
//             style={{
//               left: (ln.x - CARD_W / 2) * scale,
//               top: ln.depth * (CARD_H + ROW_GAP) * scale,
//               width: Math.max(CARD_W * scale, 2),
//               height: Math.max(CARD_H * scale, 2),
//             }}
//           />
//         ))}
//         <div
//           className="absolute border-2 border-rose-500 bg-rose-500/10 pointer-events-none"
//           style={{ left: boxX, top: boxY, width: boxW, height: boxH }}
//         />
//       </div>
//     </div>
//   );
// }