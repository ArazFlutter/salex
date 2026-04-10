import './db/env';
import { app } from './app';
import { log } from './utils/logger';
import { verifyDatabaseConnection } from './db/pool';
import { startBoss, stopBoss } from './queue/boss';
import { registerHandlers } from './queue/registerHandlers';

const port = Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    await verifyDatabaseConnection('Server startup');
    log.info('server.db.connected');

    const boss = await startBoss();
    await registerHandlers(boss);

    app.listen(port, () => {
      log.info('server.started', { port });
    });

    const shutdown = async () => {
      log.info('server.shutdown.start');
      await stopBoss();
      log.info('server.shutdown.done');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    log.error('server.startup.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  }
}

void startServer();
