import type { SalexDealKind, SalexFamilyId, SalexMainId } from '../../catalog/salexCategoryTypes';

/** Deterministic structured slice copied onto every platform payload for connectors / metadata. */
export type MappedListingStructuredFields = {
  mainId: SalexMainId;
  familyId: SalexFamilyId;
  brand: string | null;
  model: string | null;
  condition: string | null;
  dealKind: SalexDealKind;
  listingTypeLabel: string | null;
};

export type PlatformPayloadBase = {
  categoryPath: string[];
  /** Human-readable path (same as DB category string when complete) */
  categoryDisplay: string;
  structured: MappedListingStructuredFields;
};
