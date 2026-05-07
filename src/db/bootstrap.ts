import './env';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db, verifyDatabaseConnection, withTransaction } from './pool';

async function bootstrapDatabase() {
  await verifyDatabaseConnection('Database bootstrap');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = await readFile(schemaPath, 'utf8').catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read database schema from ${schemaPath}: ${message}`);
  });

  await withTransaction(async (client) => {
    await client.query(schemaSql);
  });

  console.log('PostgreSQL connection verified');
  console.log('Database schema bootstrapped successfully');
}

bootstrapDatabase()
  .catch((error) => {
    console.error('Failed to bootstrap database schema');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
