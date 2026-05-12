import { DashboardClient } from "./dashboard-client";

/** Avoid edge/CDN serving a stale marketing shell after README-aligned copy changes. */
export const dynamic = "force-dynamic";

function judgeFlag(v: string | string[] | undefined): boolean {
  if (v === "1") return true;
  return Array.isArray(v) && v.includes("1");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ judge90?: string | string[] }>;
}) {
  const sp = await searchParams;
  return <DashboardClient autoJudge={judgeFlag(sp.judge90)} />;
}
