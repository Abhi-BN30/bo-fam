import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
const sql = neon(process.env.DATABASE_URL!);
const emailFrom = (req: Request) => (req.headers.get('x-user-email') || '').trim().toLowerCase();

export async function POST(req: Request) {
  const email = emailFrom(req);
  if (!email) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { subscription } = await req.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
  }
  // A new subscriber starts with both reminder categories enabled and a 1-day lead time.
  // Existing choices are preserved by DO NOTHING.
  await sql`INSERT INTO notification_preferences (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING`;
  await sql`INSERT INTO push_subscriptions (email, endpoint, p256dh, auth, updated_at)
    VALUES (${email}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, NOW())
    ON CONFLICT (endpoint) DO UPDATE SET email = EXCLUDED.email,
      p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, updated_at = NOW()`;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const email = emailFrom(req);
  if (!email) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { endpoint } = await req.json();
  if (endpoint) await sql`DELETE FROM push_subscriptions WHERE email = ${email} AND endpoint = ${endpoint}`;
  return NextResponse.json({ success: true });
}
