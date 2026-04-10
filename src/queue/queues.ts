import type { PlatformId } from '../utils/platforms';

export const QUEUE_PUBLISH_PLATFORM = 'publish-platform';
export const QUEUE_RECOVER_PENDING_LINKS = 'recover-pending-links';

export type PublishPlatformPayload = {
  publishJobId: string;
  platformId: PlatformId;
  platformName: string;
  listingId: string;
};

export type RecoverPendingLinksPayload = {
  triggeredBy: 'api' | 'schedule' | 'dev';
};
