// app/api/tree/route.ts
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const data = await sql`
    SELECT u.id, u.primary_name, u.spouse_name, t.parent_id 
    FROM users u 
    LEFT JOIN family_tree t ON u.id = t.user_id
  `;
  return NextResponse.json(data);
}