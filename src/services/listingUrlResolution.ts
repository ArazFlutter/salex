import type { PlatformConnector, ConnectorPublishResult, ConnectorContext } from '../connectors/baseConnector';

/**
 * Trust only URLs produced on the post-submit page when we extracted the listing id
 * from that same redirect/canonical URL (not a client-synthesized pattern).
 */
export function isTrustedDirectListingUrl(result: ConnectorPublishResult): boolean {
  const meta = result.publishMetadata;
  if (!meta || meta.confidence !== 'confirmed' || meta.strategy !== 'listing_id_detected') {
    return false;
  }
  const url = result.externalUrl;
  if (!url || typeof url !== 'string') return false;
  const id = result.externalListingId;
  if (!id) return false;
  return url.includes(String(id));
}

export type ListingUrlResolution = {
  externalUrl: string | null;
  resolvedVia: 'direct_confirmed' | 'fetchListingUrl' | 'none';
};

/**
 * Resolves a listing detail URL that was verified in-session (Selenium) or was
 * taken from the confirmed post-submit redirect. Never promotes a guessed URL
 * (e.g. /elanlar/{id} without opening the page) to "success".
 */
export async function resolveVerifiedListingUrl(
  connector: PlatformConnector,
  publishResult: ConnectorPublishResult,
  context?: ConnectorContext,
): Promise<ListingUrlResolution> {
  const direct = publishResult.externalUrl ?? null;

  if (isTrustedDirectListingUrl(publishResult)) {
    return { externalUrl: direct, resolvedVia: 'direct_confirmed' };
  }

  try {
    const fetched = (await connector.fetchListingUrl(publishResult, context)) ?? null;
    if (fetched) {
      return { externalUrl: fetched, resolvedVia: 'fetchListingUrl' };
    }
  } catch {
    // Connector normalizes in caller when needed; here we treat as unresolved.
  }

  return { externalUrl: null, resolvedVia: 'none' };
}
