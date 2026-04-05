import { redirect } from "next/navigation";
import MeetingListFromDb from "@/components/time-period/db-meeting-list";
import { getCoursesAndLessonsForPeriod } from "@/app/actions/timeperiod";
import H1 from "@/components/format/h1";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function Page({
  params,
}: {
  params: { periodId: string } | Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const res = await getCoursesAndLessonsForPeriod({ periodId });

  if (!res.ok) {
    if (res.error === "Unauthorized") redirect("/sign-in");
    return <div>Error: {res.error}</div>;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <H1>Saved schedule</H1>

        <p className="text-sm text-muted-foreground break-all">
          Period ID: {periodId}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/dashboard/timeperiod/saved/${periodId}/schedule`}>
              Open weekly schedule
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/dashboard/timeperiod/saved">
              Back to saved schedules
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="mb-4 text-lg font-semibold">Lessons</h2>
        <MeetingListFromDb courses={res.courses} />
      </div>
    </main>
  );
}