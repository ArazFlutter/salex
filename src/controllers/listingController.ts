import type { Request, Response } from 'express';
import { createListing, getListingById, getListings } from '../services/listingService';
import { getCurrentUser } from '../services/userService';
import { AppError } from '../utils/AppError';

export async function createListingController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(201).json(await createListing(userId, request.body ?? {}));
}

export async function getListingsController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(200).json(await getListings(userId));
}

export async function getListingByIdController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(200).json(await getListingById(userId, String(request.params.id ?? '')));
}

export async function uploadListingImageController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  await getCurrentUser(userId);
  if (!request.file) {
    throw new AppError('Image file is required (field name: image)', 400);
  }
  response.status(201).json({
    success: true,
    url: `/uploads/${request.file.filename}`,
  });
}
