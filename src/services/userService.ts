import { AppError } from '../utils/AppError';
import { query } from '../db/pool';
import type { PlatformId } from '../utils/platforms';

export type ActivePlan = 'basic' | 'premium' | 'premiumPlus';
export type PlatformConnections = Partial<Record<PlatformId, boolean>>;

type UserRow = {
  id: string;
  full_name: string;
  phone: string;
  account_type: string;
  active_plan: ActivePlan;
};

type PlatformConnectionRow = {
  platform_id: string;
  connected: boolean;
};

export type User = {
  id: string;
  fullName: string;
  phone: string;
  accountType: string;
  activePlan: ActivePlan;
  platformConnections: PlatformConnections;
};

function buildUserId(phone: string): string {
  const normalizedPhone = phone.replace(/\D/g, '') || 'guest';
  return `user-${normalizedPhone}`;
}

function buildDefaultName(phone: string): string {
  const suffix = phone.replace(/\D/g, '').slice(-4) || '0000';
  return `User ${suffix}`;
}

async function getPlatformConnections(userId: string): Promise<PlatformConnections> {
  const result = await query<PlatformConnectionRow>(
    `SELECT platform_id, connected
     FROM platform_connections
     WHERE user_id = $1`,
    [userId],
  );

  return result.rows.reduce<PlatformConnections>((connections, row) => {
    if (row.connected) {
      connections[row.platform_id as PlatformId] = true;
    }
    return connections;
  }, {});
}

async function mapUserRow(row: UserRow): Promise<User> {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    accountType: row.account_type,
    activePlan: row.active_plan,
    platformConnections: await getPlatformConnections(row.id),
  };
}

export async function findUserByPhone(phone: string): Promise<User | undefined> {
  const result = await query<UserRow>(
    `SELECT id, full_name, phone, account_type, active_plan
     FROM users
     WHERE phone = $1
     LIMIT 1`,
    [phone],
  );

  if (result.rowCount === 0) {
    return undefined;
  }

  return mapUserRow(result.rows[0]);
}

export async function getOrCreateUser(phone: string): Promise<User> {
  const result = await query<UserRow>(
    `INSERT INTO users (id, full_name, phone, account_type, active_plan)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (phone) DO UPDATE
     SET phone = EXCLUDED.phone
     RETURNING id, full_name, phone, account_type, active_plan`,
    [buildUserId(phone), buildDefaultName(phone), phone, 'individual', 'basic'],
  );

  return mapUserRow(result.rows[0]);
}

export async function getCurrentUser(): Promise<User> {
  const result = await query<UserRow>(
    `SELECT u.id, u.full_name, u.phone, u.account_type, u.active_plan
     FROM otp_sessions os
     JOIN users u ON u.id = os.user_id
     WHERE os.is_current = TRUE
       AND os.verified_at IS NOT NULL
     ORDER BY os.verified_at DESC, os.id DESC
     LIMIT 1`,
    [],
  );

  if (result.rowCount === 0) {
    throw new AppError('User is not authenticated', 401);
  }

  return mapUserRow(result.rows[0]);
}

export async function updateCurrentUserPlan(activePlan: ActivePlan): Promise<User> {
  const currentUser = await getCurrentUser();
  const result = await query<UserRow>(
    `UPDATE users
     SET active_plan = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, full_name, phone, account_type, active_plan`,
    [activePlan, currentUser.id],
  );

  return mapUserRow(result.rows[0]);
}

export async function connectCurrentUserPlatform(platform: PlatformId): Promise<User> {
  const currentUser = await getCurrentUser();

  await query(
    `INSERT INTO platform_connections (user_id, platform_id, connected)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (user_id, platform_id) DO UPDATE
     SET connected = TRUE,
         connected_at = NOW()`,
    [currentUser.id, platform],
  );

  return getCurrentUser();
}
