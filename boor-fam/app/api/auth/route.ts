import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, pin } = await req.json();
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`SELECT * FROM users WHERE primary_email = ${email} OR spouse_email = ${email}`;
    
    if (result.length === 0) {
      return NextResponse.json({ success: false, message: "Email not found in our records." }, { status: 401 });
    }

    const user = result[0];

    if (user.pin !== pin) {
      return NextResponse.json({ success: false, message: "Incorrect PIN. Please try again." }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}