import { query } from '../db/pool';
import { log } from '../utils/logger';
import { normalizePlatformId, type PlatformId } from '../utils/platforms';
import { getConnector } from '../connectors';
import { normalizeListing, type NormalizedListing } from '../mappers/normalizeListing';
import type { ConnectorContext, ConnectorError, ConnectorPublishResult } from '../connectors/baseConnector';
import { resolveVerifiedListingUrl } from './listingUrlResolution';

const MAX_RECOVERY_RETRIES = Number(process.env.MAX_RECOVERY_RETRIES) || 5;

type PendingPlatformRow = {
  id: number;
  publish_job_id: string;
  platform: string;
  status: 'published_pending_link';
  external_listing_id: string | null;
  external_url: string | null;
  publish_metadata: Record<string, unknown> | null;
  listing_id: string;
  user_id: string;
};

type RecoveryResult = {
  publishJobId: string;
  platform: string;
  status: 'success' | 'published_pending_link' | 'failed';
  externalUrl: string | null;
  publishMetadata: Record<string, unknown> | null;
};

type ListingRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  price: string;
  city: string;
  description: string;
  images: string[];
  status: 'draft' | 'active';
  created_at: Date;
};

function mapPlatformNameToId(platform: string): PlatformId {
  const id = normalizePlatformId(platform);
  if (!id) {
    throw new Error(`Unknown platform for recovery: ${platform}`);
  }
  return id;
}

function buildRecoveryMetadata(
  previousMetadata: Record<string, unknown> | null,
  updates: Record<string, unknown>,
): Record<string, unknown> {
  const retryCount = typeof previousMetadata?.retryCount === 'number' ? previousMetadata.retryCount + 1 : 1;

  return {
    ...(previousMetadata ?? {}),
    retryCount,
    lastRecoveryAttemptAt: new Date().toISOString(),
    ...updates,
  };
}

function mapListingRow(row: ListingRow) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    price: Number(row.price),
    city: row.city,
    description: row.description,
    images: Array.isArray(row.images) ? row.images : [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function resolveRecoveryUrl(
  platform: string,
  connectorResult: ConnectorPublishResult,
  normalizedListing: NormalizedListing,
  context?: ConnectorContext,
) {
  const connector = getConnector(mapPlatformNameToId(platform));
  const { externalUrl, resolvedVia } = await resolveVerifiedListingUrl(connector, connectorResult, context);

  log.info('recovery.url.resolved', {
    platform,
    listingId: normalizedListing.id,
    resolvedVia,
    hasUrl: Boolean(externalUrl),
  });

  return {
    connector,
    externalUrl,
    normalizedListing,
  };
}

export async function recoverPendingLinks(): Promise<RecoveryResult[]> {
  const result = await query<PendingPlatformRow>(
    `SELECT pjp.id, pjp.publish_job_id, pjp.platform, pjp.status, pjp.external_listing_id, pjp.external_url, pjp.publish_metadata, pj.listing_id, pj.user_id
     FROM publish_job_platforms pjp
     JOIN publish_jobs pj ON pj.id = pjp.publish_job_id
     WHERE pjp.status = 'published_pending_link'
       AND COALESCE((pjp.publish_metadata->>'retryCount')::int, 0) < $1
       AND COALESCE(pjp.publish_metadata->>'recoveryState', '') != 'exhausted'
     ORDER BY pjp.created_at ASC`,
    [MAX_RECOVERY_RETRIES],
  );

  log.info('recovery.scan.start', { pendingCount: result.rows.length });

  const recoveryResults: RecoveryResult[] = [];

  for (const row of result.rows) {
    const ctx = {
      jobId: row.publish_job_id,
      platform: row.platform,
      listingId: row.listing_id,
      retryCount: typeof row.publish_metadata?.retryCount === 'number' ? row.publish_metadata.retryCount : 0,
    };

    log.info('recovery.attempt.start', ctx);

    const connectorResult: ConnectorPublishResult = {
      externalListingId: row.external_listing_id ?? undefined,
      externalUrl: row.external_url ?? undefined,
      publishMetadata: row.publish_metadata ?? null,
    };

    try {
      const listingResult = await query<ListingRow>(
        `SELECT id, user_id, title, category, price, city, description, images, status, created_at
         FROM listings
         WHERE id = $1
         LIMIT 1`,
        [row.listing_id],
      );

      if (listingResult.rowCount === 0) {
        throw new Error(`Listing ${row.listing_id} not found for recovery`);
      }

      const listing = mapListingRow(listingResult.rows[0]);
      const normalizedListing = normalizeListing(listing);
      const context: ConnectorContext = { userId: row.user_id };
      const { externalUrl } = await resolveRecoveryUrl(row.platform, connectorResult, normalizedListing, context);
      const nextMetadata = buildRecoveryMetadata(row.publish_metadata, {
        recoveryState: externalUrl ? 'resolved' : 'pending',
        recoveryError: null,
      });

      if (!externalUrl && typeof nextMetadata.retryCount === 'number' && nextMetadata.retryCount >= MAX_RECOVERY_RETRIES) {
        nextMetadata.recoveryState = 'exhausted';
        log.warn('recovery.attempt.exhausted', { ...ctx, retryCount: nextMetadata.retryCount });
      }

      const nextStatus = externalUrl ? 'success' : 'published_pending_link';

      await query(
        `UPDATE publish_job_platforms
         SET status = $2,
             external_url = $3,
             publish_metadata = $4::jsonb
         WHERE id = $1`,
        [row.id, nextStatus, externalUrl, JSON.stringify(nextMetadata)],
      );

      log.info('recovery.attempt.done', {
        ...ctx,
        status: nextStatus,
        externalUrl,
        retryCount: nextMetadata.retryCount,
        recoveryState: nextMetadata.recoveryState,
      });

      recoveryResults.push({
        publishJobId: row.publish_job_id,
        platform: row.platform,
        status: nextStatus,
        externalUrl,
        publishMetadata: nextMetadata,
      });
    } catch (error) {
      const connector = getConnector(mapPlatformNameToId(row.platform));
      const normalizedError: ConnectorError = connector.normalizeError(error);
      const nextMetadata = buildRecoveryMetadata(row.publish_metadata, {
        recoveryState: 'error',
        recoveryError: {
          code: normalizedError.code,
          message: normalizedError.message,
        },
      });

      if (typeof nextMetadata.retryCount === 'number' && nextMetadata.retryCount >= MAX_RECOVERY_RETRIES) {
        nextMetadata.recoveryState = 'exhausted';
      }

      log.error('recovery.attempt.failed', {
        ...ctx,
        errorCode: normalizedError.code,
        errorMessage: normalizedError.message,
        retryCount: nextMetadata.retryCount,
        recoveryState: nextMetadata.recoveryState,
      });

      await query(
        `UPDATE publish_job_platforms
         SET status = 'published_pending_link',
             publish_metadata = $2::jsonb
         WHERE id = $1`,
        [row.id, JSON.stringify(nextMetadata)],
      );

      recoveryResults.push({
        publishJobId: row.publish_job_id,
        platform: row.platform,
        status: 'published_pending_link',
        externalUrl: row.external_url,
        publishMetadata: nextMetadata,
      });
    }
  }

  return recoveryResults;
}
