import { app } from './app.js';
import { env } from './config/env.js';

const port = env.PORT;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`GymBros API running on http://localhost:${port}`);
});
