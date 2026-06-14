// app/api/tree/route.ts
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const data = await sql`
    SELECT u.id, u.primary_name, u.spouse_name, u.dob::text AS dob, u.city, u.gender,
           u.state, u.country, u.contact, u.primary_email,
           u.spouse_contact, u.spouse_email,
           u.deceased_primary, u.deceased_spouse,
           u.anniversary::text AS anniversary,
           t.parent_id, t."order"
    FROM users u 
    INNER JOIN family_tree t ON u.id = t.user_id
    ORDER BY t.parent_id, t."order"
  `;
  return NextResponse.json(data);
}