#!/usr/bin/env node
/**
 * Fail before `next build` if Tailwind v4 / LightningCSS toolchain is present.
 * If this script is missing on Railway but you still see lightningcss errors, the
 * service is not deploying the current GitHub tree (wrong branch, cache, or Nixpacks).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const nm = join(cwd, "node_modules");
const pkgPath = join(cwd, "package.json");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const tw = pkg.devDependencies?.tailwindcss ?? "";
if (!String(tw).includes("3.")) {
  console.error("[verify-deploy-stack] package.json devDependencies.tailwindcss must be 3.x, got:", tw);
  process.exit(1);
}

if (existsSync(join(nm, "@tailwindcss"))) {
  console.error(
    "[verify-deploy-stack] FORBIDDEN: node_modules/@tailwindcss exists (Tailwind v4). Use apps/web from main with Tailwind v3 only."
  );
  process.exit(1);
}

if (existsSync(join(nm, "lightningcss", "package.json"))) {
  console.error(
    "[verify-deploy-stack] FORBIDDEN: lightningcss package installed. Expected Tailwind v3 PostCSS stack only."
  );
  process.exit(1);
}

console.log("[verify-deploy-stack] OK — Tailwind v3, no @tailwindcss/, no lightningcss");
