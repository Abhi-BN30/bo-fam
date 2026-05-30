// app/api/tree/route.ts
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const data = await sql`
    SELECT u.id, u.primary_name, u.spouse_name, u.dob, u.city, u.state, u.country, t.parent_id, t."order"
    FROM users u 
    INNER JOIN family_tree t ON u.id = t.user_id
    ORDER BY t.parent_id, t."order"
  `;
  return NextResponse.json(data);
}