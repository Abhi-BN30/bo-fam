import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

/**
 * GET /api/logs
 *
 * Query params:
 *   ?email=someone@example.com   — filter by the user who performed actions
 *   ?action=USER_LOGIN            — filter by action type
 *   ?limit=50                     — number of rows (default 100, max 500)
 *   ?offset=0                     — pagination offset
 *
 * The caller must supply their own email via the x-user-email header
 * (same pattern used elsewhere in this app).
 */
export async function GET(req: Request) {
  const callerEmail = req.headers.get('x-user-email');
  if (!callerEmail) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const url    = new URL(req.url);
  const email  = url.searchParams.get('email')  || null;
  const action = url.searchParams.get('action') || null;
  const limit  = Math.min(parseInt(url.searchParams.get('limit')  || '100'), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Build the query dynamically based on which filters were supplied.
    // Neon's tagged-template approach doesn't support truly dynamic WHERE
    // clauses, so we handle the four combinations explicitly.
    let rows;

    if (email && action) {
      rows = await sql`
        SELECT id, action, performed_by, target_user, details,
               created_at AT TIME ZONE 'UTC' AS created_at
        FROM activity_logs
        WHERE performed_by = ${email}
          AND action       = ${action}
        ORDER BY created_at DESC
        LIMIT  ${limit}
        OFFSET ${offset}
      `;
    } else if (email) {
      rows = await sql`
        SELECT id, action, performed_by, target_user, details,
               created_at AT TIME ZONE 'UTC' AS created_at
        FROM activity_logs
        WHERE performed_by = ${email}
        ORDER BY created_at DESC
        LIMIT  ${limit}
        OFFSET ${offset}
      `;
    } else if (action) {
      rows = await sql`
        SELECT id, action, performed_by, target_user, details,
               created_at AT TIME ZONE 'UTC' AS created_at
        FROM activity_logs
        WHERE action = ${action}
        ORDER BY created_at DESC
        LIMIT  ${limit}
        OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT id, action, performed_by, target_user, details,
               created_at AT TIME ZONE 'UTC' AS created_at
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT  ${limit}
        OFFSET ${offset}
      `;
    }

    // Total count for the same filters (for pagination UI)
    let countResult;
    if (email && action) {
      countResult = await sql`
        SELECT COUNT(*)::int AS total FROM activity_logs
        WHERE performed_by = ${email} AND action = ${action}
      `;
    } else if (email) {
      countResult = await sql`
        SELECT COUNT(*)::int AS total FROM activity_logs
        WHERE performed_by = ${email}
      `;
    } else if (action) {
      countResult = await sql`
        SELECT COUNT(*)::int AS total FROM activity_logs
        WHERE action = ${action}
      `;
    } else {
      countResult = await sql`SELECT COUNT(*)::int AS total FROM activity_logs`;
    }

    return NextResponse.json({
      logs:   rows,
      total:  countResult[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[GET /api/logs] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}