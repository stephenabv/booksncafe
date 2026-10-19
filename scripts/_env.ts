import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

/** Loads .env.local / .env for CLI scripts without adding a dotenv dependency. */
export function loadLocalEnv(): void {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) loadEnvFile(file);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable ${name}.`);
    process.exit(1);
  }
  return value;
}

/** Migrations and bulk operations should bypass the PgBouncer pooler when possible. */
export function directDatabaseUrl(): string {
  return process.env.DATABASE_URL_UNPOOLED ?? requireEnv("DATABASE_URL");
}
