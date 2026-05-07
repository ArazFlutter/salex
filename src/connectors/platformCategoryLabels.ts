/**
 * Maps internal SALex category path segments to labels Tap.az / Lalafo show
 * in their post-ad UIs. SALex strings (e.g. long department names) often do
 * not match platform copy; navigation tries aliases in order per segment.
 */

export type SegmentAliasMap = Record<string, string[]>;

/** Tap.az — electronics / smartphone branch. */
export const TAPAZ_CATEGORY_ALIASES: SegmentAliasMap = {
  Elektronika: ['Elektronika'],
  'Telefonlar və aksesuarlar': [
    'Telefonlar, smart saatlar, qulaqlıqlar',
    'Telefonlar və smart saatlar',
    'Telefonlar',
    'Mobil telefonlar',
  ],
  Smartfonlar: ['Mobil telefonlar', 'Smartfonlar', 'Smartfon'],
};

/** Lalafo — typical Az post form labels under Elektronika. */
export const LALAFO_CATEGORY_ALIASES: SegmentAliasMap = {
  Elektronika: ['Elektronika'],
  'Telefonlar və aksesuarlar': ['Telefonlar', 'Telefonlar və aksesuarlar', 'Mobil telefonlar'],
  Smartfonlar: ['Mobil telefonlar', 'Smartfonlar', 'Smartfon'],
};

function uniqueVariants(segment: string, aliases: SegmentAliasMap): string[] {
  const extra = aliases[segment] ?? [];
  return [segment, ...extra]
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

/** Per-segment label candidates (try in order until one clicks). */
export function categoryPathVariantsForTapaz(salexSegments: string[]): string[][] {
  return salexSegments.map((s) => uniqueVariants(s, TAPAZ_CATEGORY_ALIASES));
}

export function categoryPathVariantsForLalafo(salexSegments: string[]): string[][] {
  return salexSegments.map((s) => uniqueVariants(s, LALAFO_CATEGORY_ALIASES));
}
