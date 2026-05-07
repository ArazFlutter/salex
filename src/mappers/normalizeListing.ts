import type { InternalListing } from '../utils/internalListing';
import type { TaxonomyResolveResult } from '../catalog/salexCategoryTypes';
import type { ResolvedSalexTaxonomy } from '../catalog/salexCategoryTypes';
import { resolveSalexTaxonomy, splitCategoryPath } from '../catalog/resolveSalexTaxonomy';

type DetailGroup = Record<string, unknown>;

export type NormalizedListing = {
  id: string;
  userId: string;
  title: string;
  category: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  status: 'draft' | 'active';
  createdAt: string;
  carDetails?: DetailGroup;
  motorcycleDetails?: DetailGroup;
  vehiclePartDetails?: DetailGroup;
  /** Segments from the stored `category` path (split on →). */
  categorySegments: string[];
  /** Populated when `resolveSalexTaxonomy` succeeds. */
  salexTaxonomy: ResolvedSalexTaxonomy | null;
  /** When taxonomy fails, carries the validation code + message for publish errors. */
  taxonomyResolveError: Extract<TaxonomyResolveResult, { ok: false }> | null;
};

export class ListingMappingError extends Error {
  constructor(
    readonly platform: string,
    readonly field: string,
    message?: string,
  ) {
    super(message ?? `Missing required field "${field}" for ${platform}`);
    this.name = 'ListingMappingError';
  }
}

export function normalizeListing(rawListing: InternalListing & {
  carDetails?: DetailGroup;
  motorcycleDetails?: DetailGroup;
  vehiclePartDetails?: DetailGroup;
}): NormalizedListing {
  const category = String(rawListing.category ?? '').trim();
  const categorySegments = splitCategoryPath(category);
  const taxonomyResult = resolveSalexTaxonomy(category);

  return {
    id: rawListing.id,
    userId: rawListing.userId,
    title: String(rawListing.title ?? '').trim(),
    category,
    price: Number(rawListing.price),
    city: String(rawListing.city ?? '').trim(),
    description: String(rawListing.description ?? '').trim(),
    images: Array.isArray(rawListing.images) ? rawListing.images.map((image) => String(image)) : [],
    status: rawListing.status,
    createdAt: rawListing.createdAt,
    carDetails: rawListing.carDetails,
    motorcycleDetails: rawListing.motorcycleDetails,
    vehiclePartDetails: rawListing.vehiclePartDetails,
    categorySegments,
    salexTaxonomy: taxonomyResult.ok ? taxonomyResult.value : null,
    taxonomyResolveError: taxonomyResult.ok ? null : taxonomyResult,
  };
}
