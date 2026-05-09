import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  connectPlatformController,
  getPlatformsController,
  startPlatformLoginController,
  verifyPlatformOtpController,
} from '../controllers/platformController';

const platformsRouter = Router();

platformsRouter.get('/', requireAuth, getPlatformsController);
platformsRouter.post('/connect', requireAuth, connectPlatformController);
platformsRouter.post('/:platform/start-login', requireAuth, startPlatformLoginController);
platformsRouter.post('/:platform/verify-otp', requireAuth, verifyPlatformOtpController);

export { platformsRouter };
