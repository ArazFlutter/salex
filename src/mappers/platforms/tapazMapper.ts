import { ListingMappingError, type NormalizedListing } from '../normalizeListing';
import { buildStructuredFields, requireTaxonomy } from './mappingUtils';
import type { MappedListingStructuredFields } from './payloadTypes';

export type TapazPayload = {
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

export function mapNormalizedListingToTapaz(listing: NormalizedListing): TapazPayload {
  const t = requireTaxonomy(listing);

  return {
    listingId: requireText('Tap.az', 'id', listing.id),
    title: requireText('Tap.az', 'title', listing.title),
    price: requireNumber('Tap.az', 'price', listing.price),
    city: requireText('Tap.az', 'city', listing.city),
    description: requireText('Tap.az', 'description', listing.description),
    images: Array.isArray(listing.images) ? listing.images : [],
    status: listing.status,
    categoryPath: [...t.segments],
    categoryDisplay: t.segments.join(' → '),
    structured: buildStructuredFields(t),
  };
}
