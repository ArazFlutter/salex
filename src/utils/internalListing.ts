import { randomUUID } from 'node:crypto';

export type ListingStatus = 'draft' | 'active';

export type InternalListing = {
  id: string;
  userId: string;
  title: string;
  category: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  status: ListingStatus;
  createdAt: string;
};

export type InternalListingInput = {
  title: string;
  category: string;
  price: number;
  city: string;
  description: string;
  images: string[];
  status: string;
};

export function normalizeInternalListingInput(payload: Partial<InternalListingInput>): InternalListingInput {
  return {
    title: String(payload.title ?? '').trim(),
    category: String(payload.category ?? '').trim(),
    price: Number(payload.price),
    city: String(payload.city ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    images: Array.isArray(payload.images) ? payload.images.map((image) => String(image)) : [],
    status: String(payload.status ?? 'draft'),
  };
}

export function buildInternalListing(
  userId: string,
  input: Omit<InternalListing, 'id' | 'userId' | 'createdAt'>,
): InternalListing {
  return {
    id: `listing-${randomUUID()}`,
    userId,
    title: input.title,
    category: input.category,
    price: input.price,
    city: input.city,
    description: input.description,
    images: input.images,
    status: input.status,
    createdAt: new Date().toISOString(),
  };
}
