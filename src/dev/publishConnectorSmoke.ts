/**
 * Authenticated real Selenium publish smoke for Tap.az and Lalafo.
 *
 * Uses the same mapper + connector stack as production (normalizeListing → map*Payload → publishListing).
 *
 * Required:
 *   SMOKE_PUBLISH_USER_ID — user id for session cookie injection (same as API user)
 *
 * Tap.az (first-time / expired session):
 *   TAPAZ_LOGIN_PHONE, TAPAZ_OTP_CODE or TAPAZ_OTP_FILE
 *
 * Lalafo:
 *   LALAFO_LOGIN_PHONE, LALAFO_OTP_CODE or LALAFO_OTP_FILE
 *
 * Optional:
 *   PUBLISH_SMOKE_PLATFORMS=tapaz,lalafo  (default: both)
 *   PUBLISH_SMOKE_REQUIRE_LOGIN_ENV=1 — exit before Selenium if TAPAZ_/LALAFO_LOGIN_PHONE missing for selected platforms
 *   TAPAZ_SELENIUM_HEADLESS=false | LALAFO_SELENIUM_HEADLESS=false  (watch browser)
 *   TAPAZ_SELENIUM_TIMEOUT_MS / LALAFO_SELENIUM_TIMEOUT_MS  (this script defaults both to 120000 if unset)
 *   CHROME_BIN — custom Chrome path
 *
 * Exit codes: 0 all selected platforms succeeded, 1 failure or misconfiguration
 */
import '../db/env';

import { randomUUID } from 'node:crypto';
import { normalizeListing } from '../mappers/normalizeListing';
import { mapNormalizedListingToTapaz } from '../mappers/platforms/tapazMapper';
import { mapNormalizedListingToLalafo } from '../mappers/platforms/lalafoMapper';
import { TapazConnector } from '../connectors/tapazConnector';
import { LalafoConnector } from '../connectors/lalafoConnector';
import type { ConnectorPublishResult } from '../connectors/baseConnector';

const SMARTPHONE_CATEGORY =
  'Elektronika → Telefonlar və aksesuarlar → Smartfonlar → Apple → iPhone 15 → Yeni';

function parsePlatforms(): Set<'tapaz' | 'lalafo'> {
  const raw = process.env.PUBLISH_SMOKE_PLATFORMS?.trim().toLowerCase() || 'tapaz,lalafo';
  const set = new Set<'tapaz' | 'lalafo'>();
  for (const p of raw.split(',')) {
    const s = p.trim();
    if (s === 'tapaz' || s === 'lalafo') set.add(s);
  }
  if (set.size === 0) {
    set.add('tapaz');
    set.add('lalafo');
  }
  return set;
}

function buildSmokeListing(userId: string) {
  const now = Date.now();
  return {
    id: `smoke-${randomUUID()}`,
    userId,
    title: `SALex smoke smartphone ${now}`,
    category: SMARTPHONE_CATEGORY,
    price: 299,
    city: 'Baku',
    description:
      'Automated SALex connector smoke listing. Safe to delete. ' +
      'Tests Tap.az/Lalafo smartphone category path and form fill.',
    images: [] as string[],
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };
}

function printResult(platform: string, result: ConnectorPublishResult) {
  const tap = new TapazConnector();
  const lf = new LalafoConnector();
  const connector = platform === 'tapaz' ? tap : lf;
  const url = connector.getListingUrl(result);
  console.log(
    JSON.stringify(
      {
        platform,
        externalListingId: result.externalListingId ?? null,
        externalUrl: result.externalUrl ?? null,
        resolvedListingUrl: url,
        publishMetadata: result.publishMetadata ?? null,
      },
      null,
      2,
    ),
  );
}

async function runTapaz(userId: string): Promise<void> {
  const raw = buildSmokeListing(userId);
  const normalized = normalizeListing(raw);
  if (!normalized.salexTaxonomy) {
    throw new Error(
      `Tap.az smoke: taxonomy resolve failed: ${normalized.taxonomyResolveError?.message ?? 'unknown'}`,
    );
  }
  const payload = mapNormalizedListingToTapaz(normalized);
  const connector = new TapazConnector();
  const result = await connector.publishListing(payload as unknown as Record<string, unknown>, {
    userId,
  });
  printResult('tapaz', result);
  const conf = result.publishMetadata?.confidence ?? 'unknown';
  if (!result.externalListingId && conf !== 'confirmed' && conf !== 'likely') {
    throw new Error(
      `Tap.az smoke: unexpected outcome (confidence=${conf}). Inspect publishMetadata and DOM.`,
    );
  }
  if (!result.externalListingId) {
    console.warn(
      '[smoke] Tap.az: no listing id in result — verify listing manually (connector may have returned likely/uncertain).',
    );
  }
}

async function runLalafo(userId: string): Promise<void> {
  const raw = buildSmokeListing(userId);
  const normalized = normalizeListing(raw);
  if (!normalized.salexTaxonomy) {
    throw new Error(
      `Lalafo smoke: taxonomy resolve failed: ${normalized.taxonomyResolveError?.message ?? 'unknown'}`,
    );
  }
  const payload = mapNormalizedListingToLalafo(normalized);
  const connector = new LalafoConnector();
  const result = await connector.publishListing(payload as unknown as Record<string, unknown>, {
    userId,
  });
  printResult('lalafo', result);
  const conf = result.publishMetadata?.confidence ?? 'unknown';
  if (!result.externalListingId && conf !== 'confirmed' && conf !== 'likely') {
    throw new Error(
      `Lalafo smoke: unexpected outcome (confidence=${conf}). Inspect publishMetadata and DOM.`,
    );
  }
  if (!result.externalListingId) {
    console.warn(
      '[smoke] Lalafo: no listing id in result — verify listing manually (connector may have returned likely/uncertain).',
    );
  }
}

async function main() {
  const userId = process.env.SMOKE_PUBLISH_USER_ID?.trim();
  if (!userId) {
    console.error(
      'publishConnectorSmoke: set SMOKE_PUBLISH_USER_ID to your API user id (for platform session cookies).',
    );
    process.exitCode = 1;
    return;
  }

  const platforms = parsePlatforms();

  /** Real marketplaces are slow; 15s default in connectors is often too tight for login + category + submit. */
  if (!process.env.TAPAZ_SELENIUM_TIMEOUT_MS?.trim()) {
    process.env.TAPAZ_SELENIUM_TIMEOUT_MS = '120000';
  }
  if (!process.env.LALAFO_SELENIUM_TIMEOUT_MS?.trim()) {
    process.env.LALAFO_SELENIUM_TIMEOUT_MS = '120000';
  }

  const strictCreds = process.env.PUBLISH_SMOKE_REQUIRE_LOGIN_ENV === '1';
  if (strictCreds) {
    if (platforms.has('tapaz') && !process.env.TAPAZ_LOGIN_PHONE?.trim()) {
      console.error(
        'publishConnectorSmoke: PUBLISH_SMOKE_REQUIRE_LOGIN_ENV=1 but TAPAZ_LOGIN_PHONE is not set.',
      );
      process.exitCode = 1;
      return;
    }
    if (platforms.has('lalafo') && !process.env.LALAFO_LOGIN_PHONE?.trim()) {
      console.error(
        'publishConnectorSmoke: PUBLISH_SMOKE_REQUIRE_LOGIN_ENV=1 but LALAFO_LOGIN_PHONE is not set.',
      );
      process.exitCode = 1;
      return;
    }
  } else {
    if (platforms.has('tapaz') && !process.env.TAPAZ_LOGIN_PHONE?.trim()) {
      console.warn(
        '[warn] Tap.az: TAPAZ_LOGIN_PHONE not set — need stored cookies for this user or set phone + OTP env vars.',
      );
    }
    if (platforms.has('lalafo') && !process.env.LALAFO_LOGIN_PHONE?.trim()) {
      console.warn(
        '[warn] Lalafo: LALAFO_LOGIN_PHONE not set — need stored cookies for this user or set phone + OTP env vars.',
      );
    }
  }

  if (platforms.has('tapaz')) {
    console.log('[smoke] Tap.az publish starting…');
    await runTapaz(userId);
    console.log('[smoke] Tap.az publish finished OK');
  }

  if (platforms.has('lalafo')) {
    console.log('[smoke] Lalafo publish starting…');
    await runLalafo(userId);
    console.log('[smoke] Lalafo publish finished OK');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
