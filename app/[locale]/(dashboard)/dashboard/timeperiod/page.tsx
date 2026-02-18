import { Button } from "@/components/ui/button";


export default function Home() {

    return (
        <>
            <div className="min-h-[calc(100vh-1rem)] flex flex-col items-center justify-center gap-4">
                <Button className="w-50">Calculate New Time Period</Button>
                <Button className="w-50">View Saved Time Period</Button>
            </div>
        </>
    )
}