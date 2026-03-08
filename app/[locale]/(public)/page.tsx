"use client";
import PeriodStepNav from "@/components/navigation/period-steps";
import DateSelector from "@/components/time-period/date-selector";
import HolidaySelector from "@/components/time-period/holiday-selector";
import InformationDisplay from "@/components/time-period/InformationDisplay";
import ManualEditor from "@/components/time-period/manual-editor";
import PeriodSelector from "@/components/time-period/period-selector";
import SectionNameInput from "@/components/time-period/SectionClassInput";
import { Button } from "@/components/ui/button";
import { Steps, useNavigationStore } from "@/stores/navigationStore";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useTranslations } from "next-intl";

export default function Home() {
    const { step, setSteps } = useNavigationStore();
    const { setActivateNext, activateNext, commitPendingHolidays } =
        useTimePeriodStore();
    const t = useTranslations("Nav");

    return (
        <>
            <div className="mx-auto w-full px-6">
                <div className="flex flex-row gap-2 justify-center mt-2">
                    <Button
                        className="w-24"
                        disabled={step === 1}
                        onClick={() => {
                            setSteps(Number(step - 1) as Steps);
                            setActivateNext(true);
                        }}
                    >
                        {t("previous")}
                    </Button>
                    <Button
                        className="w-24"
                        onClick={() => {
                            if (step === 2) {
                                commitPendingHolidays();
                            }
                            setSteps(Number(step + 1) as Steps);
                            setActivateNext(false);
                        }}
                        disabled={step >= 6 || !activateNext}
                    >
                        {t("next")}
                    </Button>
                </div>
                <div className="flex w-full mx-auto lg:3/4 flex-row justify-center">
                    <div className=" shrink-0">
                        <PeriodStepNav />
                    </div>

                    <div className="ml-1 mt-4 w-full lg:w-4/5">
                        {step === 1 && <DateSelector />}
                        {step === 2 && <HolidaySelector />}
                        {step === 3 && <SectionNameInput />}
                        {step === 4 && <PeriodSelector />}
                        {step === 5 && <ManualEditor />}
                        {step === 6 && <InformationDisplay />}
                    </div>
                </div>
            </div>
        </>
    );
}
