import { isPlatformAllowedForPlan } from '../config/packagePlans';
import { AppError } from '../utils/AppError';
import { log } from '../utils/logger';
import { getPlatformDisplayName, getSupportedPlatforms, normalizePlatformId, type PlatformId } from '../utils/platforms';
import { connectUserPlatform, getCurrentUser } from './userService';

type PlatformSummary = {
  id: string;
  name: string;
  connected: boolean;
  /** Included in the user's current package (can connect / publish). */
  allowedByPlan: boolean;
};

async function buildPlatforms(userId: string) {
  const currentUser = await getCurrentUser(userId);

  return getSupportedPlatforms().map<PlatformSummary>((platform) => ({
    id: platform.id,
    name: platform.name,
    connected: Boolean(currentUser.platformConnections[platform.id]),
    allowedByPlan: isPlatformAllowedForPlan(currentUser.activePlan, platform.id),
  }));
}

export async function getPlatforms(userId: string) {
  return {
    success: true,
    platforms: await buildPlatforms(userId),
  };
}

export async function getConnectedPlatforms(userId: string) {
  const currentUser = await getCurrentUser(userId);

  return getSupportedPlatforms()
    .filter((platform) => Boolean(currentUser.platformConnections[platform.id]))
    .map((platform) => ({
      id: platform.id as PlatformId,
      name: platform.name,
    }));
}

export async function connectPlatform(userId: string, platform: string) {
  const platformId = normalizePlatformId(platform);

  if (!platformId) {
    throw new AppError('Unsupported platform', 400);
  }

  const currentUser = await getCurrentUser(userId);

  if (!isPlatformAllowedForPlan(currentUser.activePlan, platformId)) {
    throw new AppError('This marketplace is not included in your current package. Upgrade to connect it.', 403);
  }

  const platformName = getPlatformDisplayName(platformId);
  log.info('platform.connected', { platformId, platformName });

  const user = await connectUserPlatform(userId, platformId);

  return {
    success: true,
    message: `${platformName} connected successfully`,
    platform: {
      id: platformId,
      name: platformName,
      connected: true,
    },
    user,
  };
}
