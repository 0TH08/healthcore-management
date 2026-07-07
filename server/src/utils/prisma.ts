import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Prisma v7 requires the explicit SQLite adapter for better-sqlite3.
// The adapter URL must match the DATABASE_URL in .env.
//
// The adapter URL here is hardcoded to 'file:./dev.db', which is relative to
// the prisma/ directory where the schema is. This must stay in sync with
// the DATABASE_URL in .env. Both point to the same SQLite database file
// so that migrations and runtime use the same database.
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });

// Singleton pattern: the module system caches this export, so every file that
// imports { prisma } gets the same PrismaClient instance. No need to manage
// a manual singleton.
export const prisma = new PrismaClient({ adapter });
