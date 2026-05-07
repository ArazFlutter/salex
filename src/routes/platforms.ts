import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { connectPlatformController, getPlatformsController } from '../controllers/platformController';

const platformsRouter = Router();

platformsRouter.post('/connect', requireAuth, connectPlatformController);
platformsRouter.get('/', requireAuth, getPlatformsController);

export { platformsRouter };
