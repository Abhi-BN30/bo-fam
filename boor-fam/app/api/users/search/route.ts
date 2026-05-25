import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const excludeId = url.searchParams.get('excludeId');
  
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    let users;
    if (excludeId) {
      users = await sql`SELECT id, primary_name, spouse_name FROM users WHERE id != ${parseInt(excludeId)} ORDER BY primary_name`;
    } else {
      users = await sql`SELECT id, primary_name, spouse_name FROM users ORDER BY primary_name`;
    }
    return NextResponse.json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
