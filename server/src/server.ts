import app from './app';
import { env } from './config/env';

// Entry point. Starts the Express server on the configured port (default 3000).
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
