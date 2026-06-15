import { neon } from '@neondatabase/serverless';

export type LogAction =
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_REGISTERED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PIN_UPDATED'
  | 'PIN_UPDATE_FAILED'
  | 'TREE_NODE_ADDED'
  | 'TREE_NODE_REORDERED'
  | 'TREE_VIEWED';

export interface LogEntry {
  action: LogAction;
  performed_by: string;       // email of the logged-in user doing the action
  target_user?: string | null; // email/name of the user being acted upon (if different)
  details?: string | null;     // any extra context
}

/**
 * Writes a structured entry to the activity_logs table.
 * Fire-and-forget — errors are swallowed so they never break the main request.
 *
 * The activity_logs table must exist in your Neon DB. Run this once:
 *
 *   CREATE TABLE IF NOT EXISTS activity_logs (
 *     id          BIGSERIAL PRIMARY KEY,
 *     action      TEXT        NOT NULL,
 *     performed_by TEXT       NOT NULL,
 *     target_user TEXT,
 *     details     TEXT,
 *     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *
 *   CREATE INDEX IF NOT EXISTS idx_logs_performed_by ON activity_logs(performed_by);
 *   CREATE INDEX IF NOT EXISTS idx_logs_created_at   ON activity_logs(created_at DESC);
 */
export async function log(entry: LogEntry): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO activity_logs (action, performed_by, target_user, details)
      VALUES (
        ${entry.action},
        ${entry.performed_by},
        ${entry.target_user ?? null},
        ${entry.details ?? null}
      )
    `;
  } catch (err) {
    // Never let logging failures break the main request
    console.error('[logger] Failed to write log entry:', err);
  }
}