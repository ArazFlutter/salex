import type { Request, Response } from 'express';
import { confirmPaymentOrder, createPaymentOrder, getPaymentOrderById } from '../services/paymentService';

export async function createPaymentController(request: Request, response: Response) {
  const plan = String(request.body?.plan ?? '');
  response.status(201).json(await createPaymentOrder(plan));
}

export async function confirmPaymentController(request: Request, response: Response) {
  const paymentOrderId = String(request.body?.paymentOrderId ?? request.body?.id ?? '');
  response.status(200).json(await confirmPaymentOrder(paymentOrderId));
}

export async function getPaymentOrderController(request: Request, response: Response) {
  const id = String(request.params.id ?? '');
  response.status(200).json(await getPaymentOrderById(id));
}
