import type { Job } from 'pg-boss';
import { log } from '../../utils/logger';
import { recoverPendingLinks } from '../../services/recoverPendingLinks';
import type { RecoverPendingLinksPayload } from '../queues';

export async function handleRecoverPendingLinks(
  jobs: Job<RecoverPendingLinksPayload>[],
): Promise<void> {
  for (const job of jobs) {
    const { triggeredBy } = job.data;

    log.info('recovery.job.start', { triggeredBy });

    const results = await recoverPendingLinks();

    const resolved = results.filter((r) => r.status === 'success').length;
    const pending = results.filter((r) => r.status === 'published_pending_link').length;
    const exhausted = results.filter(
      (r) => r.publishMetadata?.recoveryState === 'exhausted',
    ).length;

    log.info('recovery.job.done', {
      triggeredBy,
      total: results.length,
      resolved,
      pending,
      exhausted,
    });
  }
}
