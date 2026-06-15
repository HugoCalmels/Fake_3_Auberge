"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminPlanning } from "@/features/admin/api/adminPlanning.api";
import type {
  AdminBookingDetailDto,
  AdminPlanningResponse,
  AdminRoomDto,
  AdminRoomTypeDto,
} from "@/features/admin/types";
import AdminBookingFormModal from "./AdminBookingFormModal";

type Props = {
  rooms: AdminRoomDto[];
  roomTypes: AdminRoomTypeDto[];
  onSelectBooking: (bookingId: string) => void;
  onBookingCreated: (booking: AdminBookingDetailDto) => Promise<void> | void;
  refreshKey: number;
};

const VISIBLE_DAYS = 7;
const FETCH_PADDING_DAYS = 45;

const GRID_BORDER = "border-[#d8ccba]";
const DEFAULT_CELL_BORDER = `border-b border-r ${GRID_BORDER}`;
const PAST_CELL_BORDER = "border-b border-r border-[#c8bba8]";

const TODAY_CELL_BG = "bg-[#d2e0cf]";
const TODAY_CELL_BORDER = "border-b border-r border-[#abc1a9]";
const TODAY_CELL_HOVER = "hover:bg-[#bed3ba]";
const FUTURE_CELL_HOVER = "hover:bg-[#eadfcd]";

const STATUS_HELP_ITEMS = [
  {
    color: "bg-[#3F51B5]",
    label: "Réservée",
    description: "Réservation confirmée, client attendu.",
  },
  {
    color: "bg-[#0B8043]",
    label: "Arrivé",
    description: "Client marqué comme arrivé.",
  },
  {
    color: "bg-[#616161]",
    label: "Parti",
    description: "Client marqué comme parti.",
  },
  {
    color: "bg-[#F4511E]",
    label: "Pas venu",
    description: "Client marqué comme no-show.",
  },
  {
    color: "bg-[#F6BF26]",
    label: "À vérifier",
    description:
      "Action humaine probablement nécessaire : réservation non confirmée, arrivée non marquée, départ non clôturé ou incohérence.",
  },
];

export default function AdminReservationPlanningView({
  rooms,
  roomTypes,
  onSelectBooking,
  refreshKey,
}: Props) {
  const today = getTodayInputDate();

  const [rangeStart, setRangeStart] = useState(() =>
    getWeekStartInputDate(today),
  );
  const [planning, setPlanning] = useState<AdminPlanningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createRoomId, setCreateRoomId] = useState("");
  const [lockRoom, setLockRoom] = useState(false);

  const visibleDays = useMemo(
    () =>
      Array.from({ length: VISIBLE_DAYS }, (_, index) =>
        addDaysToInputDate(rangeStart, index),
      ),
    [rangeStart],
  );

  const rangeEnd = visibleDays[visibleDays.length - 1];

  const fetchStart = useMemo(
    () => addDaysToInputDate(rangeStart, -FETCH_PADDING_DAYS),
    [rangeStart],
  );

  const fetchEnd = useMemo(() => addDaysToInputDate(rangeEnd, 1), [rangeEnd]);

  const loadPlanning = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminPlanning(fetchStart, fetchEnd);
      setPlanning(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer le planning.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchStart, fetchEnd]);

  useEffect(() => {
    loadPlanning();
  }, [loadPlanning, refreshKey]);

  function openCreateFromGrid(day: string, roomId: string) {
    setCreateStartDate(day);
    setCreateEndDate(addDaysToInputDate(day, 1));
    setCreateRoomId(roomId);
    setLockRoom(true);
    setCreateOpen(true);
  }

  function openGenericCreate() {
    setCreateStartDate(today);
    setCreateEndDate(addDaysToInputDate(today, 1));
    setCreateRoomId("");
    setLockRoom(false);
    setCreateOpen(true);
  }

  async function handleCreated() {
    await loadPlanning();
    setCreateOpen(false);
  }

  return (
    <>
      <section className="overflow-hidden rounded-[22px] border border-[#cfc2ad] bg-white shadow-sm">
        <div className="border-b border-[#d8ccba] bg-white px-5 py-5">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-[#1e1e1e]">Planning</h2>
          </div>

          <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center">
            <div className="text-sm text-[#6c675f] xl:justify-self-start">
              {formatRangeLabel(rangeStart, rangeEnd)}
            </div>

            <div className="flex items-center justify-start gap-2 xl:justify-self-center">
              <button
                type="button"
                onClick={() =>
                  setRangeStart((prev) =>
                    addDaysToInputDate(prev, -VISIBLE_DAYS),
                  )
                }
                className="cursor-pointer rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#eee6da]"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => setRangeStart(getWeekStartInputDate(today))}
                className="cursor-pointer rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#eee6da]"
              >
                Aujourd’hui
              </button>

              <button
                type="button"
                onClick={() =>
                  setRangeStart((prev) =>
                    addDaysToInputDate(prev, VISIBLE_DAYS),
                  )
                }
                className="cursor-pointer rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#eee6da]"
              >
                →
              </button>
            </div>

            <div className="flex justify-start xl:justify-self-end">
              <button
                type="button"
                onClick={openGenericCreate}
                className="cursor-pointer rounded-xl bg-[#314835] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b563f]"
              >
                Nouvelle réservation
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6c675f]">
            <LegendItem color="bg-[#3F51B5]" label="Réservée" />
            <LegendItem color="bg-[#0B8043]" label="Arrivé" />
            <LegendItem color="bg-[#616161]" label="Parti" />
            <LegendItem color="bg-[#F4511E]" label="Pas venu" />
            <LegendItem color="bg-[#F6BF26]" label="À vérifier" />
            <StatusHelpPopover />
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-sm text-[#6c675f]">
            Chargement du planning...
          </div>
        ) : error ? (
          <div className="px-5 py-8 text-sm text-red-700">{error}</div>
        ) : !planning ? (
          <div className="px-5 py-8 text-sm text-[#6c675f]">
            Aucun planning disponible.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid w-full min-w-[980px]"
              style={{
                gridTemplateColumns: `180px repeat(${visibleDays.length}, minmax(108px, 1fr))`,
              }}
            >
              <div className="sticky left-0 z-10 border-b border-r border-[#d8ccba] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#756f67]">
                Chambres
              </div>

              {visibleDays.map((day, index) => {
                const isLastColumn = index === visibleDays.length - 1;

                return (
                  <div
                    key={day}
                    className={`border-b border-[#d8ccba] bg-white px-2 py-3 text-center ${
                      isLastColumn ? "" : "border-r"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#756f67]">
                      {formatWeekdayHeader(day)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#1e1e1e]">
                      {formatDayHeader(day)}
                    </p>
                  </div>
                );
              })}

              {planning.rooms.map((room) => {
                const roomBookings = planning.bookings.filter(
                  (booking) => booking.roomId === room.id,
                );

                return (
                  <GridRow
                    key={room.id}
                    room={room}
                    days={visibleDays}
                    today={today}
                    bookings={roomBookings}
                    onSelectBooking={onSelectBooking}
                    onCreateAtCell={(day) => openCreateFromGrid(day, room.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      <AdminBookingFormModal
        open={createOpen}
        initialStartDate={createStartDate}
        initialEndDate={createEndDate}
        initialRoomId={createRoomId}
        lockRoom={lockRoom}
        rooms={rooms}
        roomTypes={roomTypes}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

function GridRow({
  room,
  days,
  today,
  bookings,
  onSelectBooking,
  onCreateAtCell,
}: {
  room: AdminPlanningResponse["rooms"][number];
  days: string[];
  today: string;
  bookings: AdminPlanningResponse["bookings"];
  onSelectBooking: (bookingId: string) => void;
  onCreateAtCell: (day: string) => void;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 border-b border-r border-[#d8ccba] bg-white px-4 py-3">
        <p className="text-lg font-semibold text-[#1e1e1e]">{room.number}</p>
        <p className="text-sm text-[#6c675f]">{room.roomTypeName ?? "—"}</p>
      </div>

      {days.map((day, index) => {
        const booking = bookings.find((item) =>
          isDayInsideBooking(day, item.startDate, item.endDate),
        );

        const isPast = isPastDay(day);
        const isToday = day === today;
        const isLastColumn = index === days.length - 1;

        if (booking) {
          const segment = getBookingSegment(
            day,
            booking.startDate,
            booking.endDate,
          );

          const previousDay = addDaysToInputDate(day, -1);
          const nextDay = addDaysToInputDate(day, 1);

          const continuesFromPreviousVisibleDay =
            days.includes(previousDay) &&
            isDayInsideBooking(previousDay, booking.startDate, booking.endDate);

          const continuesToNextVisibleDay =
            days.includes(nextDay) &&
            isDayInsideBooking(nextDay, booking.startDate, booking.endDate);

          const startsBeforeVisibleRange =
            day === days[0] && normalizeInputDate(booking.startDate) < day;

          const endsAfterVisibleRange =
            day === days[days.length - 1] &&
            normalizeInputDate(booking.endDate) > nextDay;

          const isFirstVisibleSegment =
            !continuesFromPreviousVisibleDay && !startsBeforeVisibleRange;

          const isLastVisibleSegment =
            !continuesToNextVisibleDay && !endsAfterVisibleRange;

          const warningReason = getBookingWarningReason(booking);
          const hasDateWarning = Boolean(warningReason);
          const colors = getBookingColors(booking.status, hasDateWarning);
          const paymentStatus = getBookingPaymentStatus(booking);

          return (
            <div
              key={`${room.id}-${day}`}
              className={`min-h-[72px] border-b ${
                isLastVisibleSegment && !isLastColumn ? "border-r" : ""
              } ${
                isPast
                  ? "border-[#c8bba8] bg-[#e8e8e8]"
                  : isToday
                    ? "border-[#abc1a9] bg-[#e5eee4]"
                    : "border-[#d8ccba] bg-white"
              } ${getBookingCellPaddingClass(
                isFirstVisibleSegment,
                isLastVisibleSegment,
              )}`}
            >
              <button
                type="button"
                onClick={() => onSelectBooking(booking.id)}
                className={`relative flex min-h-[68px] w-full cursor-pointer flex-col justify-start overflow-hidden px-2 py-2 text-left text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition ${colors.card} ${getBookingRadiusClass(
                  isFirstVisibleSegment,
                  isLastVisibleSegment,
                )}`}
                title={
                  warningReason
                    ? `${booking.guestName} - ${segment.current}/${segment.total}\n\nÀ vérifier : ${warningReason}`
                    : `${booking.guestName} - ${segment.current}/${segment.total}`
                }
              >
                <p className="truncate text-[13px] font-semibold leading-4 text-white">
                  {booking.guestName}
                </p>

                <p className="mt-0.5 text-[11px] font-semibold leading-4 text-white/90">
                  {segment.current}/{segment.total}
                </p>

                <div
                  className={`absolute inset-x-0 bottom-0 h-[18px] px-2 text-[10px] font-semibold uppercase leading-[18px] tracking-[0.08em] text-white ${
                    paymentStatus === "unpaid"
                      ? colors.paymentUnpaid
                      : colors.paymentPaid
                  }`}
                >
                  {paymentStatus === "unpaid" ? "Non payé" : "Payé"}
                </div>
              </button>
            </div>
          );
        }

        return (
          <button
            key={`${room.id}-${day}`}
            type="button"
            onClick={() => onCreateAtCell(day)}
            className={`min-h-[72px] cursor-pointer p-[2px] transition ${
              isPast
                ? `${PAST_CELL_BORDER} bg-[#e8e8e8] hover:bg-[#dddddd]`
                : isToday
                  ? `${TODAY_CELL_BORDER} ${TODAY_CELL_BG} ${TODAY_CELL_HOVER}`
                  : `${DEFAULT_CELL_BORDER} bg-white ${FUTURE_CELL_HOVER}`
            } ${isLastColumn ? "border-r-0" : ""}`}
          />
        );
      })}
    </>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded-[4px] ${color}`} />
      {label}
    </span>
  );
}

function StatusHelpPopover() {
  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-[#d8d0c2] bg-white text-[11px] font-semibold text-[#6c675f] transition hover:bg-[#eee6da] hover:text-[#314835]"
        aria-label="Comprendre les statuts"
      >
        ?
      </button>

      <div className="pointer-events-none absolute left-1/2 top-7 z-50 hidden w-[360px] -translate-x-1/2 rounded-2xl border border-[#d8ccba] bg-white p-4 text-left text-xs text-[#5f5a52] shadow-[0_14px_34px_rgba(0,0,0,0.16)] group-hover:block">
        <div className="mb-3">
          <p className="text-sm font-semibold text-[#1e1e1e]">
            Comprendre les statuts
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[#756f67]">
            Les couleurs du planning indiquent l’état opérationnel d’une
            réservation.
          </p>
        </div>

        <div className="space-y-2">
          {STATUS_HELP_ITEMS.map((item) => (
            <div key={item.label} className="flex gap-2">
              <span
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-[4px] ${item.color}`}
              />
              <div>
                <p className="font-semibold text-[#1e1e1e]">{item.label}</p>
                <p className="mt-0.5 leading-4">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-[#f4f0e8] p-3 text-[11px] leading-4 text-[#5f5a52]">
          <p className="font-semibold text-[#314835]">
            Déclenchement “À vérifier” en MVP
          </p>
          <p className="mt-1">
            La logique actuelle est basée sur la date uniquement : l’alerte se
            déclenche à <strong>00:00</strong> lorsque le jour concerné commence.
          </p>
          <p className="mt-1">
            Version métier avancée possible : utiliser les horaires réels de
            l’établissement, par exemple check-in après 15h/16h et check-out
            après 10h/11h.
          </p>
        </div>
      </div>
    </div>
  );
}

function getBookingCellPaddingClass(isFirst: boolean, isLast: boolean) {
  if (isFirst && isLast) return "p-[2px]";
  if (isFirst) return "py-[2px] pl-[2px]";
  if (isLast) return "py-[2px] pr-[2px]";
  return "py-[2px]";
}

function getBookingRadiusClass(isFirst: boolean, isLast: boolean) {
  if (isFirst && isLast) return "rounded-[8px]";
  if (isFirst) return "rounded-l-[8px] rounded-r-none";
  if (isLast) return "rounded-l-none rounded-r-[8px]";
  return "rounded-none";
}

function getBookingSegment(day: string, startDate: string, endDate: string) {
  const current =
    differenceInCalendarDays(
      inputDateToLocalDate(day),
      inputDateToLocalDate(startDate),
    ) + 1;

  const total = differenceInCalendarDays(
    inputDateToLocalDate(endDate),
    inputDateToLocalDate(startDate),
  );

  return {
    current: Math.max(1, current),
    total: Math.max(1, total),
  };
}

function differenceInCalendarDays(a: Date, b: Date) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.round((utcA - utcB) / 86_400_000);
}

function getBookingColors(status: string, hasDateWarning = false) {
  if (hasDateWarning) {
    return {
      card: "border-[#D9A520] bg-[#D9A520] hover:bg-[#C89316]",
      paymentPaid: "bg-[#33B679]",
      paymentUnpaid: "bg-[#A85F12]",
    };
  }

  switch (status) {
    case "checked_in":
      return {
        card: "border-[#0B8043] bg-[#0B8043] hover:bg-[#097138]",
        paymentPaid: "bg-[#33B679]",
        paymentUnpaid: "bg-[#A85F12]",
      };

    case "checked_out":
      return {
        card: "border-[#616161] bg-[#616161] hover:bg-[#555555]",
        paymentPaid: "bg-[#33B679]",
        paymentUnpaid: "bg-[#A85F12]",
      };

    case "no_show":
      return {
        card: "border-[#D96A3A] bg-[#D96A3A] hover:bg-[#C95E30]",
        paymentPaid: "bg-[#33B679]",
        paymentUnpaid: "bg-[#A85F12]",
      };

    default:
      return {
        card: "border-[#3F51B5] bg-[#3F51B5] hover:bg-[#3648A8]",
        paymentPaid: "bg-[#33B679]",
        paymentUnpaid: "bg-[#A85F12]",
      };
  }
}

function getBookingPaymentStatus(
  booking: AdminPlanningResponse["bookings"][number],
): "paid" | "unpaid" {
  const maybeBooking = booking as AdminPlanningResponse["bookings"][number] & {
    paymentStatus?: "paid" | "unpaid" | null;
  };

  return maybeBooking.paymentStatus === "paid" ? "paid" : "unpaid";
}

function getBookingWarningReason(
  booking: AdminPlanningResponse["bookings"][number],
) {
  const today = stripTime(new Date());
  const start = inputDateToLocalDate(booking.startDate);
  const end = inputDateToLocalDate(booking.endDate);

  if (booking.status === "pending") {
    return "réservation non confirmée. En MVP, ce statut est affiché en alerte.";
  }

  if (booking.status === "confirmed" && start <= today && end > today) {
    return "arrivée prévue aujourd’hui ou déjà commencée, mais client pas encore marqué arrivé. Trigger MVP : 00:00 le jour d’arrivée.";
  }

  if (booking.status === "confirmed" && end <= today) {
    return "séjour terminé ou jour de départ atteint, mais réservation toujours confirmée. Trigger MVP : 00:00 le jour du départ.";
  }

  if (booking.status === "checked_in" && end <= today) {
    return "départ prévu aujourd’hui ou passé, mais client pas encore marqué parti. Trigger MVP : 00:00 le jour du départ.";
  }

  if (booking.status === "checked_in" && start > today) {
    return "incohérence métier : client marqué arrivé avant sa date d’arrivée.";
  }

  return null;
}

function isDayInsideBooking(day: string, startDate: string, endDate: string) {
  const d = inputDateToLocalDate(day);
  const start = inputDateToLocalDate(startDate);
  const end = inputDateToLocalDate(endDate);

  return d >= start && d < end;
}

function isPastDay(value: string) {
  return inputDateToLocalDate(value) < stripTime(new Date());
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeInputDate(value: string) {
  return value.slice(0, 10);
}

function inputDateToLocalDate(value: string) {
  const normalized = normalizeInputDate(value);
  const [year, month, day] = normalized.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getTodayInputDate() {
  return toInputDate(new Date());
}

function getWeekStartInputDate(input: string) {
  const date = inputDateToLocalDate(input);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diffToMonday);

  return toInputDate(date);
}

function addDaysToInputDate(input: string, days: number) {
  const date = inputDateToLocalDate(input);
  date.setDate(date.getDate() + days);

  return toInputDate(date);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatWeekdayHeader(value: string) {
  return inputDateToLocalDate(value).toLocaleDateString("fr-FR", {
    weekday: "short",
  });
}

function formatDayHeader(value: string) {
  return inputDateToLocalDate(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatRangeLabel(from: string, to: string) {
  const fromDate = inputDateToLocalDate(from);
  const toDate = inputDateToLocalDate(to);

  return `${fromDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })} → ${toDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;
}