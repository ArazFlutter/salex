import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getCurrentPackageController,
  getPackageCatalogController,
  selectPackageController,
} from '../controllers/packageController';

const packagesRouter = Router();

packagesRouter.get('/catalog', getPackageCatalogController);
packagesRouter.get('/current', requireAuth, getCurrentPackageController);
packagesRouter.post('/select', requireAuth, selectPackageController);

export { packagesRouter };
