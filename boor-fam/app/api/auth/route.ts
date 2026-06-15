import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { log } from '@/app/lib/logger';

export async function POST(req: Request) {
  try {
    const { email, pin } = await req.json();
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`SELECT * FROM users WHERE primary_email = ${email} OR spouse_email = ${email}`;
    
    if (result.length === 0) {
      await log({
        action:       'USER_LOGIN_FAILED',
        performed_by: email,
        details:      'Email not found in records',
      });
      return NextResponse.json({ success: false, message: "Email not found in our records." }, { status: 401 });
    }

    const user = result[0];

    if (user.pin !== pin) {
      await log({
        action:       'USER_LOGIN_FAILED',
        performed_by: email,
        details:      'Incorrect PIN',
      });
      return NextResponse.json({ success: false, message: "Incorrect PIN. Please try again." }, { status: 401 });
    }

    await log({
      action:       'USER_LOGIN',
      performed_by: user.primary_email,
      details:      'Successful login',
    });

    return NextResponse.json({ success: true, email: user.primary_email, id: user.id });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const email = req.headers.get('x-user-email');
    if (!email) {
      return NextResponse.json({ error: 'Email not provided' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT id, primary_name, primary_email, spouse_name, spouse_email, dob::text AS dob, gender, contact, spouse_contact, address, city, state, country FROM users WHERE primary_email = ${email} OR spouse_email = ${email}`;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Auth GET Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}