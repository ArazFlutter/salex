import { Router } from 'express';
import {
  createListingController,
  getListingByIdController,
  getListingsController,
  uploadListingImageController,
} from '../controllers/listingController';
import { requireAuth } from '../middleware/auth';
import { listingImageUpload } from '../middleware/listingImageUpload';

const listingsRouter = Router();

listingsRouter.post('/upload-image', requireAuth, listingImageUpload.single('image'), uploadListingImageController);
listingsRouter.post('/', requireAuth, createListingController);
listingsRouter.get('/', requireAuth, getListingsController);
listingsRouter.get('/:id', requireAuth, getListingByIdController);

export { listingsRouter };
