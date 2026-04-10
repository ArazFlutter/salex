export type PlatformId = 'tapaz' | 'lalafo' | 'alanaz' | 'laylo' | 'birjacom';

type PlatformDefinition = {
  id: PlatformId;
  name: string;
  aliases: string[];
};

const PLATFORM_DEFINITIONS: PlatformDefinition[] = [
  { id: 'tapaz', name: 'Tap.az', aliases: ['tapaz', 'tap.az'] },
  { id: 'lalafo', name: 'Lalafo', aliases: ['lalafo'] },
  { id: 'alanaz', name: 'Alan.az', aliases: ['alanaz', 'alan.az'] },
  { id: 'laylo', name: 'Laylo.az', aliases: ['laylo', 'laylo.az'] },
  { id: 'birjacom', name: 'Birja.com', aliases: ['birjacom', 'birja.com'] },
];

export function getSupportedPlatforms(): PlatformDefinition[] {
  return PLATFORM_DEFINITIONS;
}

export function getPlatformDisplayName(platformId: PlatformId): string {
  return PLATFORM_DEFINITIONS.find((platform) => platform.id === platformId)?.name ?? platformId;
}

export function normalizePlatformId(value: string): PlatformId | null {
  const normalizedValue = value.trim().toLowerCase();
  const platform = PLATFORM_DEFINITIONS.find((entry) =>
    entry.aliases.includes(normalizedValue) || entry.name.toLowerCase() === normalizedValue,
  );

  return platform?.id ?? null;
}
