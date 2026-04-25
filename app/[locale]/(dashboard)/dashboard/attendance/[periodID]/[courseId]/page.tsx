type PageProps = {
    params: Promise<{ periodId: string; courseId: string }>;
};

export default async function Page({ params }: PageProps) {
    const { periodId, courseId } = await params;

    return <h1 className="text-2xl font-semibold">Attendance for class {courseId}</h1>;
}