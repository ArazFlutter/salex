import { Router } from 'express';
import { healthController } from '../controllers/healthController';

const healthRouter = Router();

healthRouter.get('/', healthController);

export { healthRouter };
