import { Router } from 'express';
import { authRouter } from './auth';
import { healthRouter } from './health';
import { listingsRouter } from './listings';
import { meRouter } from './me';
import { packagesRouter } from './packages';
import { paymentsRouter } from './payments';
import { platformsRouter } from './platforms';
import { publishRouter } from './publish';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/listings', listingsRouter);
apiRouter.use('/me', meRouter);
apiRouter.use('/packages', packagesRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/platforms', platformsRouter);
apiRouter.use('/publish', publishRouter);

export { apiRouter };
