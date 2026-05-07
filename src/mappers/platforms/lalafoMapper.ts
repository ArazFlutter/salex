import { ListingMappingError, type NormalizedListing } from '../normalizeListing';
import { buildStructuredFields, requireTaxonomy } from './mappingUtils';
import type { MappedListingStructuredFields } from './payloadTypes';

export type LalafoPayload = {
  externalId: string;
  name: string;
  amount: number;
  location: string;
  details: string;
  photos: string[];
  state: 'draft' | 'active';
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

export function mapNormalizedListingToLalafo(listing: NormalizedListing): LalafoPayload {
  const t = requireTaxonomy(listing);

  return {
    externalId: requireText('Lalafo', 'id', listing.id),
    name: requireText('Lalafo', 'title', listing.title),
    amount: requireNumber('Lalafo', 'price', listing.price),
    location: requireText('Lalafo', 'city', listing.city),
    details: requireText('Lalafo', 'description', listing.description),
    photos: Array.isArray(listing.images) ? listing.images : [],
    state: listing.status,
    categoryPath: [...t.segments],
    categoryDisplay: t.segments.join(' → '),
    structured: buildStructuredFields(t),
  };
}
