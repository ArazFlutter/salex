import { randomUUID } from 'node:crypto';
import { AppError } from '../utils/AppError';
import { log } from '../utils/logger';
import { query } from '../db/pool';
import { getBoss } from '../queue/boss';
import { QUEUE_PUBLISH_PLATFORM, type PublishPlatformPayload } from '../queue/queues';
import { isPlatformAllowedForPlan } from '../config/packagePlans';
import { requireCurrentUserListing } from './listingService';
import { getConnectedPlatforms } from './platformService';
import { getCurrentUser } from './userService';

type PublishJobPlatform = {
  platform: string;
  status: 'waiting' | 'processing' | 'success' | 'published_pending_link' | 'failed';
  externalListingId: string | null;
  externalUrl: string | null;
  publishMetadata: Record<string, unknown> | null;
};

export type PublishJobStatus = 'waiting' | 'processing' | 'success' | 'failed';

export type PublishJob = {
  id: string;
  userId: string;
  listingId: string;
  status: PublishJobStatus;
  platforms: PublishJobPlatform[];
};

type PublishJobRow = {
  id: string;
  user_id: string;
  listing_id: string;
  status: PublishJobStatus;
};

type PublishJobPlatformRow = {
  platform: string;
  status: string;
  external_listing_id: string | null;
  external_url: string | null;
  publish_metadata: Record<string, unknown> | null;
};

export async function createPublishJob(listingId: string) {
  const listing = await requireCurrentUserListing(listingId);
  const connectedPlatforms = await getConnectedPlatforms();
  const currentUser = await getCurrentUser();

  const allowedForPublish = connectedPlatforms.filter((p) =>
    isPlatformAllowedForPlan(currentUser.activePlan, p.id),
  );

  if (connectedPlatforms.length === 0) {
    throw new AppError('No connected platforms found', 400);
  }

  if (allowedForPublish.length === 0) {
    throw new AppError(
      'None of your connected platforms are included in your current package. Upgrade or connect allowed marketplaces.',
      403,
    );
  }

  const jobId = `publish-job-${randomUUID()}`;
  const platformNames = allowedForPublish.map((p) => p.name);

  log.info('publish.job.created', {
    jobId,
    listingId: listing.id,
    userId: currentUser.id,
    platforms: platformNames,
    platformCount: allowedForPublish.length,
    skippedByPlan: connectedPlatforms.length - allowedForPublish.length,
  });

  await query(
    `INSERT INTO publish_jobs (id, user_id, listing_id, status)
     VALUES ($1, $2, $3, 'processing')`,
    [jobId, currentUser.id, listing.id],
  );

  const platformRows: PublishJobPlatform[] = [];

  for (const platform of allowedForPublish) {
    await query(
      `INSERT INTO publish_job_platforms (publish_job_id, platform, status, external_listing_id, external_url, publish_metadata)
       VALUES ($1, $2, 'waiting', NULL, NULL, NULL)`,
      [jobId, platform.name],
    );

    platformRows.push({
      platform: platform.name,
      status: 'waiting',
      externalListingId: null,
      externalUrl: null,
      publishMetadata: null,
    });
  }

  const boss = getBoss();

  for (const platform of allowedForPublish) {
    const payload: PublishPlatformPayload = {
      publishJobId: jobId,
      platformId: platform.id,
      platformName: platform.name,
      listingId: listing.id,
    };

    await boss.send(QUEUE_PUBLISH_PLATFORM, payload, {
      retryLimit: 2,
      retryDelay: 10,
      retryBackoff: true,
      expireInSeconds: 600,
    });
  }

  log.info('publish.job.enqueued', {
    jobId,
    listingId: listing.id,
    platformCount: allowedForPublish.length,
    skippedByPlan: connectedPlatforms.length - allowedForPublish.length,
  });

  const job: PublishJob = {
    id: jobId,
    userId: currentUser.id,
    listingId: listing.id,
    status: 'processing',
    platforms: platformRows,
  };

  return { success: true, job };
}

export async function getPublishJobStatus(id: string) {
  const currentUser = await getCurrentUser();

  const jobResult = await query<PublishJobRow>(
    `SELECT id, user_id, listing_id, status
     FROM publish_jobs
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, currentUser.id],
  );

  const job = jobResult.rows[0];

  if (!job) {
    throw new AppError('Publish job not found', 404);
  }

  const platformsResult = await query<PublishJobPlatformRow>(
    `SELECT platform, status, external_listing_id, external_url, publish_metadata
     FROM publish_job_platforms
     WHERE publish_job_id = $1
     ORDER BY created_at ASC`,
    [id],
  );

  return {
    success: true,
    id: job.id,
    listingId: job.listing_id,
    status: job.status,
    platforms: platformsResult.rows.map((row) => ({
      platform: row.platform,
      status: row.status,
      externalListingId: row.external_listing_id,
      externalUrl: row.external_url,
      publishMetadata: row.publish_metadata,
    })),
  };
}
