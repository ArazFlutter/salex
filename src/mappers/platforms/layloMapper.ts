import { ListingMappingError, type NormalizedListing } from '../normalizeListing';
import { buildStructuredFields, requireTaxonomy } from './mappingUtils';
import type { MappedListingStructuredFields } from './payloadTypes';

export type LayloPayload = {
  listingId: string;
  title: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  status: 'draft' | 'active';
  categoryPath: string[];
  categoryDisplay: string;
  structured: MappedListingStructuredFields;
};

function requireText(platform: string, field: string, value: string): string {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new ListingMappingError(platform, field);
  }

  return normalizedValue;
}

function requireNumber(platform: string, field: string, value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new ListingMappingError(platform, field, `Invalid numeric field "${field}" for ${platform}`);
  }

  return value;
}

export function mapNormalizedListingToLaylo(listing: NormalizedListing): LayloPayload {
  const t = requireTaxonomy(listing);

  return {
    listingId: requireText('Laylo.az', 'id', listing.id),
    title: requireText('Laylo.az', 'title', listing.title),
    price: requireNumber('Laylo.az', 'price', listing.price),
    city: requireText('Laylo.az', 'city', listing.city),
    description: requireText('Laylo.az', 'description', listing.description),
    images: Array.isArray(listing.images) ? listing.images : [],
    status: listing.status,
    categoryPath: [...t.segments],
    categoryDisplay: t.segments.join(' → '),
    structured: buildStructuredFields(t),
  };
}
