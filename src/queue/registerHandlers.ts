import type { PgBoss } from 'pg-boss';
import { log } from '../utils/logger';
import { QUEUE_PUBLISH_PLATFORM, QUEUE_RECOVER_PENDING_LINKS } from './queues';
import { handlePublishPlatform } from './handlers/publishPlatform';
import { handleRecoverPendingLinks } from './handlers/recoverPendingLinks';

const DEFAULT_RECOVERY_CRON = '*/10 * * * *';

export async function registerHandlers(boss: PgBoss): Promise<void> {
  await boss.work(
    QUEUE_PUBLISH_PLATFORM,
    { batchSize: 1, localConcurrency: 2 },
    handlePublishPlatform,
  );

  await boss.work(
    QUEUE_RECOVER_PENDING_LINKS,
    { batchSize: 1, localConcurrency: 1 },
    handleRecoverPendingLinks,
  );

  const cron = process.env.RECOVERY_SCHEDULE_CRON ?? DEFAULT_RECOVERY_CRON;
  await boss.schedule(
    QUEUE_RECOVER_PENDING_LINKS,
    cron,
    { triggeredBy: 'schedule' } as Record<string, unknown>,
  );

  log.info('pgboss.handlers.registered', {
    queues: [QUEUE_PUBLISH_PLATFORM, QUEUE_RECOVER_PENDING_LINKS],
    recoveryCron: cron,
  });
}
