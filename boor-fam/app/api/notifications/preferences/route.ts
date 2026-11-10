import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
const sql = neon(process.env.DATABASE_URL!);
const emailFrom = (req: Request) => (req.headers.get('x-user-email') || '').trim().toLowerCase();
export async function GET(req: Request) {
  const email = emailFrom(req);
  if (!email) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const rows = await sql`SELECT email, birthdays_enabled, anniversaries_enabled, reminder_days FROM notification_preferences WHERE email = ${email} LIMIT 1`;
  return NextResponse.json(rows[0] || { email, birthdays_enabled: true, anniversaries_enabled: true, reminder_days: 1 });
}
export async function PUT(req: Request) {
  const email = emailFrom(req);
  if (!email) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = await req.json();
  const birthdays = body.birthdays_enabled !== false;
  const anniversaries = body.anniversaries_enabled !== false;
  const reminderDays = Number(body.reminder_days);
  if (![0, 1, 3, 7].includes(reminderDays)) return NextResponse.json({ error: 'Reminder must be 0, 1, 3 or 7 days' }, { status: 400 });
  const rows = await sql`INSERT INTO notification_preferences (email, birthdays_enabled, anniversaries_enabled, reminder_days, updated_at)
    VALUES (${email}, ${birthdays}, ${anniversaries}, ${reminderDays}, NOW())
    ON CONFLICT (email) DO UPDATE SET birthdays_enabled = EXCLUDED.birthdays_enabled, anniversaries_enabled = EXCLUDED.anniversaries_enabled, reminder_days = EXCLUDED.reminder_days, updated_at = NOW()
    RETURNING email, birthdays_enabled, anniversaries_enabled, reminder_days`;
  return NextResponse.json(rows[0]);
}
