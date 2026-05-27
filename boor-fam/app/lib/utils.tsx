import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 150, ranksep: 100 });
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 160, height: 80 }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map((node) => ({ ...node, position: dagreGraph.node(node.id) })),
    edges
  };
};

export interface FlattenedNode {
  id: number;
  parent_id?: number | null;
  primary_name: string;
  spouse_name?: string;
}

export const calculateGeneration = (userId: number, allNodes: FlattenedNode[]): number => {
  const nodeMap = new Map<number, FlattenedNode>();
  allNodes.forEach(node => nodeMap.set(node.id, node));

  let currentId: number | null | undefined = userId;
  let generation = 0;

  while (currentId) {
    generation++;
    const node = nodeMap.get(currentId);
    if (!node) break;
    currentId = node.parent_id;
  }

  return generation;
};

export const categorizeRelationships = (userId: number, allNodes: FlattenedNode[]): { relationship: string; users: FlattenedNode[] } => {
  const nodeMap = new Map<number, FlattenedNode>();
  allNodes.forEach(node => nodeMap.set(node.id, node));

  const userGen = calculateGeneration(userId, allNodes);
  const sameGenUsers = allNodes.filter(node => 
    node.id !== userId && calculateGeneration(node.id, allNodes) === userGen
  );

  if (sameGenUsers.length === 0) {
    return { relationship: 'no-relations', users: [] };
  }

  // Get user's parent and grandparent
  const userNode = nodeMap.get(userId);
  const userParent = userNode?.parent_id ? nodeMap.get(userNode.parent_id) : null;
  const userGrandparent = userParent?.parent_id ? nodeMap.get(userParent.parent_id) : null;

  // Find siblings (same parent)
  const siblings = sameGenUsers.filter(node => {
    const nodeParent = node.parent_id ? nodeMap.get(node.parent_id) : null;
    return nodeParent?.id === userParent?.id;
  });

  if (siblings.length > 0) {
    return { relationship: 'sibling', users: siblings };
  }

  // Find first cousins (same grandparent)
  const firstCousins = sameGenUsers.filter(node => {
    const nodeParent = node.parent_id ? nodeMap.get(node.parent_id) : null;
    const nodeGrandparent = nodeParent?.parent_id ? nodeMap.get(nodeParent.parent_id) : null;
    return nodeGrandparent?.id === userGrandparent?.id && nodeGrandparent?.id !== null;
  });

  if (firstCousins.length > 0) {
    return { relationship: 'first-cousin', users: firstCousins };
  }

  // Remaining are distant cousins
  const distantCousins = sameGenUsers.filter(node => {
    const nodeParent = node.parent_id ? nodeMap.get(node.parent_id) : null;
    const nodeGrandparent = nodeParent?.parent_id ? nodeMap.get(nodeParent.parent_id) : null;
    return nodeGrandparent?.id !== userGrandparent?.id;
  });

  return { relationship: 'distant-cousin', users: distantCousins };
};

export const findAllRelationsAtGeneration = (userId: number, allNodes: FlattenedNode[]): Array<{ user: FlattenedNode; relationship: string }> => {
  const nodeMap = new Map<number, FlattenedNode>();
  allNodes.forEach(node => nodeMap.set(node.id, node));

  const userGen = calculateGeneration(userId, allNodes);
  const sameGenUsers = allNodes.filter(node => 
    node.id !== userId && calculateGeneration(node.id, allNodes) === userGen
  );

  // Get user's parent and grandparent
  const userNode = nodeMap.get(userId);
  const userParent = userNode?.parent_id ? nodeMap.get(userNode.parent_id) : null;
  const userGrandparent = userParent?.parent_id ? nodeMap.get(userParent.parent_id) : null;

  return sameGenUsers.map(node => {
    const nodeParent = node.parent_id ? nodeMap.get(node.parent_id) : null;
    const nodeGrandparent = nodeParent?.parent_id ? nodeMap.get(nodeParent.parent_id) : null;

    if (nodeParent?.id === userParent?.id) {
      return { user: node, relationship: 'Sibling' };
    } else if (nodeGrandparent?.id === userGrandparent?.id && nodeGrandparent?.id !== null) {
      return { user: node, relationship: 'First Cousin' };
    } else {
      return { user: node, relationship: 'Distant Cousin' };
    }
  });
};