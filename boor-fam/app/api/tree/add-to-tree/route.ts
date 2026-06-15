import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { log } from '@/app/lib/logger';

export async function POST(req: Request) {
  const performedBy = req.headers.get('x-user-email') || 'anonymous';
  const { user_id, parent_id } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);

  if (!user_id || !parent_id) {
    return NextResponse.json({ error: 'Missing user_id or parent_id' }, { status: 400 });
  }

  try {
    // Fetch names for a meaningful log entry
    const [childRecord, parentRecord] = await Promise.all([
      sql`SELECT primary_name FROM users WHERE id = ${user_id}`,
      sql`SELECT primary_name FROM users WHERE id = ${parent_id}`,
    ]);
    const childName  = childRecord[0]?.primary_name  ?? `id:${user_id}`;
    const parentName = parentRecord[0]?.primary_name ?? `id:${parent_id}`;

    const existing = await sql`SELECT * FROM family_tree WHERE user_id = ${user_id}`;

    if (existing.length > 0) {
      await sql`UPDATE family_tree SET parent_id = ${parent_id} WHERE user_id = ${user_id}`;
    } else {
      const maxOrder = await sql`SELECT MAX("order") as max_order FROM family_tree WHERE parent_id = ${parent_id}`;
      const nextOrder = (maxOrder[0]?.max_order || 0) + 1;
      await sql`INSERT INTO family_tree (user_id, parent_id, "order") VALUES (${user_id}, ${parent_id}, ${nextOrder})`;
    }

    await log({
      action:       'TREE_NODE_ADDED',
      performed_by: performedBy,
      target_user:  childName,
      details:      `Linked "${childName}" under parent "${parentName}"`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error adding to tree:', err);
    return NextResponse.json({ error: 'Failed to add to tree' }, { status: 500 });
  }
}