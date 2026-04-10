import type { Request, Response } from 'express';
import { createListing, getListingById, getListings } from '../services/listingService';
import { getCurrentUser } from '../services/userService';
import { AppError } from '../utils/AppError';

export async function createListingController(request: Request, response: Response) {
  response.status(201).json(await createListing(request.body ?? {}));
}

export async function getListingsController(_request: Request, response: Response) {
  response.status(200).json(await getListings());
}

export async function getListingByIdController(request: Request, response: Response) {
  response.status(200).json(await getListingById(String(request.params.id ?? '')));
}

export async function uploadListingImageController(request: Request, response: Response) {
  await getCurrentUser();
  if (!request.file) {
    throw new AppError('Image file is required (field name: image)', 400);
  }
  response.status(201).json({
    success: true,
    url: `/uploads/${request.file.filename}`,
  });
}
