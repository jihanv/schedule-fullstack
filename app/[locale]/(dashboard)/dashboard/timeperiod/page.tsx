import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function Home() {
  return (
    <>
      <div className="min-h-[calc(100vh-1rem)] flex flex-col items-center justify-center gap-4">
        <Button className="w-50">
          <Link href="/dashboard/timeperiod/new">
            Calculate New Time Period
          </Link>
        </Button>
        <Button className="w-50">View Saved Time Period</Button>
      </div>
    </>
  );
}
