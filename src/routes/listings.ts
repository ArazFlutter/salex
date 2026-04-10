import { Router } from 'express';
import {
  createListingController,
  getListingByIdController,
  getListingsController,
  uploadListingImageController,
} from '../controllers/listingController';
import { listingImageUpload } from '../middleware/listingImageUpload';

const listingsRouter = Router();

listingsRouter.post('/upload-image', listingImageUpload.single('image'), uploadListingImageController);
listingsRouter.post('/', createListingController);
listingsRouter.get('/', getListingsController);
listingsRouter.get('/:id', getListingByIdController);

export { listingsRouter };
