import "server-only";
import { serverEnv } from "@/server/env";
import { createDatabase, type Database, type DatabaseHandle } from "./connection";

export type { Database };

declare global {
  // Reuse the pool across hot reloads in development and warm serverless invocations.
  var __bncDb: DatabaseHandle | undefined;
}

export function getDb(): Database {
  if (!globalThis.__bncDb) {
    globalThis.__bncDb = createDatabase(serverEnv().DATABASE_URL);
  }
  return globalThis.__bncDb.db;
}
