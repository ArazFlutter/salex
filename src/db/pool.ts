import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { DATABASE_URL, projectRootEnvPath } from './env';

const globalForDb = globalThis as typeof globalThis & {
  __salexPgPool?: Pool;
};

function getDatabaseTargetLabel(): string {
  try {
    const parsedUrl = new URL(DATABASE_URL);
    const databaseName = parsedUrl.pathname.replace(/^\//, '') || '(default)';
    const port = parsedUrl.port || '5432';

    return `${parsedUrl.hostname}:${port}/${databaseName}`;
  } catch {
    return 'the configured DATABASE_URL target';
  }
}

function getErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;

    if (typeof code === 'string' && code.trim()) {
      return code;
    }
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  const errorCode = getErrorCode(error);

  if (errorCode === 'ECONNREFUSED') {
    return 'connection refused';
  }

  if (errorCode) {
    return `PostgreSQL connection error (${errorCode})`;
  }

  return 'Unknown PostgreSQL connection error';
}

function formatConnectionFailure(context: string, error: unknown): Error {
  const originalMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  const errorCodeSuffix = errorCode ? ` PostgreSQL error code: ${errorCode}.` : '';

  return new Error(
    `${context} failed: could not connect to PostgreSQL at ${getDatabaseTargetLabel()}. ` +
      `Make sure PostgreSQL is running and DATABASE_URL in ${projectRootEnvPath} is correct. ` +
      `Original error: ${originalMessage}.${errorCodeSuffix}`,
  );
}

export const db = globalForDb.__salexPgPool ?? new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

if (!globalForDb.__salexPgPool) {
  globalForDb.__salexPgPool = db;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  return db.query<T>(text, params);
}

export async function verifyDatabaseConnection(context: string): Promise<void> {
  const client = await db.connect().catch((error: unknown) => {
    throw formatConnectionFailure(context, error);
  });

  try {
    await client.query('SELECT 1');
  } catch (error) {
    throw formatConnectionFailure(context, error);
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
