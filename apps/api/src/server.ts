import { app } from './app.js';
import { env } from './config/env.js';
import { ensureSeedData } from './lib/bootstrap.js';

const port = env.PORT;

async function start() {
  await ensureSeedData();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`GymBros API running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', error);
  process.exit(1);
});
