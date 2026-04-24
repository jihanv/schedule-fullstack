type PageProps = {
    params: Promise<{ periodId: string }>;
};

export default async function Page({ params }: PageProps) {
    const { periodId } = await params;

    return <h1 className="text-2xl font-semibold">Attendance for period {periodId}</h1>;
}