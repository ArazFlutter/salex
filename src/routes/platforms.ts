import { Router } from 'express';
import { connectPlatformController, getPlatformsController } from '../controllers/platformController';

const platformsRouter = Router();

platformsRouter.post('/connect', connectPlatformController);
platformsRouter.get('/', getPlatformsController);

export { platformsRouter };
