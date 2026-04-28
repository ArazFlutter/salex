import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  confirmPaymentController,
  createPaymentController,
  getPaymentOrderController,
} from '../controllers/paymentController';

const paymentsRouter = Router();

paymentsRouter.post('/create', requireAuth, createPaymentController);
paymentsRouter.post('/confirm', requireAuth, confirmPaymentController);
paymentsRouter.get('/:id', requireAuth, getPaymentOrderController);

export { paymentsRouter };
