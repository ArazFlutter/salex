import type { PlatformConnector, ConnectorPublishResult, ConnectorContext } from '../connectors/baseConnector';
import type { NormalizedListing } from '../mappers/normalizeListing';
import { log } from '../utils/logger';
import { resolveVerifiedListingUrl } from './listingUrlResolution';

export type ResolvedPlatformPublishResult = {
  platform: string;
  status: 'success' | 'published_pending_link' | 'failed';
  externalListingId: string | null;
  externalUrl: string | null;
  publishMetadata: Record<string, unknown> | null;
};

type ResolveArgs = {
  platformName: string;
  connector: PlatformConnector;
  publishResult: ConnectorPublishResult;
  normalizedListing: NormalizedListing;
  context?: ConnectorContext;
};

export async function resolvePublishResult({
  platformName,
  connector,
  publishResult,
  normalizedListing,
  context,
}: ResolveArgs): Promise<ResolvedPlatformPublishResult> {
  const listingId = normalizedListing.id;

  let externalUrl: string | null = null;
  let resolvedVia: string = 'none';

  try {
    const resolved = await resolveVerifiedListingUrl(connector, publishResult, context);
    externalUrl = resolved.externalUrl;
    resolvedVia = resolved.resolvedVia;
  } catch {
    externalUrl = null;
    resolvedVia = 'none';
  }

  const finalStatus = externalUrl ? 'success' : 'published_pending_link';

  log.info('publish.url.resolved', {
    platform: platformName,
    listingId,
    status: finalStatus,
    resolvedVia,
    listingDetailVerified: resolvedVia !== 'none',
    externalListingId: publishResult.externalListingId ?? null,
    externalUrl,
  });

  return {
    platform: platformName,
    status: finalStatus,
    externalListingId: publishResult.externalListingId ?? null,
    externalUrl,
    publishMetadata: {
      ...(publishResult.publishMetadata ?? {}),
      normalizedListingId: normalizedListing.id,
      urlResolution: resolvedVia,
      listingDetailVerified: resolvedVia === 'direct_confirmed' || resolvedVia === 'fetchListingUrl',
      salexMainId: normalizedListing.salexTaxonomy?.mainId ?? null,
      salexFamilyId: normalizedListing.salexTaxonomy?.familyId ?? null,
      categoryDisplay: normalizedListing.salexTaxonomy?.segments.join(' → ') ?? normalizedListing.category,
    },
  };
}
