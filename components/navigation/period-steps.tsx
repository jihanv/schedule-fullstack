"use client";

import { steps } from "@/lib/stepInformation";
import { useNavigationStore } from "@/stores/navigationStore";
import { useTranslations } from "next-intl";

type StepNavProps = {
  onStepClick?: (step: number) => void;
};

export default function PeriodStepNav({ onStepClick }: StepNavProps) {
  const { step } = useNavigationStore();
  const t = useTranslations("Steps");

  return (
    <div className="fixed rounded-2xl text-foreground bg-red-200">
      <div className="mt-6 space-y-3">
        {steps.map((s) => {
          const isActive = s.step === step;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => onStepClick?.(s.step)}
              className={[
                "w-full rounded-xl px-4 py-3 text-left transition",
                "flex items-center gap-3",
                isActive
                  ? "bg-emerald-800 text-background"
                  : "bg-gray-300 text-accent-foreground",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  "bg-white text-foreground",
                ].join(" ")}
              >
                {s.step}
              </div>

              <span className="text-sm font-medium">{t(String(s.step))}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
