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

const WEEK_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

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
  const today = useMemo(() => toInputDate(new Date()), []);

  const monthLabel = visibleMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm sm:rounded-[22px]">
      <div className="border-b border-[#ece5d8] px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a847b] sm:text-[11px]">
          Calendrier
        </p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-[24px] font-semibold leading-none text-[#1e1e1e] sm:text-[26px]">
              {monthLabel}
            </h3>

            <p className="mt-3 text-[14px] leading-5 text-[#6c675f]">
              Cliquez une date d’arrivée puis une date de départ.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <CalendarNavButton onClick={onPrevMonth}>←</CalendarNavButton>

            <button
              type="button"
              onClick={onToday}
              className="h-10 rounded-full border border-[#d8d0c2] bg-white px-4 text-[13px] font-medium text-[#314835] transition hover:bg-[#f7f3ec]"
            >
              Aujourd’hui
            </button>

            <CalendarNavButton onClick={onNextMonth}>→</CalendarNavButton>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="grid grid-cols-7 text-center">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="pb-2 text-[10px] font-medium text-[#8a847b] sm:text-[11px]"
              >
                {day}
              </div>
            ))}

            {days.map((day) => {
              const value = toInputDate(day);
              const isCurrentMonth =
                day.getMonth() === visibleMonth.getMonth();

              const isToday = value === today;
              const isSelectedStart = value === startDate;
              const isSelectedEnd = value === endDate;
              const isSelected = isSelectedStart || isSelectedEnd;

              const isInRange =
                Boolean(startDate && endDate) &&
                value > startDate &&
                value < endDate;

              return (
                <div
                  key={value}
                  className="flex h-[42px] items-center justify-center sm:h-[52px]"
                >
                  <button
                    type="button"
                    onClick={() => onSelectDate(value)}
                    aria-label={formatHumanDate(value)}
                    className={[
                      "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[15px] transition sm:h-11 sm:w-11 sm:text-[17px]",
                      "focus:outline-none focus:ring-2 focus:ring-[#314835]/30 focus:ring-offset-2",

                      isSelected &&
                        "bg-[#314835] font-semibold text-white shadow-sm",

                      !isSelected &&
                        isInRange &&
                        "bg-[#dfe9dc] font-medium text-[#263d2f]",

                      !isSelected &&
                        !isInRange &&
                        isToday &&
                        "border border-[#314835] bg-white font-semibold text-[#314835] hover:bg-[#f3f7f1]",

                      !isSelected &&
                        !isInRange &&
                        !isToday &&
                        isCurrentMonth &&
                        "text-[#1f1f1f] hover:bg-[#f3f5ef]",

                      !isSelected &&
                        !isInRange &&
                        !isToday &&
                        !isCurrentMonth &&
                        "text-[#d0c8bd] hover:bg-[#f3f5ef]",
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

          <div className="mt-4 border-t border-[#ece5d8] pt-3 text-[13px] leading-6 text-[#6c675f] sm:mt-5 sm:pt-4 sm:text-[14px]">
            <span className="font-medium text-[#1e1e1e]">Arrivée :</span>{" "}
            {startDate ? formatHumanDate(startDate) : "—"}
            <span className="mx-2 text-[#b7ae9f]">·</span>
            <span className="font-medium text-[#1e1e1e]">Départ :</span>{" "}
            {endDate ? formatHumanDate(endDate) : "—"}
            <span className="mx-2 text-[#b7ae9f]">·</span>
            <span className="font-medium text-[#1e1e1e]">Nuits :</span>{" "}
            {nights}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarNavButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d0c2] bg-white text-[15px] text-[#314835] transition hover:bg-[#f7f3ec]"
    >
      {children}
    </button>
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

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function inputDateToLocalDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatHumanDate(value: string) {
  return inputDateToLocalDate(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
