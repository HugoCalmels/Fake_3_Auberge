"use client";

import type { BookingStep } from "./BookingModal";

export default function BookingStepBar({ step }: { step: BookingStep }) {
  const totalSegments = 20;
  const activeSegments = step === 1 ? 5 : step === 2 ? 10 : step === 3 ? 15 : 20;

  return (
    <div className="w-full">
      <div className="flex w-full items-center gap-[6px]">
        {Array.from({ length: totalSegments }, (_, index) => (
          <div
            key={index}
            className={[
              "h-[8px] min-w-0 flex-1 rounded-full transition-colors",
              index < activeSegments ? "bg-[#314835]" : "bg-[#d9ddd3]",
            ].join(" ")}
          />
        ))}
      </div>

      <div className="mt-3 grid w-full grid-cols-4 items-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
        <span className="text-left">Dates du séjour</span>
        <span className="text-center">Options</span>
        <span className="text-center">Suppléments</span>
        <span className="text-right">Paiement</span>
      </div>
    </div>
  );
}