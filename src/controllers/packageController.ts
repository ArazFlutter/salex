import type { Request, Response } from 'express';
import { getCurrentPackage, getPackageCatalog, selectPackage } from '../services/packageService';

export async function getPackageCatalogController(_request: Request, response: Response) {
  response.status(200).json(getPackageCatalog());
}

export async function getCurrentPackageController(_request: Request, response: Response) {
  response.status(200).json(await getCurrentPackage());
}

export async function selectPackageController(request: Request, response: Response) {
  const plan = String(request.body?.plan ?? '');

  response.status(200).json(await selectPackage(plan));
}
