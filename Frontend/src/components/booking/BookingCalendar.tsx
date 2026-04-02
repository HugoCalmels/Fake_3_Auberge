"use client";

import { useMemo } from "react";

type Props = {
  visibleMonth: Date;
  startDate: string;
  endDate: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onReset: () => void;
  onSelectDate: (date: string) => void;
};

const WEEK_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function BookingCalendar({
  visibleMonth,
  startDate,
  endDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onReset,
  onSelectDate,
}: Props) {
  const days = useMemo(() => {
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
  }, [visibleMonth]);

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] text-[#5f584d]">
              {rangeLabel(startDate, endDate)}
            </p>

            <h3 className="mt-1 text-[16px] font-semibold text-[#1e1e1e]">
              {visibleMonth.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </h3>

            <p className="mt-1 text-[12px] text-[#6c675f]">
              Cliquez une date d’arrivée puis une date de départ.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#faf6ef]"
            >
              ←
            </button>

            <button
              type="button"
              onClick={onNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#faf6ef]"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="pb-1 text-[10px] font-medium text-[#8a847b]"
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const value = toInputDate(day);
            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
            const isStart = value === startDate;
            const isEnd = value === endDate;
            const isInRange =
              Boolean(startDate) &&
              Boolean(endDate) &&
              new Date(value) > new Date(startDate) &&
              new Date(value) < new Date(endDate);

            const isSelected = isStart || isEnd;

            return (
              <button
                key={value}
                type="button"
                onClick={() => onSelectDate(value)}
                className={[
                  "h-9 rounded-[10px] text-[13px] transition",
                  isSelected
                    ? "bg-[#314835] font-semibold text-white"
                    : isInRange
                    ? "bg-[#dff0c8] text-[#1e1e1e]"
                    : isCurrentMonth
                    ? "bg-white text-[#1e1e1e] hover:bg-[#f5f7f1]"
                    : "bg-white text-[#c1baad]",
                ].join(" ")}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[12px] text-[#6c675f]">
            <span className="font-medium text-[#1e1e1e]">Arrivée :</span>{" "}
            {startDate ? formatDate(startDate) : "—"}
            <span className="mx-2 text-[#b2aa9d]">·</span>
            <span className="font-medium text-[#1e1e1e]">Départ :</span>{" "}
            {endDate ? formatDate(endDate) : "—"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-[#d8d0c2] bg-white px-3 py-1 text-[11px] font-medium text-[#314835] transition hover:bg-[#faf6ef]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onToday}
              className="rounded-lg border border-[#d8d0c2] bg-white px-3 py-1 text-[11px] font-medium text-[#314835] transition hover:bg-[#faf6ef]"
            >
              Aujourd’hui
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function toInputDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rangeLabel(startDate: string, endDate: string) {
  if (!startDate) return "Choisissez vos dates";
  if (!endDate) return `${formatDate(startDate)} → ...`;
  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
}