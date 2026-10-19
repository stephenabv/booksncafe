import { spawnSync } from "node:child_process";

/**
 * Build entry point used by Vercel (it runs the `vercel-build` script when one
 * exists). Migrations only run when RUN_MIGRATIONS_ON_BUILD=1 is set for that
 * environment, which is intended for Preview deployments whose Neon branch is
 * disposable. Production migrations are applied deliberately beforehand; see
 * docs/DEPLOYMENT.md.
 */
function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.RUN_MIGRATIONS_ON_BUILD === "1") {
  if (process.env.VERCEL_ENV === "production") {
    console.error("RUN_MIGRATIONS_ON_BUILD is not allowed for production builds. Run `npm run db:migrate` manually.");
    process.exit(1);
  }
  run("npm", ["run", "db:migrate"]);
  run("npm", ["run", "db:seed"]);
}

run("npx", ["next", "build"]);
