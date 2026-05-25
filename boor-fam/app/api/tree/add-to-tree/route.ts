import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { user_id, parent_id } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);

  if (!user_id || !parent_id) {
    return NextResponse.json({ error: 'Missing user_id or parent_id' }, { status: 400 });
  }

  try {
    // Check if user already has a parent_id entry
    const existing = await sql`SELECT * FROM family_tree WHERE user_id = ${user_id}`;
    
    if (existing.length > 0) {
      // Update existing entry
      await sql`UPDATE family_tree SET parent_id = ${parent_id} WHERE user_id = ${user_id}`;
    } else {
      // Create new entry with default order
      const maxOrder = await sql`SELECT MAX("order") as max_order FROM family_tree WHERE parent_id = ${parent_id}`;
      const nextOrder = (maxOrder[0]?.max_order || 0) + 1;
      
      await sql`INSERT INTO family_tree (user_id, parent_id, "order") VALUES (${user_id}, ${parent_id}, ${nextOrder})`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error adding to tree:', err);
    return NextResponse.json({ error: 'Failed to add to tree' }, { status: 500 });
  }
}
