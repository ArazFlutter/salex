import type {
  ResolvedSalexTaxonomy,
  SalexDealKind,
  SalexFamilyId,
  SalexMainId,
  TaxonomyResolveResult,
} from './salexCategoryTypes';

const SEP = /→|➜|->/;

export function splitCategoryPath(raw: string): string[] {
  return raw
    .split(SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inferDealKind(segment: string): SalexDealKind {
  const s = segment.toLowerCase();
  if (s.includes('satılır') || s.includes('satilir')) return 'sale';
  if (s.includes('kirayə') || s.includes('kiraye') || s.includes('kiray?')) return 'rent_long';
  return 'unknown';
}

const FAMILY_KEYWORDS: { keyword: string; mainId: SalexMainId; familyId: SalexFamilyId }[] = [
  { keyword: 'Smartfonlar', mainId: 'electronics', familyId: 'electronics_smartphones' },
  { keyword: 'Düyməli telefonlar', mainId: 'electronics', familyId: 'electronics_feature_phones' },
  { keyword: 'Planşetlər', mainId: 'electronics', familyId: 'electronics_tablets' },
  { keyword: 'Noutbuklar', mainId: 'electronics', familyId: 'electronics_laptops' },
  { keyword: 'Televizorlar', mainId: 'electronics', familyId: 'electronics_tv' },
  { keyword: 'Audio sistemlər və dinamiklər', mainId: 'electronics', familyId: 'electronics_audio' },
  { keyword: 'Fotoaparatlar və videokameralar', mainId: 'electronics', familyId: 'electronics_cameras' },
  { keyword: 'Oyun konsolları və oyun aksesuarları', mainId: 'electronics', familyId: 'electronics_gaming' },
  { keyword: 'Smart saatlar və qolbaqlar', mainId: 'electronics', familyId: 'electronics_wearables' },
  { keyword: 'Qulaqlıqlar', mainId: 'electronics', familyId: 'electronics_headphones' },
  { keyword: 'Telefon aksesuarları', mainId: 'electronics', familyId: 'electronics_phone_accessories' },
  { keyword: 'Mənzillər', mainId: 'real_estate', familyId: 'real_estate_apartments' },
  { keyword: 'Villalar, bağ evləri', mainId: 'real_estate', familyId: 'real_estate_villas' },
  { keyword: 'Torpaq', mainId: 'real_estate', familyId: 'real_estate_land' },
  { keyword: 'Obyektlər və ofislər', mainId: 'real_estate', familyId: 'real_estate_commercial' },
  { keyword: 'Qarajlar', mainId: 'real_estate', familyId: 'real_estate_garages' },
];

function findFamily(segments: string[]): { index: number; mainId: SalexMainId; familyId: SalexFamilyId } | null {
  for (const { keyword, mainId, familyId } of FAMILY_KEYWORDS) {
    const idx = segments.findIndex((s) => s === keyword);
    if (idx >= 0) return { index: idx, mainId, familyId };
  }
  return null;
}

/** Last meaningful tail segment often used as condition (Yeni / İşlənmiş / Köhnə) for electronics flows */
const CONDITION_MARKERS = new Set(['Yeni', 'İşlənmiş', 'Köhnə', 'Yeni kim']);

function extractConditionFromTail(segments: string[], minIndex: number): string | null {
  for (let i = segments.length - 1; i > minIndex; i--) {
    if (CONDITION_MARKERS.has(segments[i])) return segments[i];
  }
  return null;
}

export function resolveSalexTaxonomy(categoryRaw: string): TaxonomyResolveResult {
  const segments = splitCategoryPath(categoryRaw);

  if (segments.length === 0) {
    return { ok: false, code: 'CATEGORY_MAPPING_MISSING', message: 'Listing category path is empty' };
  }

  const root = segments[0];

  if (root === 'Elektronika' && segments.length < 2) {
    return {
      ok: false,
      code: 'SUBCATEGORY_MAPPING_MISSING',
      message: 'Elektronika listing must include department and product path (subcategory)',
    };
  }

  if (root === 'Daşınmaz əmlak' && segments.length < 3) {
    return {
      ok: false,
      code: 'SUBCATEGORY_MAPPING_MISSING',
      message: 'Daşınmaz əmlak listing must include property type and deal type at minimum',
    };
  }

  const carIndex = segments.findIndex((s) => s === 'Avtomobillər');
  if (carIndex >= 0) {
    if (segments.length < carIndex + 3) {
      return {
        ok: false,
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Avtomobillər listing must include brand and model in the category path',
      };
    }
    const brand = segments[carIndex + 1] ?? null;
    const model = segments[carIndex + 2] ?? null;
    if (!brand || !model) {
      return { ok: false, code: 'REQUIRED_FIELD_MISSING', message: 'Vehicle brand and model are required' };
    }
    const value: ResolvedSalexTaxonomy = {
      mainId: 'vehicles_cars',
      familyId: 'vehicles_cars_family',
      segments,
      familySegmentIndex: carIndex,
      brand,
      model,
      condition: extractConditionFromTail(segments, carIndex + 2),
      dealKind: 'sale',
      listingTypeLabel: 'Avtomobillər',
    };
    return { ok: true, value };
  }

  const familyHit = findFamily(segments);
  if (!familyHit) {
    return {
      ok: false,
      code: 'CATEGORY_MAPPING_MISSING',
      message: `Unrecognized SALex category branch (root "${root}")`,
    };
  }

  const { index: familyIdx, mainId, familyId } = familyHit;

  if (root === 'Elektronika' && familyIdx < 2) {
    return {
      ok: false,
      code: 'AMBIGUOUS_PLATFORM_MAPPING',
      message: 'Electronics path must place family under "Elektronika" and its department',
    };
  }

  let brand: string | null = null;
  let model: string | null = null;

  if (
    familyId === 'electronics_smartphones' ||
    familyId === 'electronics_feature_phones' ||
    familyId === 'electronics_tablets' ||
    familyId === 'electronics_laptops' ||
    familyId === 'electronics_tv' ||
    familyId === 'electronics_audio' ||
    familyId === 'electronics_cameras' ||
    familyId === 'electronics_gaming' ||
    familyId === 'electronics_wearables' ||
    familyId === 'electronics_headphones'
  ) {
    if (segments.length < familyIdx + 3) {
      return {
        ok: false,
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Brand and model (or explicit product line) are required after the product family',
      };
    }
    brand = segments[familyIdx + 1] ?? null;
    model = segments[familyIdx + 2] ?? null;
    if (!brand || !model) {
      return { ok: false, code: 'REQUIRED_FIELD_MISSING', message: 'Brand and model segments are required' };
    }
  }

  if (familyId === 'electronics_phone_accessories') {
    if (segments.length < familyIdx + 2) {
      return {
        ok: false,
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Telefon aksesuarları listings must select an accessory type',
      };
    }
    brand = null;
    model = segments[familyIdx + 1] ?? null;
  }

  let dealKind: SalexDealKind = 'unknown';
  let listingTypeLabel: string | null = null;
  if (mainId === 'real_estate') {
    const typeSeg = segments[familyIdx + 1];
    if (!typeSeg) {
      return { ok: false, code: 'REQUIRED_FIELD_MISSING', message: 'Real estate deal type segment missing' };
    }
    dealKind = inferDealKind(typeSeg);
    listingTypeLabel = typeSeg;
    if (dealKind === 'unknown') {
      return {
        ok: false,
        code: 'AMBIGUOUS_PLATFORM_MAPPING',
        message: `Real estate deal type not recognized: "${typeSeg}"`,
      };
    }
    if (segments.length < familyIdx + 4) {
      return {
        ok: false,
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Real estate listings must complete location and core attribute steps in the category path',
      };
    }
  }

  const condition =
    mainId === 'electronics'
      ? extractConditionFromTail(segments, familyIdx + (brand && model ? 2 : 1))
      : null;

  const value: ResolvedSalexTaxonomy = {
    mainId,
    familyId,
    segments,
    familySegmentIndex: familyIdx,
    brand,
    model,
    condition,
    dealKind,
    listingTypeLabel,
  };

  return { ok: true, value };
}
