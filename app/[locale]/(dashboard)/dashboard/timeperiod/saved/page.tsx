import { getTimePeriodsForCurrentUser } from "@/app/actions/view-time-periods";
import H1 from "@/components/format/h1";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const res = await getTimePeriodsForCurrentUser({ limit: 50 });
  const t = await getTranslations("TimePeriod");
  if (!res.ok) {
    // you can also render an error instead of redirecting
    if (res.error === "Unauthorized") redirect("/sign-in");
    return <div>Error: {res.error}</div>;
  }
  console.log(res.timePeriods);
  // Server Action
  return (
    <main className="flex flex-col gap-2 items-center">
      <H1>{t("title")}</H1>

      {res.timePeriods.length === 0 ? (
        <p>No time periods yet.</p>
      ) : (
        <ul>
          {res.timePeriods.map((p) => (
            <li key={p.period_id}>
              <Link href={`/dashboard/timeperiod/saved/${p.period_id}`}>
                <Button>
                  {String(p.startDate)} → {String(p.endDate)}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
