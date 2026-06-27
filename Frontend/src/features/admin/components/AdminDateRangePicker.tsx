"use client";

import { useMemo, useState } from "react";

type Props = {
  startDate: string;
  endDate: string;
  disabled?: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

const WEEK_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function AdminDateRangePicker({
  startDate,
  endDate,
  disabled = false,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  const initialMonth = startDate
    ? inputDateToLocalDate(startDate)
    : new Date();

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  const nights = useMemo(
    () => getNights(startDate, endDate),
    [startDate, endDate],
  );

  function handleSelectDate(value: string) {
    if (disabled) return;

    if (!startDate || (startDate && endDate)) {
      onStartDateChange(value);
      onEndDateChange("");
      return;
    }

    if (value <= startDate) {
      onStartDateChange(value);
      onEndDateChange("");
      return;
    }

    onEndDateChange(value);
  }

  function goToToday() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
            Dates du séjour
          </p>

          <h4 className="mt-1 text-lg font-semibold text-[#1e1e1e]">
            {formatMonthLabel(visibleMonth)}
          </h4>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
            className="h-9 w-9 rounded-full border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#f7f3ec] disabled:cursor-not-allowed disabled:opacity-60"
          >
            ←
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={goToToday}
            className="h-9 rounded-full border border-[#d8d0c2] bg-white px-3 text-sm text-[#314835] transition hover:bg-[#f7f3ec] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aujourd’hui
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
            className="h-9 w-9 rounded-full border border-[#d8d0c2] bg-white text-[#314835] transition hover:bg-[#f7f3ec] disabled:cursor-not-allowed disabled:opacity-60"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="pb-2 text-[11px] text-[#8a847b]">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const value = toInputDate(day);
          const today = toInputDate(new Date());

          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isToday = value === today;
          const isStart = value === startDate;
          const isEnd = value === endDate;

          const isInRange =
            Boolean(startDate && endDate) &&
            value > startDate &&
            value < endDate;

          return (
            <div key={value} className="flex h-10 items-center justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleSelectDate(value)}
                aria-label={formatHumanDate(value)}
                className={[
                  "h-8 w-8 rounded-full text-sm transition",
                  "focus:outline-none focus:ring-2 focus:ring-[#314835]/30 focus:ring-offset-2",

                  (isStart || isEnd) &&
                    "bg-[#314835] font-semibold text-white shadow-sm",

                  !isStart &&
                    !isEnd &&
                    isInRange &&
                    "bg-[#dfe9dc] font-medium text-[#263d2f]",

                  !isStart &&
                    !isEnd &&
                    !isInRange &&
                    isToday &&
                    "border border-[#314835] bg-white font-semibold text-[#314835] hover:bg-[#f3f7f1]",

                  !isStart &&
                    !isEnd &&
                    !isInRange &&
                    !isToday &&
                    isCurrentMonth &&
                    "text-[#1e1e1e] hover:bg-[#f3f5ef]",

                  !isStart &&
                    !isEnd &&
                    !isInRange &&
                    !isToday &&
                    !isCurrentMonth &&
                    "text-[#b8afa3] hover:bg-[#f3f5ef]",

                  disabled && "cursor-not-allowed opacity-60",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[#ece5d8] pt-3 text-sm text-[#6c675f]">
        <span className="font-medium text-[#1e1e1e]">Arrivée :</span>{" "}
        {startDate ? formatHumanDate(startDate) : "—"}
        <span className="mx-2 text-[#b7ae9f]">·</span>
        <span className="font-medium text-[#1e1e1e]">Départ :</span>{" "}
        {endDate ? formatHumanDate(endDate) : "—"}
        <span className="mx-2 text-[#b7ae9f]">·</span>
        <span className="font-medium text-[#1e1e1e]">Nuits :</span> {nights}
      </div>
    </div>
  );
}

function buildCalendarDays(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const offset = firstDayOfMonth.getDay();
  const firstVisibleDay = new Date(year, month, 1 - offset);

  const visibleDayCount =
    offset + lastDayOfMonth.getDate() <= 35 ? 35 : 42;

  return Array.from({ length: visibleDayCount }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return date;
  });
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function inputDateToLocalDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNights(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;

  const start = inputDateToLocalDate(startDate);
  const end = inputDateToLocalDate(endDate);

  return Math.max(
    0,
    Math.ceil((end.getTime() - start.getTime()) / 86_400_000),
  );
}

function formatHumanDate(value: string) {
  return inputDateToLocalDate(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatMonthLabel(value: Date) {
  return value.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}