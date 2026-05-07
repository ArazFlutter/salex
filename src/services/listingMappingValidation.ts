import type { PlatformId } from '../utils/platforms';
import type { ResolvedSalexTaxonomy } from '../catalog/salexCategoryTypes';
import { ListingMappingValidationError } from '../mappers/listingMappingErrors';

/**
 * Families we can deterministically navigate on all five marketplaces with the current Selenium flows.
 * Expand this set as additional platform slug / path tables are added.
 */
const GLOBALLY_MAPPED_FAMILIES = new Set<ResolvedSalexTaxonomy['familyId']>([
  'electronics_smartphones',
  'electronics_feature_phones',
  'electronics_tablets',
  'electronics_laptops',
  'electronics_tv',
  'electronics_audio',
  'electronics_cameras',
  'electronics_gaming',
  'electronics_wearables',
  'electronics_headphones',
  'electronics_phone_accessories',
  'real_estate_apartments',
  'real_estate_villas',
  'real_estate_land',
  'real_estate_commercial',
  'real_estate_garages',
  'vehicles_cars_family',
]);

export function assertPlatformTaxonomySupported(
  platformId: PlatformId,
  taxonomy: ResolvedSalexTaxonomy,
): void {
  if (!GLOBALLY_MAPPED_FAMILIES.has(taxonomy.familyId)) {
    throw new ListingMappingValidationError(
      'SUBCATEGORY_MAPPING_MISSING',
      `No explicit ${platformId} mapping for family "${taxonomy.familyId}"`,
    );
  }
}

export function validateListingMappingForPublish(
  platformId: PlatformId,
  taxonomy: ResolvedSalexTaxonomy,
): void {
  assertPlatformTaxonomySupported(platformId, taxonomy);
}
