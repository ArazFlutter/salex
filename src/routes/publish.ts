import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createPublishJobController, getPublishJobStatusController } from '../controllers/publishController';

const publishRouter = Router();

publishRouter.post('/:listingId', requireAuth, createPublishJobController);
publishRouter.get('/:id/status', requireAuth, getPublishJobStatusController);

export { publishRouter };
