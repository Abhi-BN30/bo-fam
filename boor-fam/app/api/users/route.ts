import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { log } from '@/app/lib/logger';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  // The actor performing the registration (may be an admin or the new user themselves)
  const performedBy = req.headers.get('x-user-email') || 'anonymous';

  const {
    primary_name, spouse_name, primary_email, dob, gender, parent_id,
    contact, spouse_email, address, city, state, country, spouse_contact, pin,
    deceased_primary = false, deceased_spouse = false,
    anniversary = null,
  } = await req.json();

  const parsedPin = typeof pin === 'number' ? pin : Number(pin);
  if (!Number.isFinite(parsedPin) || String(pin).replace(/\D/g, '').length !== 4) {
    return NextResponse.json({ success: false, message: 'PIN must be exactly 4 digits.' }, { status: 400 });
  }

  if (primary_email) {
    const existing = await sql`SELECT *, dob::text AS dob, anniversary::text AS anniversary FROM users WHERE primary_email = ${primary_email} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ alreadyExists: true, existingUser: existing[0] }, { status: 409 });
    }
  }

  const res = await sql`
    INSERT INTO users (
      primary_name, spouse_name, primary_email, dob, gender, contact,
      spouse_email, address, city, state, country, spouse_contact, pin,
      deceased_primary, deceased_spouse, anniversary
    ) VALUES (
      ${primary_name}, ${spouse_name}, ${primary_email}, ${dob}, ${gender}, ${contact},
      ${spouse_email}, ${address || null}, ${city || null}, ${state || null},
      ${country || null}, ${spouse_contact || null}, ${parsedPin},
      ${!!deceased_primary}, ${!!deceased_spouse},
      ${anniversary || null}
    ) RETURNING id`;

  if (parent_id) {
    await sql`INSERT INTO family_tree (user_id, parent_id) VALUES (${res[0].id}, ${parent_id})`;
  }

  await log({
    action:       'USER_REGISTERED',
    performed_by: performedBy,
    target_user:  primary_email || primary_name,
    details:      `New member registered: ${primary_name}${spouse_name ? ` & ${spouse_name}` : ''}`,
  });

  return NextResponse.json({ id: res[0].id });
}

export async function DELETE(req: Request) {
  const performedBy = req.headers.get('x-user-email') || 'anonymous';
  const { id } = await req.json();

  // Capture the user's name before deleting for the log entry
  const userRecord = await sql`SELECT primary_name, primary_email FROM users WHERE id = ${id}`;
  const targetLabel = userRecord[0]
    ? `${userRecord[0].primary_name} (${userRecord[0].primary_email})`
    : `id:${id}`;

  const subtree = await sql`
    WITH RECURSIVE descendants AS (
      SELECT ${id}::int AS id
      UNION ALL
      SELECT ft.user_id
      FROM family_tree ft
      JOIN descendants d ON ft.parent_id = d.id
    )
    SELECT id FROM descendants
  `;

  const allIds = subtree.map((r: any) => r.id);

  if (allIds.length > 0) {
    await sql`DELETE FROM family_tree WHERE user_id = ANY(${allIds}::int[]) OR parent_id = ANY(${allIds}::int[])`;
    await sql`DELETE FROM users WHERE id = ANY(${allIds}::int[])`;
  }

  await log({
    action:       'USER_DELETED',
    performed_by: performedBy,
    target_user:  targetLabel,
    details:      `Deleted user and ${allIds.length - 1} descendant(s)`,
  });

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const performedBy = req.headers.get('x-user-email') || 'anonymous';

  const {
    id, primary_name, spouse_name, dob, gender, contact, spouse_email,
    spouse_contact, primary_email, address, city, state, country,
    deceased_primary = false, deceased_spouse = false,
    anniversary = null,
  } = await req.json();

  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const result = await sql`
    UPDATE users SET
      primary_name     = ${primary_name},
      spouse_name      = ${spouse_name},
      dob              = ${dob},
      gender           = ${gender},
      contact          = ${contact},
      spouse_email     = ${spouse_email},
      primary_email    = ${primary_email},
      spouse_contact   = ${spouse_contact},
      address          = ${address || null},
      city             = ${city || null},
      state            = ${state || null},
      country          = ${country || null},
      deceased_primary = ${!!deceased_primary},
      deceased_spouse  = ${!!deceased_spouse},
      anniversary      = ${anniversary || null}
    WHERE id = ${id}
    RETURNING *, dob::text AS dob, anniversary::text AS anniversary`;

  await log({
    action:       'USER_UPDATED',
    performed_by: performedBy,
    target_user:  primary_email || primary_name,
    details:      `Updated profile for: ${primary_name}${spouse_name ? ` & ${spouse_name}` : ''}`,
  });

  return NextResponse.json(result[0] || null);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  const res = await sql`SELECT *, dob::text AS dob, anniversary::text AS anniversary FROM users WHERE id = ${id}`;
  return NextResponse.json(res[0] || null);
}