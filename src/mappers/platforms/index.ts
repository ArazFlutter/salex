import type { PlatformId } from '../../utils/platforms';
import type { NormalizedListing } from '../normalizeListing';
import { mapNormalizedListingToTapaz, type TapazPayload } from './tapazMapper';
import { mapNormalizedListingToLalafo, type LalafoPayload } from './lalafoMapper';
import { mapNormalizedListingToAlanaz, type AlanazPayload } from './alanazMapper';
import { mapNormalizedListingToLaylo, type LayloPayload } from './layloMapper';
import { mapNormalizedListingToBirjacom, type BirjacomPayload } from './birjacomMapper';

export type PlatformPublishPayload = TapazPayload | LalafoPayload | AlanazPayload | LayloPayload | BirjacomPayload;

export function mapToPlatformPayload(platform: PlatformId, listing: NormalizedListing): PlatformPublishPayload {
  switch (platform) {
    case 'tapaz':
      return mapNormalizedListingToTapaz(listing);
    case 'lalafo':
      return mapNormalizedListingToLalafo(listing);
    case 'alanaz':
      return mapNormalizedListingToAlanaz(listing);
    case 'laylo':
      return mapNormalizedListingToLaylo(listing);
    case 'birjacom':
      return mapNormalizedListingToBirjacom(listing);
  }
}
