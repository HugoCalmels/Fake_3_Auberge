"use client";

import { useMemo } from "react";

type Props = {
  visibleMonth: Date;
  startDate: string;
  endDate: string;
  nights: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (value: string) => void;
};

export default function BookingDateStep({
  visibleMonth,
  startDate,
  endDate,
  nights,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDate,
}: Props) {
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  return (
    <div className="w-full rounded-[22px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
          Calendrier
        </p>

        <div className="mt-3 flex items-center justify-between gap-4">
          <h3 className="text-[24px] font-semibold text-[#1e1e1e]">
            {visibleMonth.toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#faf6ef]"
            >
              ←
            </button>

            <button
              type="button"
              onClick={onToday}
              className="rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-[13px] font-medium text-[#314835] transition hover:bg-[#faf6ef]"
            >
              Aujourd’hui
            </button>

            <button
              type="button"
              onClick={onNextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#faf6ef]"
            >
              →
            </button>
          </div>
        </div>

        <p className="mt-3 text-[14px] text-[#6c675f]">
          Cliquez une date d’arrivée puis une date de départ.
        </p>
      </div>

      <div className="px-6 py-5">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
              <div
                key={day}
                className="pb-1 text-[11px] font-medium text-[#8a847b]"
              >
                {day}
              </div>
            ))}

            {days.map((day) => {
              const value = toInputDate(day);
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelectedStart = value === startDate;
              const isSelectedEnd = value === endDate;
              const isInRange =
                Boolean(startDate) &&
                Boolean(endDate) &&
                new Date(value) > new Date(startDate) &&
                new Date(value) < new Date(endDate);

              return (
                <div
                  key={value}
                  className="flex h-[48px] items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={() => onSelectDate(value)}
                    className={[
                      "flex h-12 w-12 items-center justify-center rounded-full text-[18px] transition",
                      isSelectedStart || isSelectedEnd
                        ? "bg-[#314835] font-semibold text-white"
                        : isInRange
                          ? "bg-[#dfeadf] text-[#1e1e1e]"
                          : isCurrentMonth
                            ? "text-[#1e1e1e] hover:bg-[#f3f5ef]"
                            : "text-[#c1baad]",
                    ].join(" ")}
                  >
                    {day.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-[#ece5d8] pt-4 text-[14px] text-[#6c675f]">
            <span className="font-medium text-[#1e1e1e]">Arrivée :</span>{" "}
            {startDate ? formatHumanDate(startDate) : "—"}
            <span className="mx-2 text-[#b7ae9f]">·</span>
            <span className="font-medium text-[#1e1e1e]">Départ :</span>{" "}
            {endDate ? formatHumanDate(endDate) : "—"}
            <span className="mx-2 text-[#b7ae9f]">·</span>
            <span className="font-medium text-[#1e1e1e]">Nuits :</span> {nights}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildCalendarDays(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const offset = firstDayOfMonth.getDay();
  const firstVisibleDay = new Date(year, month, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return date;
  });
}

function toInputDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatHumanDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}