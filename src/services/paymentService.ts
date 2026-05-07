import { randomUUID } from 'node:crypto';
import { AppError } from '../utils/AppError';
import { query, withTransaction } from '../db/pool';
import { isPaidPlan, PAID_PLAN_PRICES_AZN, type PaidPlanId } from '../config/packagePlans';
import { getCurrentUser } from './userService';
import { buildPackageSummary } from './packageService';

export type PaymentOrderStatus = 'pending' | 'paid' | 'failed';
export type PaidPlan = PaidPlanId;

type PaymentOrderRow = {
  id: string;
  user_id: string;
  plan: string;
  amount: string;
  currency: string;
  status: string;
  created_at: Date;
  updated_at: Date;
};

function mapOrderRow(row: PaymentOrderRow) {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan as PaidPlan,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as PaymentOrderStatus,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function getAppBaseUrl(): string {
  const raw = process.env.APP_URL?.trim() || 'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export async function createPaymentOrder(userId: string, plan: string) {
  if (!isPaidPlan(plan)) {
    throw new AppError('Only premium and premiumPlus require payment', 400);
  }

  const user = await getCurrentUser(userId);
  const amount = PAID_PLAN_PRICES_AZN[plan];
  const id = `payment-${randomUUID()}`;
  const currency = 'AZN';

  await query(
    `INSERT INTO payment_orders (id, user_id, plan, amount, currency, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())`,
    [id, user.id, plan, amount, currency],
  );

  const orderResult = await query<PaymentOrderRow>(
    `SELECT id, user_id, plan, amount, currency, status, created_at, updated_at
     FROM payment_orders WHERE id = $1`,
    [id],
  );

  const paymentOrder = mapOrderRow(orderResult.rows[0]);
  const fakePaymentUrl = `${getAppBaseUrl()}/?devPaymentOrderId=${encodeURIComponent(id)}`;

  return {
    success: true as const,
    paymentOrder,
    fakePaymentUrl,
  };
}

export async function getPaymentOrderById(userId: string, orderId: string) {
  const user = await getCurrentUser(userId);

  const result = await query<PaymentOrderRow>(
    `SELECT id, user_id, plan, amount, currency, status, created_at, updated_at
     FROM payment_orders WHERE id = $1`,
    [orderId],
  );

  if (result.rowCount === 0) {
    throw new AppError('Payment order not found', 404);
  }

  const row = result.rows[0];

  if (row.user_id !== user.id) {
    throw new AppError('Payment order not found', 404);
  }

  return {
    success: true as const,
    paymentOrder: mapOrderRow(row),
  };
}

export async function confirmPaymentOrder(userId: string, orderId: string) {
  if (!orderId.trim()) {
    throw new AppError('paymentOrderId is required', 400);
  }

  const user = await getCurrentUser(userId);

  await withTransaction(async (client) => {
    const locked = await client.query<PaymentOrderRow>(
      `SELECT id, user_id, plan, amount, currency, status, created_at, updated_at
       FROM payment_orders WHERE id = $1 FOR UPDATE`,
      [orderId],
    );

    if (locked.rowCount === 0) {
      throw new AppError('Payment order not found', 404);
    }

    const row = locked.rows[0];

    if (row.user_id !== user.id) {
      throw new AppError('Payment order not found', 404);
    }

    if (row.status !== 'pending') {
      throw new AppError(`Payment order is already ${row.status}`, 400);
    }

    if (!isPaidPlan(row.plan as string)) {
      throw new AppError('Invalid plan on payment order', 400);
    }

    await client.query(
      `UPDATE payment_orders SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [orderId],
    );

    await client.query(
      `UPDATE users SET active_plan = $1, updated_at = NOW() WHERE id = $2`,
      [row.plan, user.id],
    );
  });

  const refreshed = await getCurrentUser(userId);
  const orderAfter = await query<PaymentOrderRow>(
    `SELECT id, user_id, plan, amount, currency, status, created_at, updated_at
     FROM payment_orders WHERE id = $1`,
    [orderId],
  );

  return {
    success: true as const,
    paymentOrder: mapOrderRow(orderAfter.rows[0]),
    user: refreshed,
    package: buildPackageSummary(refreshed.activePlan),
  };
}

export async function createPaymentOrderForUser(userId: string, plan: string) {
  if (!isPaidPlan(plan)) {
    throw new AppError('Invalid plan', 400);
  }

  const amount = PAID_PLAN_PRICES_AZN[plan];
  const id = `payment-${randomUUID()}`;

  await query(
    `INSERT INTO payment_orders (id, user_id, plan, amount, currency, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'XTR', 'pending', NOW(), NOW())`,
    [id, userId, plan, amount],
  );

  return { id, userId, plan, amount };
}

export async function confirmPaymentOrderById(orderId: string, userId: string) {
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE payment_orders SET status = 'paid', updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [orderId, userId],
    );

    const planRes = await client.query<{ plan: string }>(
      `SELECT plan FROM payment_orders WHERE id = $1`,
      [orderId],
    );

    await client.query(
      `UPDATE users SET active_plan = $1, updated_at = NOW() WHERE id = $2`,
      [planRes.rows[0].plan, userId],
    );
  });
}
