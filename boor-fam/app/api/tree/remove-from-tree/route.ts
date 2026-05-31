import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const sql = neon(process.env.DATABASE_URL!);
  const { id } = await req.json();

  console.log('Removing user from tree:', id);
  await sql`DELETE FROM family_tree WHERE parent_id = ${id};`;
  await sql`DELETE FROM family_tree WHERE user_id = ${id};`;
  return NextResponse.json({ success: true });
}