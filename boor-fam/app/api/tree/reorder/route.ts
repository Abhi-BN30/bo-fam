import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { log } from '@/app/lib/logger';

export async function POST(req: Request) {
  const performedBy = req.headers.get('x-user-email') || 'anonymous';
  const { updates } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'Invalid updates' }, { status: 400 });
  }

  try {
    for (const { user_id, order } of updates) {
      await sql`UPDATE family_tree SET "order" = ${order} WHERE user_id = ${user_id}`;
    }

    await log({
      action:       'TREE_NODE_REORDERED',
      performed_by: performedBy,
      details:      `Reordered ${updates.length} node(s)`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error reordering:', err);
    return NextResponse.json({ error: 'Failed to reorder nodes' }, { status: 500 });
  }
}