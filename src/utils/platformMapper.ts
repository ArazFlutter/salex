import type { InternalListing } from './internalListing';
import { AppError } from './AppError';
import { type PlatformId, normalizePlatformId } from './platforms';

type TapAzPayload = {
  listingId: string;
  title: string;
  category: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  status: 'draft' | 'active';
};

type LalafoPayload = {
  externalId: string;
  name: string;
  categoryName: string;
  amount: number;
  location: string;
  details: string;
  photos: string[];
  state: 'draft' | 'active';
};

type AlanAzPayload = {
  adId: string;
  headline: string;
  section: string;
  priceAzn: number;
  region: string;
  body: string;
  gallery: string[];
  publishStatus: 'draft' | 'active';
};

type LayloPayload = {
  id: string;
  subject: string;
  rubric: string;
  cost: number;
  settlement: string;
  text: string;
  media: string[];
  mode: 'draft' | 'active';
};

type BirjaPayload = {
  sourceId: string;
  title: string;
  group: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  visibility: 'draft' | 'active';
};

export type PlatformListingPayload =
  | TapAzPayload
  | LalafoPayload
  | AlanAzPayload
  | LayloPayload
  | BirjaPayload;

export function mapToPlatform(platform: PlatformId, listing: InternalListing): PlatformListingPayload {
  switch (platform) {
    case 'tapaz':
      return {
        listingId: listing.id,
        title: listing.title,
        category: listing.category,
        price: listing.price,
        city: listing.city,
        description: listing.description,
        images: listing.images,
        status: listing.status,
      };
    case 'lalafo':
      return {
        externalId: listing.id,
        name: listing.title,
        categoryName: listing.category,
        amount: listing.price,
        location: listing.city,
        details: listing.description,
        photos: listing.images,
        state: listing.status,
      };
    case 'alanaz':
      return {
        adId: listing.id,
        headline: listing.title,
        section: listing.category,
        priceAzn: listing.price,
        region: listing.city,
        body: listing.description,
        gallery: listing.images,
        publishStatus: listing.status,
      };
    case 'laylo':
      return {
        id: listing.id,
        subject: listing.title,
        rubric: listing.category,
        cost: listing.price,
        settlement: listing.city,
        text: listing.description,
        media: listing.images,
        mode: listing.status,
      };
    case 'birjacom':
      return {
        sourceId: listing.id,
        title: listing.title,
        group: listing.category,
        price: listing.price,
        city: listing.city,
        description: listing.description,
        images: listing.images,
        visibility: listing.status,
      };
    default: {
      const exhaustiveCheck: never = platform;
      throw new AppError(`Unsupported platform mapping: ${exhaustiveCheck}`, 400);
    }
  }
}

export function mapToPlatformByInput(platform: string, listing: InternalListing): PlatformListingPayload {
  const normalizedPlatform = normalizePlatformId(platform);

  if (!normalizedPlatform) {
    throw new AppError('Unsupported platform', 400);
  }

  return mapToPlatform(normalizedPlatform, listing);
}
