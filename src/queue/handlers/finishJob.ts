import { withTransaction } from '../../db/pool';
import { log } from '../../utils/logger';

export async function maybeFinishJob(publishJobId: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      'SELECT id FROM publish_jobs WHERE id = $1 FOR UPDATE',
      [publishJobId],
    );

    const stillPending = await client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM publish_job_platforms
       WHERE publish_job_id = $1
         AND status IN ('waiting', 'processing', 'published_pending_link')`,
      [publishJobId],
    );

    if (stillPending.rows[0].count > 0) return;

    const platforms = await client.query<{ status: string }>(
      'SELECT status FROM publish_job_platforms WHERE publish_job_id = $1',
      [publishJobId],
    );

    if (platforms.rows.length === 0) return;

    const statusCounts: Record<string, number> = {};
    for (const row of platforms.rows) {
      statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
    }

    const allFailed = platforms.rows.every((row) => row.status === 'failed');
    const allPublishedPendingLink = platforms.rows.every(
      (row) => row.status === 'published_pending_link',
    );

    if (allPublishedPendingLink) return;

    const finalStatus = allFailed ? 'failed' : 'success';

    await client.query(
      `UPDATE publish_jobs
       SET status = $2, updated_at = NOW()
       WHERE id = $1`,
      [publishJobId, finalStatus],
    );

    log.info('publish.job.finished', {
      jobId: publishJobId,
      status: finalStatus,
      platformStatuses: statusCounts,
      totalPlatforms: platforms.rows.length,
    });
  });
}
