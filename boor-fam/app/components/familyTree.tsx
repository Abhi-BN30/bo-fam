

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
  children: TreeNode[];
}

interface FamilyTreeProps {
  nodes: TreeNode[];
  onShow: (id: number) => void;
  onAdd: (parentId: number) => void;
  onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
}

interface TreeNodeProps {
  node: TreeNode;
  onShow: (id: number) => void;
  onAdd: (parentId: number) => void;
  onReorder?: (parentId: number, updates: Array<{ user_id: number; order: number }>) => void;
  level?: number;
  childIndex?: number;
  totalSiblings?: number;
}

function TreeNodeComponent({ node, onShow, onAdd, onReorder, level = 0, childIndex = 0, totalSiblings = 1 }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = node.children && node.children.length > 0;

  const handleMoveChild = (childId: number, direction: 'up' | 'down') => {
    if (!hasChildren || !node.children) return;

    const children = [...node.children];
    const currentIndex = children.findIndex(c => c.id === childId);
    
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
      [children[currentIndex], children[currentIndex - 1]] = [children[currentIndex - 1], children[currentIndex]];
    } else if (direction === 'down' && currentIndex < children.length - 1) {
      [children[currentIndex], children[currentIndex + 1]] = [children[currentIndex + 1], children[currentIndex]];
    } else {
      return;
    }

    const updates = children.map((child, idx) => ({
      user_id: child.id,
      order: idx,
    }));

    onReorder?.(node.id, updates);
  };

  // Increased indent: 3rem or 5rem depending on screen size
  const indentClass = "ml-16 sm:ml-20";
  const connectorOffset = "2.5rem"; // Vertical position of the horizontal arm

  return (
    <div className="relative flex flex-col items-start">
      {/* Node Content */}
      <div className="flex items-start gap-2 sm:gap-4 mb-6 relative">
        {/* Horizontal Connector to the vertical sibling line */}
        {level > 0 && (
          <div 
            className="absolute border-t-2 border-slate-300" 
            style={{ left: '-3rem', top: '2.5rem', width: '3rem' }}
          />
        )}

        {/* Reorder buttons */}
        {level > 0 && (
          <div className="flex flex-col gap-1 pt-4">
            <button
              onClick={() => handleMoveChild(node.id, 'up')}
              disabled={childIndex === 0}
              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded transition min-w-max"
              title="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => handleMoveChild(node.id, 'down')}
              disabled={childIndex === totalSiblings - 1}
              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded transition min-w-max"
              title="Move down"
            >
              ↓
            </button>
          </div>
        )}

        {/* User Card - Improved UI */}
        <div className="flex-shrink-0 bg-white border-l-4 border-indigo-500 rounded-xl p-4 sm:p-5 w-56 sm:w-64 shadow-md hover:shadow-xl transition-shadow">
          {/* Header with expand button */}
          <div className="flex items-start justify-between gap-2 mb-3">
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded transition border border-slate-300 flex-shrink-0"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            {!hasChildren && <div className="w-12" />}
            
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex-shrink-0">
              {hasChildren ? `${node.children!.length} child${node.children!.length !== 1 ? 'ren' : ''}` : ''}
            </div>
          </div>

          {/* Name section - center aligned, same size/color */}
          <div className="mb-3 text-center">
            <div className="text-sm font-semibold text-slate-900">{node.primary_name}</div>
            {node.spouse_name && (
              <>
                <div className="h-px bg-slate-200 my-2" />
                <div className="text-sm font-semibold text-slate-900">{node.spouse_name}</div>
              </>
            )}
          </div>

          {/* Location section - visible in lighter color */}
          {(node.country || node.state || node.city) && (
            <div className="mb-3 text-xs text-slate-500 text-center space-y-0.5">
              {node.country && <div>{node.country}</div>}
              {node.state && <div>{node.state}</div>}
              {node.city && <div>{node.city}</div>}
            </div>
          )}

          {/* Contact info - minimal */}
          {(node.contact || node.primary_email) && (
            <div className="mb-3 text-xs text-slate-600 space-y-0.5 pb-3 border-b border-slate-100">
              {node.contact && <div className="truncate"><span className="font-semibold">Ph:</span> {node.contact}</div>}
              {node.primary_email && <div className="truncate"><span className="font-semibold">Email:</span> {node.primary_email}</div>}
            </div>
          )}

          {/* Action buttons */}
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
              onClick={(e) => {
                e.stopPropagation();
                onAdd(node.id);
              }}
              className="flex-1 rounded-md bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Children Container */}
      {isExpanded && hasChildren && (
        <div className={`relative ${indentClass}`}>
          {node.children!.map((child, idx) => (
            <div key={child.id} className="relative">
              {/* Vertical Connector Line - Stops at the last child */}
              <div 
                className="absolute bg-slate-300"
                style={{ 
                  left: '-3rem', 
                  top: 0, 
                  width: '2px', 
                  height: idx === node.children!.length - 1 ? '2.5rem' : '100%' 
                }} 
              />
              <TreeNodeComponent
                node={child}
                onShow={onShow}
                onAdd={onAdd}
                onReorder={onReorder}
                level={level + 1}
                childIndex={idx}
                totalSiblings={node.children!.length}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FamilyTree({ nodes, onShow, onAdd, onReorder }: FamilyTreeProps) {
  if (nodes.length === 0) {
    return <div className="py-8 sm:py-16 text-center text-slate-500 text-sm sm:text-base">No family tree data found yet.</div>;
  }

  return (
    <div className="w-full overflow-auto border border-slate-200 rounded-lg bg-slate-50 p-8">
      <div className="relative space-y-12">
        {nodes.map((root) => (
          <TreeNodeComponent
            key={root.id}
            node={root}
            onShow={onShow}
            onAdd={onAdd}
            onReorder={onReorder}
            level={0}
          />
        ))}
      </div>
    </div>
  );
}
