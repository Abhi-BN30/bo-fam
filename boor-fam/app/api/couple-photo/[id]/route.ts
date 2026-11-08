import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new NextResponse('Invalid member id', { status: 400 });

  const rows = await sql`
    SELECT encode(image_data, 'base64') AS image_base64, content_type
    FROM couple_photos
    WHERE user_id = ${Number(id)}
    LIMIT 1
  `;
  if (!rows.length) return new NextResponse('Photo not found', { status: 404 });

  const bytes = Buffer.from(rows[0].image_base64 as string, 'base64');
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': rows[0].content_type as string,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid member id.' }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get('photo');
  const position = (value: FormDataEntryValue | null, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
  };
  const cardX = position(formData.get('card_position_x'), 50);
  const cardY = position(formData.get('card_position_y'), 50);
  const profileX = position(formData.get('profile_position_x'), 50);
  const profileY = position(formData.get('profile_position_y'), 50);
  const zoom = (value: FormDataEntryValue | null) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(1, Math.min(3, parsed)) : 1; };
  const cardZoom = zoom(formData.get('card_zoom'));
  const profileZoom = zoom(formData.get('profile_zoom'));

  const user = await sql`SELECT id FROM users WHERE id = ${Number(id)} LIMIT 1`;
  if (!user.length) return NextResponse.json({ error: 'Family member not found.' }, { status: 404 });

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG and WebP images are supported.' }, { status: 415 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image must be 5 MB or smaller.' }, { status: 413 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString('base64');
    await sql`
      INSERT INTO couple_photos (
        user_id, image_data, content_type, card_position_x, card_position_y,
        profile_position_x, profile_position_y, card_zoom, profile_zoom, updated_at
      ) VALUES (
        ${Number(id)}, decode(${base64}, 'base64'), ${file.type}, ${cardX}, ${cardY},
        ${profileX}, ${profileY}, ${cardZoom}, ${profileZoom}, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        image_data = EXCLUDED.image_data,
        content_type = EXCLUDED.content_type,
        card_position_x = EXCLUDED.card_position_x,
        card_position_y = EXCLUDED.card_position_y,
        profile_position_x = EXCLUDED.profile_position_x,
        profile_position_y = EXCLUDED.profile_position_y,
        card_zoom = EXCLUDED.card_zoom,
        profile_zoom = EXCLUDED.profile_zoom,
        updated_at = NOW()
    `;
  } else {
    const updated = await sql`
      UPDATE couple_photos SET
        card_position_x = ${cardX}, card_position_y = ${cardY},
        profile_position_x = ${profileX}, profile_position_y = ${profileY},
        card_zoom = ${cardZoom}, profile_zoom = ${profileZoom},
        updated_at = NOW()
      WHERE user_id = ${Number(id)}
      RETURNING user_id
    `;
    if (!updated.length) return NextResponse.json({ error: 'Choose a photo before saving its framing.' }, { status: 400 });
  }

  return NextResponse.json({ success: true, photoUrl: `/api/couple-photo/${id}?v=${Date.now()}` });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid member id.' }, { status: 400 });
  await sql`DELETE FROM couple_photos WHERE user_id = ${Number(id)}`;
  return NextResponse.json({ success: true });
}
