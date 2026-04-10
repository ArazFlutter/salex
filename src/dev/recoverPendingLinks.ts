import '../db/env';

import { db } from '../db/pool';
import { recoverPendingLinks } from '../services/recoverPendingLinks';

async function main() {
  const results = await recoverPendingLinks();
  console.log(JSON.stringify({ recovered: results.length, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
