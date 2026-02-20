"use client";
import PeriodStepNav from "@/components/navigation/period-steps";
import DateSelector from "@/components/time-period/date-selector";
import HolidaySelector from "@/components/time-period/holiday-selector";
import InformationDisplay from "@/components/time-period/InformationDisplay";
import PeriodSelector from "@/components/time-period/period-selector";
import SectionNameInput from "@/components/time-period/SectionClassInput";
import { Button } from "@/components/ui/button";
import { Steps, useNavigationStore } from "@/stores/navigationStore";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useTranslations } from "next-intl";

export default function Home() {
  const { step, setSteps } = useNavigationStore();
  const { setActivateNext, activateNext } = useTimePeriodStore();
  const t = useTranslations("Nav");

  return (
    <>
      <div className="flex flex-row gap-2 justify-center mt-10">
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
            setSteps(Number(step + 1) as Steps);
            setActivateNext(false);
          }}
          disabled={step >= 5 || !activateNext}
        >
          {t("next")}
        </Button>
      </div>
      <div className="flex flex-row">
        <PeriodStepNav />
        <div className="bg-blue-50 ml-45 w-full">
          {step === 1 && <DateSelector />}
          {step === 2 && <HolidaySelector />}
          {step === 3 && <SectionNameInput />}
          {step === 4 && <PeriodSelector />}
          {step === 5 && <InformationDisplay />}
        </div>
      </div>
    </>
  );
}
