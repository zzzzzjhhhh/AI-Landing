import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

type Database = NodePgDatabase<typeof schema>;

declare global {
  var __oceanveoPool: Pool | undefined;
  var __oceanveoDb: Database | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  return databaseUrl;
}

export function getPool() {
  if (globalThis.__oceanveoPool) {
    return globalThis.__oceanveoPool;
  }

  globalThis.__oceanveoPool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  return globalThis.__oceanveoPool;
}

export function getDb() {
  if (globalThis.__oceanveoDb) {
    return globalThis.__oceanveoDb;
  }

  globalThis.__oceanveoDb = drizzle(getPool(), { schema });
  return globalThis.__oceanveoDb;
}
