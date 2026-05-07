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

export async function getCurrentUser(userId: string): Promise<User> {
  const result = await query<UserRow>(
    `SELECT id, full_name, phone, account_type, active_plan
     FROM users
     WHERE id = $1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new AppError('User not found', 401);
  }

  return mapUserRow(result.rows[0]);
}

export async function updateUserPlan(userId: string, activePlan: ActivePlan): Promise<User> {
  const result = await query<UserRow>(
    `UPDATE users
     SET active_plan = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, full_name, phone, account_type, active_plan`,
    [activePlan, userId],
  );

  if (result.rowCount === 0) {
    throw new AppError('User not found', 404);
  }

  return mapUserRow(result.rows[0]);
}

export async function connectUserPlatform(userId: string, platform: PlatformId): Promise<User> {
  await query(
    `INSERT INTO platform_connections (user_id, platform_id, connected)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (user_id, platform_id) DO UPDATE
     SET connected = TRUE,
         connected_at = NOW()`,
    [userId, platform],
  );

  return getCurrentUser(userId);
}

export async function findUserByTelegramId(telegramId: number): Promise<User | undefined> {
  const result = await query<UserRow>(
    `SELECT id, full_name, phone, account_type, active_plan
     FROM users WHERE telegram_id = $1`,
    [telegramId],
  );

  return result.rows[0] ? mapUserRow(result.rows[0]) : undefined;
}

export async function linkTelegramId(userId: string, telegramId: number): Promise<void> {
  await query(
    `UPDATE users SET telegram_id = $1, updated_at = NOW() WHERE id = $2`,
    [telegramId, userId],
  );
}
