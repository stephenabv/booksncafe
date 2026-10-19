import { spawnSync } from "node:child_process";

/**
 * Build entry point used by Vercel (`vercel.json` points the build command
 * here). When RUN_MIGRATIONS_ON_BUILD=1 is set for an environment, the build
 * prepares that environment's database before compiling:
 *
 *   1. apply pending migrations (journaled, so already-applied ones are skipped)
 *   2. seed tables that are still empty (never overwrites edited content)
 *   3. create the first administrator from ADMIN_BOOTSTRAP_* if none exists
 *   4. verify the data, failing the build (and so the deployment) on any problem
 *
 * Because the deployment only goes live after a successful build, migrations
 * must stay backward-compatible with the deployment that is still serving
 * traffic; see docs/DEPLOYMENT.md.
 */
function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.RUN_MIGRATIONS_ON_BUILD === "1") {
  run("npm", ["run", "db:migrate"]);
  run("npm", ["run", "db:seed"]);
  run("npm", ["run", "admin:bootstrap"]);
  run("npm", ["run", "db:verify"]);
}

run("npx", ["next", "build"]);
