import { Router } from 'express';
import { resetMySessionController } from '../controllers/devController';

const devRouter = Router();

// Only available in development
if (process.env.NODE_ENV !== 'production') {
  devRouter.post('/reset-my-session', resetMySessionController);
}

export { devRouter };
