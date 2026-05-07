import type { Request, Response } from 'express';
import { createPublishJob, getPublishJobStatus } from '../services/publishService';

export async function createPublishJobController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(201).json(await createPublishJob(userId, String(request.params.listingId ?? '')));
}

export async function getPublishJobStatusController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(200).json(await getPublishJobStatus(userId, String(request.params.id ?? '')));
}
