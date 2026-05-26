import { Handle, Position } from 'reactflow';
import Image from 'next/image';

interface CoupleNodeData {
  id: number;
  primary_name: string;
  spouse_name: string;
  // optional callbacks passed in node data
  onShow?: (id: number) => void;
  onAdd?: (parentId: number) => void;
}

interface CoupleNodeProps {
  data: CoupleNodeData;
}

export default function CoupleNode({ data }: CoupleNodeProps) {
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onAdd?.(data.id);
  };

  const handleShow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    data.onShow?.(data.id);
  };

  return (
    <div onClick={handleShow} className="cursor-pointer bg-white border-2 border-indigo-500 rounded-xl p-4 shadow-lg min-w-[200px] text-center hover:scale-105 transition-transform">
      <Handle type="target" position={Position.Top} />
      <div className="font-bold text-indigo-900">{data.primary_name}{data.spouse_name ? ` & ${data.spouse_name}` : ''}</div>
      <div className="mt-2 flex justify-center">
        <button onClick={handleAdd} className="text-sm bg-green-500 text-white px-3 py-1 rounded-full">Add Member</button>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}