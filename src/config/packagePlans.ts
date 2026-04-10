import type { PlatformId } from '../utils/platforms';
import type { ActivePlan } from '../services/userService';

/**
 * Single source of truth for plan entitlements and paid-plan pricing.
 * All enforcement and API summaries should derive from this module.
 */
export type PlanEntitlementsDefinition = {
  /** Max concurrent active listings; `null` means unlimited. */
  listingLimit: number | null;
  allowedPlatformIds: readonly PlatformId[];
  advancedAnalytics: boolean;
  prioritySupport: boolean;
};

export const PLAN_ENTITLEMENTS: Record<ActivePlan, PlanEntitlementsDefinition> = {
  basic: {
    listingLimit: 3,
    allowedPlatformIds: ['tapaz', 'lalafo'],
    advancedAnalytics: false,
    prioritySupport: false,
  },
  premium: {
    listingLimit: 10,
    allowedPlatformIds: ['tapaz', 'lalafo', 'alanaz', 'laylo', 'birjacom'],
    advancedAnalytics: true,
    prioritySupport: false,
  },
  premiumPlus: {
    listingLimit: null,
    allowedPlatformIds: ['tapaz', 'lalafo', 'alanaz', 'laylo', 'birjacom'],
    advancedAnalytics: true,
    prioritySupport: true,
  },
};

export type PaidPlanId = 'premium' | 'premiumPlus';

export const PAID_PLAN_PRICES_AZN: Record<PaidPlanId, number> = {
  premium: 10,
  premiumPlus: 20,
};

export function getPlanEntitlements(plan: ActivePlan): PlanEntitlementsDefinition {
  return PLAN_ENTITLEMENTS[plan];
}

export function getListingLimitForPlan(plan: ActivePlan): number | null {
  return PLAN_ENTITLEMENTS[plan].listingLimit;
}

export function isPlatformAllowedForPlan(plan: ActivePlan, platformId: PlatformId): boolean {
  return PLAN_ENTITLEMENTS[plan].allowedPlatformIds.includes(platformId);
}

export function isPaidPlan(plan: string): plan is PaidPlanId {
  return plan === 'premium' || plan === 'premiumPlus';
}
