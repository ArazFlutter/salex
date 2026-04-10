import { Router } from 'express';
import {
  confirmPaymentController,
  createPaymentController,
  getPaymentOrderController,
} from '../controllers/paymentController';

const paymentsRouter = Router();

paymentsRouter.post('/create', createPaymentController);
paymentsRouter.post('/confirm', confirmPaymentController);
paymentsRouter.get('/:id', getPaymentOrderController);

export { paymentsRouter };
