import { query } from '../db/pool';

export type StoredCookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expiry?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
};

export type PlatformSession = {
  userId: string;
  platformId: string;
  cookies: StoredCookie[];
  localStorage: Record<string, string> | null;
  sessionValid: boolean;
  lastLoginAt: string | null;
};

type SessionRow = {
  user_id: string;
  platform_id: string;
  cookies: StoredCookie[];
  local_storage: Record<string, string> | null;
  session_valid: boolean;
  last_login_at: Date | null;
};

function mapRow(row: SessionRow): PlatformSession {
  return {
    userId: row.user_id,
    platformId: row.platform_id,
    cookies: Array.isArray(row.cookies) ? row.cookies : [],
    localStorage: row.local_storage,
    sessionValid: row.session_valid,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  };
}

export async function loadSession(
  userId: string,
  platformId: string,
): Promise<PlatformSession | null> {
  const result = await query<SessionRow>(
    `SELECT user_id, platform_id, cookies, local_storage, session_valid, last_login_at
     FROM platform_sessions
     WHERE user_id = $1 AND platform_id = $2
     LIMIT 1`,
    [userId, platformId],
  );

  if (result.rowCount === 0) return null;
  return mapRow(result.rows[0]);
}

export async function saveSession(
  userId: string,
  platformId: string,
  cookies: StoredCookie[],
  localStorage?: Record<string, string> | null,
): Promise<void> {
  await query(
    `INSERT INTO platform_sessions (user_id, platform_id, cookies, local_storage, session_valid, last_login_at, updated_at)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, TRUE, NOW(), NOW())
     ON CONFLICT (user_id, platform_id)
     DO UPDATE SET
       cookies = EXCLUDED.cookies,
       local_storage = COALESCE(EXCLUDED.local_storage, platform_sessions.local_storage),
       session_valid = TRUE,
       last_login_at = NOW(),
       updated_at = NOW()`,
    [userId, platformId, JSON.stringify(cookies), localStorage ? JSON.stringify(localStorage) : null],
  );
}

export async function invalidateSession(
  userId: string,
  platformId: string,
): Promise<void> {
  await query(
    `UPDATE platform_sessions
     SET session_valid = FALSE, updated_at = NOW()
     WHERE user_id = $1 AND platform_id = $2`,
    [userId, platformId],
  );
}
