import { Router } from 'express';
import { getMeController } from '../controllers/userController';

const meRouter = Router();

meRouter.get('/', getMeController);

export { meRouter };
