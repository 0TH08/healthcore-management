import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Zod schema validates required env vars at startup with fallback defaults for dev.
// The safeParse approach is used (not parse) so we can show a friendly error
// and exit cleanly rather than throwing an unhandled exception.
//
// Design decisions:
// - JWT_SECRET defaults to 'secret' for dev convenience. In production, a real
//   secret must be set via environment variables.
// - DATABASE_URL defaults to empty string because for SQLite the actual URL
//   is hardcoded in prisma.ts's adapter. For future PostgreSQL migration,
//   the DATABASE_URL env var would be used instead.
// - PORT is coerced from string (env vars are always strings) to number.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default(''),
  JWT_SECRET: z.string().default('secret'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
