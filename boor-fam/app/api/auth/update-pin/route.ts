import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, oldPin, newPin } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
    }

    if (typeof oldPin !== 'number' || typeof newPin !== 'number') {
      return NextResponse.json({ success: false, message: 'Old PIN and new PIN must be numbers.' }, { status: 400 });
    }

    if (String(oldPin).length !== 4 || String(newPin).length !== 4) {
      return NextResponse.json({ success: false, message: 'PIN must be exactly 4 digits.' }, { status: 400 });
    }

    if (oldPin === newPin) {
      return NextResponse.json({ success: false, message: 'New PIN must be different from old PIN.' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Update by primary_email as requested.
    const result = await sql`
      UPDATE users
      SET pin = ${newPin}
      WHERE primary_email = ${email}
        AND pin = ${oldPin}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Incorrect old PIN or email not found.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result[0] });
  } catch (error) {
    console.error('Update PIN error:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

