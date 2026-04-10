import type { NormalizedListing } from '../normalizeListing';
import type { MappedListingStructuredFields } from './payloadTypes';
import type { ResolvedSalexTaxonomy } from '../../catalog/salexCategoryTypes';
import { ListingMappingValidationError } from '../listingMappingErrors';

export function requireTaxonomy(listing: NormalizedListing): ResolvedSalexTaxonomy {
  if (!listing.salexTaxonomy) {
    const err = listing.taxonomyResolveError;
    throw new ListingMappingValidationError(
      err?.code ?? 'CATEGORY_MAPPING_MISSING',
      err?.message ?? 'Category taxonomy could not be resolved',
    );
  }
  return listing.salexTaxonomy;
}

export function buildStructuredFields(t: ResolvedSalexTaxonomy): MappedListingStructuredFields {
  return {
    mainId: t.mainId,
    familyId: t.familyId,
    brand: t.brand,
    model: t.model,
    condition: t.condition,
    dealKind: t.dealKind,
    listingTypeLabel: t.listingTypeLabel,
  };
}
