import type { Request, Response } from 'express';
import { createPublishJob, getPublishJobStatus } from '../services/publishService';

export async function createPublishJobController(request: Request, response: Response) {
  response.status(201).json(await createPublishJob(String(request.params.listingId ?? '')));
}

export async function getPublishJobStatusController(request: Request, response: Response) {
  response.status(200).json(await getPublishJobStatus(String(request.params.id ?? '')));
}
