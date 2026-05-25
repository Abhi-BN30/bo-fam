import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { updates } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'Invalid updates' }, { status: 400 });
  }

  try {
    // Update all orders in a transaction-like manner
    for (const { user_id, order } of updates) {
      await sql`UPDATE family_tree SET "order" = ${order} WHERE user_id = ${user_id}`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error reordering:', err);
    return NextResponse.json({ error: 'Failed to reorder nodes' }, { status: 500 });
  }
}
