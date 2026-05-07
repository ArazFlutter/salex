import { PgBoss } from 'pg-boss';
import { DATABASE_URL } from '../db/env';
import { log } from '../utils/logger';
import { QUEUE_PUBLISH_PLATFORM, QUEUE_RECOVER_PENDING_LINKS } from './queues';

let instance: PgBoss | null = null;

export function createBoss(): PgBoss {
  if (instance) return instance;

  instance = new PgBoss({
    connectionString: DATABASE_URL,
    schema: 'pgboss',
    schedule: true,
  });

  instance.on('error', (error: Error) => {
    log.error('pgboss.error', { error: error.message });
  });

  return instance;
}

export async function startBoss(): Promise<PgBoss> {
  const boss = createBoss();
  await boss.start();
  await boss.createQueue(QUEUE_PUBLISH_PLATFORM);
  await boss.createQueue(QUEUE_RECOVER_PENDING_LINKS);
  log.info('pgboss.started');
  return boss;
}

export async function stopBoss(): Promise<void> {
  if (instance) {
    await instance.stop({ graceful: true, timeout: 10_000 });
    instance = null;
    log.info('pgboss.stopped');
  }
}

export function getBoss(): PgBoss {
  if (!instance) {
    throw new Error('pg-boss has not been started. Call startBoss() first.');
  }
  return instance;
}
