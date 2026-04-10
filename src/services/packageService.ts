import { AppError } from '../utils/AppError';
import { getPlanEntitlements, PAID_PLAN_PRICES_AZN, type PaidPlanId } from '../config/packagePlans';
import { getPlatformDisplayName, type PlatformId } from '../utils/platforms';
import { type ActivePlan, getCurrentUser, updateCurrentUserPlan } from './userService';

export type PlanPlatformRef = { id: PlatformId; name: string };

export type PlanCatalogEntry = {
  listingLimit: number | null;
  allowedPlatforms: PlanPlatformRef[];
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  /** null for basic (free); AZN amount for paid tiers */
  priceAzn: number | null;
};

export type UserPackageSummary = PlanCatalogEntry & {
  activePlan: ActivePlan;
};

function isActivePlan(value: string): value is ActivePlan {
  return value === 'basic' || value === 'premium' || value === 'premiumPlus';
}

function buildCatalogEntry(plan: ActivePlan): PlanCatalogEntry {
  const def = getPlanEntitlements(plan);
  const priceAzn: number | null = plan === 'basic' ? null : PAID_PLAN_PRICES_AZN[plan as PaidPlanId];

  return {
    listingLimit: def.listingLimit,
    allowedPlatforms: def.allowedPlatformIds.map((id) => ({
      id,
      name: getPlatformDisplayName(id),
    })),
    advancedAnalytics: def.advancedAnalytics,
    prioritySupport: def.prioritySupport,
    priceAzn,
  };
}

export function buildPackageSummary(activePlan: ActivePlan): UserPackageSummary {
  return {
    activePlan,
    ...buildCatalogEntry(activePlan),
  };
}

export function getPackageCatalog() {
  const plans: Record<ActivePlan, PlanCatalogEntry> = {
    basic: buildCatalogEntry('basic'),
    premium: buildCatalogEntry('premium'),
    premiumPlus: buildCatalogEntry('premiumPlus'),
  };

  return { success: true as const, plans };
}

export async function getCurrentPackage() {
  const user = await getCurrentUser();

  return {
    success: true as const,
    package: buildPackageSummary(user.activePlan),
  };
}

export async function selectPackage(plan: string) {
  if (!isActivePlan(plan)) {
    throw new AppError('Invalid package selected', 400);
  }

  if (plan !== 'basic') {
    throw new AppError(
      'Paid plans require payment confirmation. Use POST /api/payments/create then POST /api/payments/confirm.',
      400,
    );
  }

  const user = await updateCurrentUserPlan('basic');

  return {
    success: true as const,
    user,
    package: buildPackageSummary(user.activePlan),
  };
}
