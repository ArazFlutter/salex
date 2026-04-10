import { AppError } from '../utils/AppError';
import type { PlatformId } from '../utils/platforms';
import { TapazConnector } from './tapazConnector';
import { LalafoConnector } from './lalafoConnector';
import { AlanazConnector } from './alanazConnector';
import { LayloConnector } from './layloConnector';
import { BirjacomConnector } from './birjacomConnector';
import type { PlatformConnector } from './baseConnector';

const connectors = new Map<PlatformId, PlatformConnector>([
  ['tapaz', new TapazConnector()],
  ['lalafo', new LalafoConnector()],
  ['alanaz', new AlanazConnector()],
  ['laylo', new LayloConnector()],
  ['birjacom', new BirjacomConnector()],
]);

export function getConnector(platformId: PlatformId): PlatformConnector {
  const connector = connectors.get(platformId);

  if (!connector) {
    throw new AppError(`Connector is not implemented for ${platformId}`, 400);
  }

  return connector;
}
