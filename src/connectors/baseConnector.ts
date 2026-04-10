import type { PlatformId } from '../utils/platforms';
import { ListingMappingValidationError } from '../mappers/listingMappingErrors';

export type ConnectorPublishResult = {
  externalListingId?: string;
  externalUrl?: string | null;
  publishMetadata?: Record<string, unknown> | null;
};

export type ConnectorError = {
  code: string;
  message: string;
};

export type ConnectorContext = {
  userId?: string;
};

export interface PlatformConnector {
  publishListing(payload: Record<string, unknown>, context?: ConnectorContext): Promise<ConnectorPublishResult>;
  getListingUrl(result: ConnectorPublishResult): Promise<string | null> | string | null;
  normalizeError(error: unknown): ConnectorError;
  fetchListingUrl(result: ConnectorPublishResult, context?: ConnectorContext): Promise<string | null>;
}

export abstract class BaseConnector implements PlatformConnector {
  constructor(
    readonly platformId: PlatformId,
    readonly platformName: string,
  ) {}

  abstract publishListing(payload: Record<string, unknown>, context?: ConnectorContext): Promise<ConnectorPublishResult>;

  getListingUrl(result: ConnectorPublishResult): string | null {
    return result.externalUrl ?? null;
  }

  async fetchListingUrl(_result: ConnectorPublishResult, _context?: ConnectorContext): Promise<string | null> {
    return null;
  }

  normalizeError(error: unknown): ConnectorError {
    if (error instanceof ListingMappingValidationError) {
      return {
        code: error.mappingCode,
        message: error.message,
      };
    }

    if (error instanceof Error && error.name === 'ListingMappingError') {
      return {
        code: 'MAPPING_VALIDATION_ERROR',
        message: error.message,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'CONNECTOR_ERROR',
        message: error.message,
      };
    }

    return {
      code: 'UNKNOWN_CONNECTOR_ERROR',
      message: 'Unknown connector error',
    };
  }
}
