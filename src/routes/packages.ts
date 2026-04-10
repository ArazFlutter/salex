import { Router } from 'express';
import {
  getCurrentPackageController,
  getPackageCatalogController,
  selectPackageController,
} from '../controllers/packageController';

const packagesRouter = Router();

packagesRouter.get('/catalog', getPackageCatalogController);
packagesRouter.get('/current', getCurrentPackageController);
packagesRouter.post('/select', selectPackageController);

export { packagesRouter };
