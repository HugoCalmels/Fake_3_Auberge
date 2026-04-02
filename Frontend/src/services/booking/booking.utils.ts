import type { BookingSearch } from "./booking.types";

export function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toInputDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function buildCalendarDays(visibleMonth: Date) {
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

export function getNightCount(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return 0;

  const start = stripTime(new Date(startDate));
  const end = stripTime(new Date(endDate));
  const diff = end.getTime() - start.getTime();

  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  locale = "fr-FR",
) {
  if (!startDate || !endDate) return "Choisir les dates";

  const start = new Date(startDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });

  const end = new Date(endDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });

  return `${start} → ${end}`;
}

export function formatGuestSummary(search: BookingSearch) {
  return `${search.rooms} chambre${search.rooms > 1 ? "s" : ""}`;
}

export function isSearchReady(search: BookingSearch) {
  return Boolean(
    search.startDate &&
      search.endDate &&
      getNightCount(search.startDate, search.endDate) > 0 &&
      search.rooms > 0,
  );
}

export function updateDateRange(
  currentStart: string | null,
  currentEnd: string | null,
  value: string,
) {
  if (!currentStart) {
    return { startDate: value, endDate: null };
  }

  if (!currentEnd) {
    if (new Date(value) <= new Date(currentStart)) {
      return { startDate: value, endDate: null };
    }

    return { startDate: currentStart, endDate: value };
  }

  return { startDate: value, endDate: null };
}