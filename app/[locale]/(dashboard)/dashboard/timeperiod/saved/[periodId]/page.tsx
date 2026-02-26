// app/dashboard/timeperiod/saved/[periodId]/page.tsx
import { redirect } from "next/navigation";
import { getSavedPeriodData } from "@/app/actions/weekly-table"; // adjust path
import SavedWeekPager from "./saved-week-pager";

export default async function Page({
  params,
}: {
  params: { periodId: string } | Promise<{ periodId: string }>;
}) {
  const { periodId } = await Promise.resolve(params);

  // Fetch *all* saved data once on initial load
  const res = await getSavedPeriodData({ periodId });

  if (!res.ok) {
    if (res.error === "Unauthorized") redirect("/sign-in");

    return (
      <main className="p-6">
        <h1 className="text-lg font-semibold">Error</h1>
        <pre className="mt-3 rounded-lg border p-3 text-sm overflow-auto">
          {JSON.stringify(res, null, 2)}
        </pre>
      </main>
    );
  }

  // Client component handles Prev/Next instantly (no DB fetch)
  return <SavedWeekPager data={res} />;
}