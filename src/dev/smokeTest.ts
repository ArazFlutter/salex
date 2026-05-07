import '../db/env';

import { Client } from 'pg';

type JsonRecord = Record<string, unknown>;

const baseUrl = process.env.SMOKE_BASE_URL?.trim() || 'http://127.0.0.1:4000';
const phone = '+994555010101';

async function readLatestOtpCode(targetPhone: string): Promise<string> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    const result = await client.query<{ code: string }>(
      `SELECT code
       FROM otp_sessions
       WHERE phone = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [targetPhone],
    );

    const code = result.rows[0]?.code;

    if (!code) {
      throw new Error(`No OTP code found for ${targetPhone}`);
    }

    return code;
  } finally {
    await client.end();
  }
}

const API_PREFIX = '/api';

async function requestJson(path: string, init?: RequestInit): Promise<JsonRecord> {
  const response = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json()) as JsonRecord;

  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeTest() {
  const sendOtp = await requestJson('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

  const otpCode = await readLatestOtpCode(phone);

  const verifyOtp = await requestJson('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code: otpCode }),
  });

  const me = await requestJson('/me');
  const currentPackage = await requestJson('/packages/current');

  const createListing = await requestJson('/listings', {
    method: 'POST',
    body: JSON.stringify({
      title: `Smoke Test Listing ${Date.now()}`,
      category:
        'Elektronika → Telefonlar və aksesuarlar → Smartfonlar → Apple → iPhone 15 → Yeni',
      price: 199.99,
      city: 'Baku',
      description: 'Created by the local PostgreSQL smoke test.',
      images: ['https://example.com/smoke-test-listing.jpg'],
      status: 'active',
    }),
  });

  const listing = createListing.listing as JsonRecord | undefined;
  const listingId = typeof listing?.id === 'string' ? listing.id : '';
  assertCondition(listingId, 'POST /listings did not return a listing id');

  const listings = await requestJson('/listings');
  const listingById = await requestJson(`/listings/${listingId}`);
  const platforms = await requestJson('/platforms');

  const connectPlatform = await requestJson('/platforms/connect', {
    method: 'POST',
    body: JSON.stringify({ platform: 'lalafo' }),
  });

  const publish = await requestJson(`/publish/${listingId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const job = publish.job as JsonRecord | undefined;
  const publishJobId = typeof job?.id === 'string' ? job.id : '';
  assertCondition(publishJobId, 'POST /publish/:listingId did not return a publish job id');

  const publishStatus = await requestJson(`/publish/${publishJobId}/status`);

  assertCondition(sendOtp.success === true, 'POST /auth/send-otp did not return success');
  assertCondition(verifyOtp.success === true, 'POST /auth/verify-otp did not return success');
  assertCondition(me.success === true, 'GET /me did not return success');
  assertCondition(currentPackage.success === true, 'GET /packages/current did not return success');
  assertCondition(createListing.success === true, 'POST /listings did not return success');
  assertCondition(listings.success === true, 'GET /listings did not return success');
  assertCondition(listingById.success === true, 'GET /listings/:id did not return success');
  assertCondition(platforms.success === true, 'GET /platforms did not return success');
  assertCondition(connectPlatform.success === true, 'POST /platforms/connect did not return success');
  assertCondition(publish.success === true, 'POST /publish/:listingId did not return success');
  assertCondition(publishStatus.success === true, 'GET /publish/:id/status did not return success');

  console.log(
    JSON.stringify(
      {
        success: true,
        baseUrl,
        verifiedPhone: phone,
        otpCode,
        listingId,
        publishJobId,
        sendOtp,
        verifyOtp,
        me,
        currentPackage,
        createListing,
        listings,
        listingById,
        platforms,
        connectPlatform,
        publish,
        publishStatus,
      },
      null,
      2,
    ),
  );
}

runSmokeTest().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
