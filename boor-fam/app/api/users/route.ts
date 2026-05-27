import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  const { primary_name, spouse_name, primary_email, dob, parent_id, contact, spouse_email, address, city, state, country } = await req.json();
  const res = await sql`INSERT INTO users (primary_name, spouse_name, primary_email, dob, contact, spouse_email, address, city, state, country) 
    VALUES (${primary_name}, ${spouse_name}, ${primary_email}, ${dob}, ${contact}, ${spouse_email}, ${address || null}, ${city || null}, ${state || null}, ${country || null}) RETURNING id`;
  if (parent_id) await sql`INSERT INTO family_tree (user_id, parent_id) VALUES (${res[0].id}, ${parent_id})`;
  return NextResponse.json({ id: res[0].id });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await sql`DELETE FROM family_tree WHERE user_id = ${id} OR parent_id = ${id}`;
  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const { id, primary_name, spouse_name, dob, contact, spouse_email, primary_email, address, city, state, country } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'missing id' }, { status: 400 });
  }

  const result = await sql`UPDATE users SET primary_name=${primary_name}, spouse_name=${spouse_name}, dob=${dob}, contact=${contact}, spouse_email=${spouse_email}, primary_email=${primary_email}, address=${address || null}, city=${city || null}, state=${state || null}, country=${country || null} WHERE id=${id} RETURNING *`;

  return NextResponse.json(result[0] || null);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  const res = await sql`SELECT * FROM users WHERE id = ${id}`;
  return NextResponse.json(res[0] || null);
}
