/**
 * Headless check for /dashboard?judge90=1 (production or local).
 * Usage: node scripts/judge90-live-smoke.mjs [url]
 */
import { chromium } from "playwright";

const url =
  process.argv[2] ?? "https://treasuryos-web-production.up.railway.app/dashboard?judge90=1";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  console.log("Navigating:", url);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  console.log("Waiting: judge overlay…");
  await page.getByRole("status").filter({ hasText: /Judge demo|Running full 90s sequence/i }).waitFor({
    state: "visible",
    timeout: 25000,
  });
  console.log("OK: overlay visible");

  console.log("Waiting: demo completes (overlay dismissed)…");
  await page.getByRole("status").filter({ hasText: /Judge demo|Running full 90s sequence/i }).waitFor({
    state: "hidden",
    timeout: 120000,
  });
  console.log("OK: overlay dismissed");

  await page.getByText("Constitution: ARMED").waitFor({ state: "visible", timeout: 10000 });
  console.log("OK: constitution ARMED");

  const body = await page.locator("body").innerText();

  if (!/\bREJECT\b/i.test(body)) {
    throw new Error("Expected REJECT in page text after demo");
  }
  console.log("OK: REJECT visible");

  if (!/\bALLOW\b/i.test(body)) {
    throw new Error("Expected ALLOW in page text after demo");
  }
  console.log("OK: ALLOW visible");

  if (!/EXECUTED|Recent determinations|ledger|ONCHAIN/i.test(body)) {
    throw new Error("Expected execution / ledger signal after demo");
  }
  console.log("OK: execution / ledger signal");

  console.log("\nPASS — judge90 sequence completed.");
} catch (e) {
  console.error("\nFAIL:", e.message ?? e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
