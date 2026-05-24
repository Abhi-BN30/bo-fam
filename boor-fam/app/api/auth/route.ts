import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);
  
  const user = await sql`SELECT * FROM users WHERE primary_email = ${email}`;
  
  if (user.length > 0) {
    return NextResponse.json({ success: true, user: user[0] });
  } else {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
  }
}