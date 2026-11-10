import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL!);

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
function eventDateInYear(raw: string, year: number) {
  const parts = raw.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || !parts[1] || !parts[2]) return null;
  // Feb 29 celebrations are observed on Feb 28 in non-leap years.
  const month = parts[1];
  const day = month === 2 && parts[2] === 29 && !((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 28 : parts[2];
  return new Date(Date.UTC(year, month - 1, day));
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey || !process.env.VAPID_SUBJECT) {
    return NextResponse.json({ error: 'Web Push VAPID environment variables are missing' }, { status: 500 });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, publicKey, privateKey);

  const today = new Date();
  const todayKey = dateKey(today);
  const users = await sql`SELECT id, primary_name, spouse_name, primary_email, spouse_email,
    dob::text AS dob, anniversary::text AS anniversary FROM users
    WHERE (primary_email IS NOT NULL AND primary_email <> '') OR (spouse_email IS NOT NULL AND spouse_email <> '')`;
  const subscriptions = await sql`SELECT email, endpoint, p256dh, auth FROM push_subscriptions`;
  const preferences = await sql`SELECT email, birthdays_enabled, anniversaries_enabled, reminder_days FROM notification_preferences`;
  const prefMap = new Map(preferences.map((p: any) => [String(p.email).toLowerCase(), p]));
  const sent: string[] = [];
  const failures: string[] = [];

  for (const user of users as any[]) {
    const events: Array<{ type: 'birthday' | 'anniversary'; raw: string | null; title: string; body: string }> = [];
    if (user.dob) events.push({ type: 'birthday', raw: user.dob, title: 'Birthday reminder 🎂', body: `Today is ${user.primary_name}'s birthday!` });
    if (user.anniversary) events.push({ type: 'anniversary', raw: user.anniversary, title: 'Anniversary reminder ❤️', body: `Today is ${user.primary_name}${user.spouse_name ? ` & ${user.spouse_name}` : ''}'s anniversary!` });

    for (const event of events) {
      const recipients = [...new Set([user.primary_email, user.spouse_email].filter(Boolean).map((e: string) => e.toLowerCase()))];
      for (const email of recipients) {
        const pref: any = prefMap.get(email);
        if (!pref) continue; // People who have not opted in do not receive push messages.
        if (event.type === 'birthday' && !pref.birthdays_enabled) continue;
        if (event.type === 'anniversary' && !pref.anniversaries_enabled) continue;
        const offsets = [...new Set([Number(pref.reminder_days), 0])];
        for (const offset of offsets) {
          const target = addDays(today, offset);
          const eventDate = eventDateInYear(event.raw!, target.getUTCFullYear());
          if (!eventDate || dateKey(eventDate) !== dateKey(target)) continue;
          const notificationKey = `${event.type}:${user.id}:${email}:${todayKey}:${offset}`;
          const inserted = await sql`INSERT INTO notification_deliveries
            (event_type, related_user_id, recipient_email, run_date, reminder_days)
            VALUES (${event.type}, ${user.id}, ${email}, ${todayKey}::date, ${offset})
            ON CONFLICT DO NOTHING RETURNING id`;
          if (!inserted.length) continue;
          const title = offset === 0 ? event.title.replace(' reminder', '') : `${event.type === 'birthday' ? 'Birthday' : 'Anniversary'} coming up`;
          const body = offset === 0 ? event.body : `${event.body.replace('Today is ', '')} ${offset} day${offset === 1 ? '' : 's'} from now.`;
          const payload = JSON.stringify({ title, body, url: '/profile', tag: notificationKey });
          const targets = subscriptions.filter((s: any) => String(s.email).toLowerCase() === email);
          for (const sub of targets as any[]) {
            try {
              await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
              sent.push(email);
            } catch (error: any) {
              if (error?.statusCode === 404 || error?.statusCode === 410) {
                await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
              } else failures.push(`${email}: ${error?.message || 'push failed'}`);
            }
          }
        }
      }
    }
  }
  return NextResponse.json({ success: true, date: todayKey, notificationsSent: sent.length, failures: failures.length });
}
