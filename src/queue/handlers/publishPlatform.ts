import type { Job } from 'pg-boss';
import { query } from '../../db/pool';
import { log } from '../../utils/logger';
import { getConnector } from '../../connectors';
import type { ConnectorContext, ConnectorError } from '../../connectors/baseConnector';
import { ListingMappingValidationError } from '../../mappers/listingMappingErrors';
import { normalizeListing } from '../../mappers/normalizeListing';
import { mapToPlatformPayload } from '../../mappers/platforms';
import type { PlatformId } from '../../utils/platforms';
import { resolvePublishResult } from '../../services/resolvePublishResult';
import { validateListingMappingForPublish } from '../../services/listingMappingValidation';
import type { PublishPlatformPayload } from '../queues';
import { maybeFinishJob } from './finishJob';

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

function normalizePublishFailure(platformId: PlatformId, error: unknown): ConnectorError {
  if (error instanceof ListingMappingValidationError) {
    return { code: error.mappingCode, message: error.message };
  }
  return getConnector(platformId).normalizeError(error);
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

async function processSingleJob(job: Job<PublishPlatformPayload>): Promise<void> {
  const { publishJobId, platformId, platformName, listingId } = job.data;
  const ctx = { jobId: publishJobId, platform: platformName, listingId, platformId };

  log.info('publish.platform.start', ctx);

  await query(
    `UPDATE publish_job_platforms
     SET status = 'processing'
     WHERE publish_job_id = $1 AND platform = $2`,
    [publishJobId, platformName],
  );

  try {
    const listingResult = await query<ListingRow>(
      `SELECT id, user_id, title, category, price, city, description, images, status, created_at
       FROM listings WHERE id = $1 LIMIT 1`,
      [listingId],
    );

    if (listingResult.rowCount === 0) {
      throw new Error(`Listing ${listingId} not found`);
    }

    const listing = mapListingRow(listingResult.rows[0]);
    const normalizedListing = normalizeListing(listing);

    if (normalizedListing.taxonomyResolveError) {
      throw new ListingMappingValidationError(
        normalizedListing.taxonomyResolveError.code,
        normalizedListing.taxonomyResolveError.message,
      );
    }

    validateListingMappingForPublish(platformId, normalizedListing.salexTaxonomy!);

    log.info('publish.mapping.validated', {
      ...ctx,
      salexMainId: normalizedListing.salexTaxonomy!.mainId,
      salexFamilyId: normalizedListing.salexTaxonomy!.familyId,
    });

    const mappedPayload = mapToPlatformPayload(platformId, normalizedListing);
    const connector = getConnector(platformId);
    const context: ConnectorContext = { userId: listing.userId };
    const publishResult = await connector.publishListing(mappedPayload as Record<string, unknown>, context);

    const platformResult = await resolvePublishResult({
      platformName,
      connector,
      publishResult,
      normalizedListing,
      context,
    });

    await query(
      `UPDATE publish_job_platforms
       SET status = $3,
           external_listing_id = $4,
           external_url = $5,
           publish_metadata = $6::jsonb
       WHERE publish_job_id = $1 AND platform = $2`,
      [
        publishJobId,
        platformName,
        platformResult.status,
        platformResult.externalListingId,
        platformResult.externalUrl,
        JSON.stringify(platformResult.publishMetadata),
      ],
    );

    log.info('publish.platform.done', {
      ...ctx,
      status: platformResult.status,
      externalListingId: platformResult.externalListingId,
      externalUrl: platformResult.externalUrl,
    });
  } catch (error) {
    const normalizedError: ConnectorError = normalizePublishFailure(platformId, error);

    log.error('publish.platform.failed', {
      ...ctx,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
    });

    await query(
      `UPDATE publish_job_platforms
       SET status = 'failed',
           external_listing_id = NULL,
           external_url = NULL,
           publish_metadata = $3::jsonb
       WHERE publish_job_id = $1 AND platform = $2`,
      [
        publishJobId,
        platformName,
        JSON.stringify({ errorCode: normalizedError.code, errorMessage: normalizedError.message }),
      ],
    );
  }

  await maybeFinishJob(publishJobId);
}

export async function handlePublishPlatform(jobs: Job<PublishPlatformPayload>[]): Promise<void> {
  for (const job of jobs) {
    await processSingleJob(job);
  }
}
