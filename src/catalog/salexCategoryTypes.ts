/**
 * Internal SALex taxonomy — mirrors active create-listing paths today
 * (Elektronika, Daşınmaz əmlak, Avtomobillər). Removed UI flows are not modeled here.
 */

export type SalexMainId = 'electronics' | 'real_estate' | 'vehicles_cars';

export type SalexFamilyId =
  | 'electronics_smartphones'
  | 'electronics_feature_phones'
  | 'electronics_tablets'
  | 'electronics_laptops'
  | 'electronics_tv'
  | 'electronics_audio'
  | 'electronics_cameras'
  | 'electronics_gaming'
  | 'electronics_wearables'
  | 'electronics_headphones'
  | 'electronics_phone_accessories'
  | 'real_estate_apartments'
  | 'real_estate_villas'
  | 'real_estate_land'
  | 'real_estate_commercial'
  | 'real_estate_garages'
  | 'vehicles_cars_family';

export type SalexDealKind = 'sale' | 'rent_long' | 'rent_short' | 'unknown';

export type ResolvedSalexTaxonomy = {
  mainId: SalexMainId;
  familyId: SalexFamilyId;
  /** Original UI segments (trimmed), e.g. ["Elektronika","Telefonlar və aksesuarlar",...] */
  segments: string[];
  /** Index of the family keyword segment within segments */
  familySegmentIndex: number;
  brand: string | null;
  model: string | null;
  condition: string | null;
  dealKind: SalexDealKind;
  listingTypeLabel: string | null;
};

export type TaxonomyResolveResult =
  | { ok: true; value: ResolvedSalexTaxonomy }
  | { ok: false; code: 'CATEGORY_MAPPING_MISSING'; message: string }
  | { ok: false; code: 'SUBCATEGORY_MAPPING_MISSING'; message: string }
  | { ok: false; code: 'REQUIRED_FIELD_MISSING'; message: string }
  | { ok: false; code: 'AMBIGUOUS_PLATFORM_MAPPING'; message: string };
