import './env';

import { db, verifyDatabaseConnection, withTransaction } from './pool';

const seedUser = {
  id: 'dev-user-9945550101',
  fullName: 'Dev Test User',
  phone: '+994555010101',
  accountType: 'individual',
  activePlan: 'premium' as const,
};

const seedPlatform = {
  platformId: 'tapaz',
};

const seedListing = {
  id: 'dev-listing-salex-demo',
  title: 'iPhone 13 128GB',
  category: 'Elektronika → Telefonlar və aksesuarlar → Smartfonlar → Apple → iPhone 13 → Yeni',
  price: 1450,
  city: 'Baku',
  description: 'Local development seed listing for PostgreSQL smoke testing.',
  images: ['https://example.com/dev-listing.jpg'],
  status: 'active' as const,
};

async function seedDatabase() {
  await verifyDatabaseConnection('Development seed');

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO users (id, full_name, phone, account_type, active_plan)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           phone = EXCLUDED.phone,
           account_type = EXCLUDED.account_type,
           active_plan = EXCLUDED.active_plan,
           updated_at = NOW()`,
      [seedUser.id, seedUser.fullName, seedUser.phone, seedUser.accountType, seedUser.activePlan],
    );

    await client.query(
      `DELETE FROM otp_sessions
       WHERE phone = $1`,
      [seedUser.phone],
    );

    await client.query(
      `INSERT INTO otp_sessions (user_id, phone, code, expires_at, attempts, verified_at, is_current)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 day', 0, NOW(), TRUE)`,
      [seedUser.id, seedUser.phone, '123456'],
    );

    await client.query(
      `INSERT INTO platform_connections (user_id, platform_id, connected)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (user_id, platform_id) DO UPDATE
       SET connected = TRUE,
           connected_at = NOW()`,
      [seedUser.id, seedPlatform.platformId],
    );

    await client.query(
      `INSERT INTO listings (id, user_id, title, category, price, city, description, images, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, NOW())
       ON CONFLICT (id) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           city = EXCLUDED.city,
           description = EXCLUDED.description,
           images = EXCLUDED.images,
           status = EXCLUDED.status`,
      [
        seedListing.id,
        seedUser.id,
        seedListing.title,
        seedListing.category,
        seedListing.price,
        seedListing.city,
        seedListing.description,
        JSON.stringify(seedListing.images),
        seedListing.status,
      ],
    );
  });

  console.log('PostgreSQL connection verified');
  console.log('Development seed completed successfully');
  console.log(`Seed user: ${seedUser.phone}`);
  console.log(`Seed package: ${seedUser.activePlan}`);
  console.log(`Seed platform: ${seedPlatform.platformId}`);
  console.log(`Seed listing: ${seedListing.id}`);
}

seedDatabase()
  .catch((error) => {
    console.error('Failed to seed development data');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
