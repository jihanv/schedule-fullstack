import { getCoursesAndLessonsForPeriod } from "@/app/actions/timeperiod";
import H1 from "@/components/format/h1";
import MeetingListFromDb from "@/components/time-period/db-meeting-list";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { periodId: string };
}) {
  const id = await params;
  const res = await getCoursesAndLessonsForPeriod({ periodId: id.periodId });

  if (!res.ok) {
    if (res.error === "Unauthorized") redirect("/sign-in");
    return <div>Error: {res.error}</div>;
  }
  return (
    <>
      <H1>Period</H1>
      <div>{id.periodId}</div>
      <MeetingListFromDb courses={res.courses} />
    </>
  );
}
