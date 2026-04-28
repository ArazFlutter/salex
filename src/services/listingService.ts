import { AppError } from '../utils/AppError';
import { query } from '../db/pool';
import {
  buildInternalListing,
  normalizeInternalListingInput,
  type InternalListing,
  type InternalListingInput,
  type ListingStatus,
} from '../utils/internalListing';
import { getListingLimitForPlan } from '../config/packagePlans';
import { getCurrentUser } from './userService';

export type Listing = InternalListing;

type ListingRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  price: string;
  city: string;
  description: string;
  images: string[];
  status: ListingStatus;
  created_at: Date;
};

type CountRow = {
  count: number;
};

function isListingStatus(value: string): value is ListingStatus {
  return value === 'draft' || value === 'active';
}

function validateCreateInput(input: InternalListingInput): asserts input is InternalListingInput & { status: ListingStatus } {
  if (!input.title.trim()) {
    throw new AppError('Title is required', 400);
  }

  if (!input.category.trim()) {
    throw new AppError('Category is required', 400);
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new AppError('Price must be a valid number', 400);
  }

  if (!input.city.trim()) {
    throw new AppError('City is required', 400);
  }

  if (!input.description.trim()) {
    throw new AppError('Description is required', 400);
  }

  if (!Array.isArray(input.images)) {
    throw new AppError('Images must be an array', 400);
  }

  if (!isListingStatus(input.status)) {
    throw new AppError('Status must be draft or active', 400);
  }
}

function mapListingRow(row: ListingRow): InternalListing {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    price: Number(row.price),
    city: row.city,
    description: row.description,
    images: Array.isArray(row.images) ? row.images : [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/** Active listings only — matches dashboard / product listing limits. */
async function getUserActiveListingsCount(userId: string): Promise<number> {
  const result = await query<CountRow>(
    `SELECT COUNT(*)::int AS count
     FROM listings
     WHERE user_id = $1 AND status = 'active'`,
    [userId],
  );

  return result.rows[0]?.count ?? 0;
}

async function enforceListingLimit(userId: string, listingLimit: number | null) {
  if (listingLimit === null) {
    return;
  }

  const currentCount = await getUserActiveListingsCount(userId);

  if (currentCount >= listingLimit) {
    throw new AppError('Listing limit reached for current package', 403);
  }
}

export async function createListing(userId: string, payload: Partial<InternalListingInput>) {
  const currentUser = await getCurrentUser(userId);
  const input = normalizeInternalListingInput(payload);

  validateCreateInput(input);
  await enforceListingLimit(currentUser.id, getListingLimitForPlan(currentUser.activePlan));

  const listing = buildInternalListing(currentUser.id, input);

  await query(
    `INSERT INTO listings (id, user_id, title, category, price, city, description, images, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)`,
    [
      listing.id,
      listing.userId,
      listing.title,
      listing.category,
      listing.price,
      listing.city,
      listing.description,
      JSON.stringify(listing.images),
      listing.status,
      listing.createdAt,
    ],
  );

  return {
    success: true,
    listing,
  };
}

export async function getListings(userId: string) {
  const currentUser = await getCurrentUser(userId);
  const result = await query<ListingRow>(
    `SELECT id, user_id, title, category, price, city, description, images, status, created_at
     FROM listings
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [currentUser.id],
  );
  const userListings = result.rows.map(mapListingRow);

  return {
    success: true,
    listings: userListings,
  };
}

export async function getListingById(userId: string, id: string) {
  const listing = await requireCurrentUserListing(userId, id);

  return {
    success: true,
    listing,
  };
}

export async function requireCurrentUserListing(userId: string, id: string): Promise<InternalListing> {
  const currentUser = await getCurrentUser(userId);
  const result = await query<ListingRow>(
    `SELECT id, user_id, title, category, price, city, description, images, status, created_at
     FROM listings
     WHERE id = $1
       AND user_id = $2
     LIMIT 1`,
    [id, currentUser.id],
  );

  if (result.rowCount === 0) {
    throw new AppError('Listing not found', 404);
  }

  return mapListingRow(result.rows[0]);
}
