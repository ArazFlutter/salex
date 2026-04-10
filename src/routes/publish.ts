import { Router } from 'express';
import { createPublishJobController, getPublishJobStatusController } from '../controllers/publishController';

const publishRouter = Router();

publishRouter.post('/:listingId', createPublishJobController);
publishRouter.get('/:id/status', getPublishJobStatusController);

export { publishRouter };
