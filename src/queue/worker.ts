import '../db/env';

import { startBoss, stopBoss } from './boss';
import { registerHandlers } from './registerHandlers';

async function main() {
  const boss = await startBoss();
  await registerHandlers(boss);
  console.log('[worker] running — waiting for jobs');

  const shutdown = async () => {
    console.log('[worker] shutting down…');
    await stopBoss();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('[worker] fatal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
