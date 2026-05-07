export type ListingMappingErrorCode =
  | 'CATEGORY_MAPPING_MISSING'
  | 'SUBCATEGORY_MAPPING_MISSING'
  | 'REQUIRED_FIELD_MISSING'
  | 'AMBIGUOUS_PLATFORM_MAPPING'
  | 'MAPPING_VALIDATION_ERROR';

export class ListingMappingValidationError extends Error {
  readonly mappingCode: ListingMappingErrorCode;

  constructor(mappingCode: ListingMappingErrorCode, message: string) {
    super(message);
    this.name = 'ListingMappingValidationError';
    this.mappingCode = mappingCode;
  }
}
