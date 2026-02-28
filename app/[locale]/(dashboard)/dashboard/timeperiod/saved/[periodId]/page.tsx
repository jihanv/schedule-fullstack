// app/dashboard/timeperiod/saved/[periodId]/page.tsx
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
  const id = await params;
  const res = await getCoursesAndLessonsForPeriod({ periodId: id.periodId });
  if (!res.ok) {
    if (res.error === "Unauthorized") redirect("/sign-in");
    return <div>Error: {res.error}</div>;
  }
  // Client component handles Prev/Next instantly (no DB fetch)
  return (
    <>
      <H1>Period</H1>
      <div>{id.periodId}</div>
      <MeetingListFromDb courses={res.courses} />
      <Link href={`/dashboard/timeperiod/saved/${res.periodId}/schedule`}><Button>Link</Button></Link>
    </>
  );
}