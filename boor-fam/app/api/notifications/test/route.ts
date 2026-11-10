import { neon } from '@neondatabase/serverless';
import { sendNotification, setVapidDetails } from 'web-push';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);
const emailFrom = (req: Request) =>
  (req.headers.get('x-user-email') || '').trim().toLowerCase();

/**
 * Sends a one-off push to the current browser only.
 * It deliberately does not read from or write to notification_deliveries.
 */
export async function POST(req: Request) {
  const email = emailFrom(req);
  if (!email) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject || !process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Push notifications are not configured on the server.' },
      { status: 500 },
    );
  }

  let endpoint = '';
  try {
    const body = await req.json();
    endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!endpoint || endpoint.length > 4096 || !endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'A valid device subscription is required.' }, { status: 400 });
  }

  // Only allow delivery to a subscription already registered to this account.
  const rows = await sql`
    SELECT endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE LOWER(email) = ${email} AND endpoint = ${endpoint}
    LIMIT 1
  `;
  const subscription = rows[0] as
    | { endpoint: string; p256dh: string; auth: string }
    | undefined;

  if (!subscription) {
    return NextResponse.json(
      { error: 'This device is not registered. Please turn notifications off and on again.' },
      { status: 404 },
    );
  }

  // Database-backed cooldown prevents repeated test pushes to the same device.
  // This table is separate from notification_deliveries.
  const allowed = await sql`
    INSERT INTO notification_test_throttles (endpoint, last_sent_at)
    VALUES (${endpoint}, NOW())
    ON CONFLICT (endpoint) DO UPDATE
      SET last_sent_at = NOW()
      WHERE notification_test_throttles.last_sent_at < NOW() - INTERVAL '30 seconds'
    RETURNING endpoint
  `;
  if (!allowed.length) {
    return NextResponse.json(
      { error: 'Please wait 30 seconds before sending another test notification.' },
      { status: 429 },
    );
  }

  setVapidDetails(subject, publicKey, privateKey);
  const payload = JSON.stringify({
    title: 'BoorFam notifications are working! 🎉',
    body: 'This is a test notification sent to this device only.',
    url: '/notifications',
    tag: `boorfam-test-${Date.now()}`,
  });

  try {
    await sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      payload,
    );
    return NextResponse.json({ success: true, message: 'Test notification sent to this device.' });
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND LOWER(email) = ${email}`;
      return NextResponse.json(
        { error: 'This device subscription has expired. Please enable notifications again.' },
        { status: 410 },
      );
    }
    console.error('Test push notification failed:', error);
    return NextResponse.json(
      { error: 'Could not send the test notification. Please try again.' },
      { status: 502 },
    );
  }
}
