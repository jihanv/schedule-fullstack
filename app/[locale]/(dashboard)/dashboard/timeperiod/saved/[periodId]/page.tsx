import H1 from "@/components/format/h1";

export default async function Page({
  params,
}: {
  params: { periodId: string };
}) {
  const id = await params;

  return (
    <>
      <H1>Period</H1>
      <div>{id.periodId}</div>
    </>
  );
}
