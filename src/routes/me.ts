import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMeController } from '../controllers/userController';

const meRouter = Router();

meRouter.get('/', requireAuth, getMeController);

export { meRouter };
