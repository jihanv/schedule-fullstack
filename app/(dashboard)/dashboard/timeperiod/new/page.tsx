"use client"
import PeriodStepNav from "@/components/navigation/period-steps";
import DateSelector from "@/components/time-period/date-selector";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/stores/languageStore";
import { Steps, useNavigationStore } from "@/stores/navigationStore";
import { useTimePeriodStore } from "@/stores/timePeriodStore";


export default function Home() {
    const { uiLanguage } = useLanguage();
    const { step, setSteps, } = useNavigationStore();

    const { setActivateNext, activateNext } = useTimePeriodStore();
    return (
        <>
            <div className="flex flex-row gap-2 justify-center mt-10">
                <Button
                    className="w-24"
                    disabled={step === 1}
                    onClick={() => {
                        setSteps(Number(step - 1) as Steps)
                        setActivateNext(true)
                    }}
                >
                    {uiLanguage === "japanese" ? "戻る" : "Previous"}
                </Button>
                <Button
                    className="w-24"
                    onClick={() => {
                        setSteps(Number(step + 1) as Steps)
                        setActivateNext(false)
                    }}
                    disabled={step >= 5 || !activateNext}
                >
                    {uiLanguage === "japanese" ? "次へ" : "Next"}
                </Button>
            </div>
            <div className="flex flex-row">
                <PeriodStepNav />
                <div className="bg-blue-50 ml-45 w-full">
                    {step === 1 && <DateSelector />}
                </div>
            </div>

        </>
    );
}
