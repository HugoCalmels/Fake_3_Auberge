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

export default function AdminReservationPlanningView({
  rooms,
  roomTypes,
  onSelectBooking,
  refreshKey,
}: Props) {
  const [rangeStart, setRangeStart] = useState(getTodayInputDate());
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
    setCreateStartDate(rangeStart);
    setCreateEndDate(addDaysToInputDate(rangeStart, 1));
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
            <p className="mt-2 max-w-[640px] text-sm leading-6 text-[#6c675f]">
              Clique une case vide pour créer une réservation sur la bonne
              chambre et la bonne date.
            </p>
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
                onClick={() => setRangeStart(getTodayInputDate())}
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
              className="grid min-w-[980px]"
              style={{
                gridTemplateColumns: `220px repeat(${visibleDays.length}, minmax(108px, 1fr))`,
              }}
            >
              <div className="sticky left-0 z-10 border-b border-r border-[#d8ccba] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#756f67]">
                Chambres
              </div>

              {visibleDays.map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-[#d8ccba] bg-white px-2 py-3 text-center"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#756f67]">
                    {formatWeekdayHeader(day)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1e1e1e]">
                    {formatDayHeader(day)}
                  </p>
                </div>
              ))}

              {planning.rooms.map((room) => {
                const roomBookings = planning.bookings.filter(
                  (booking) => booking.roomId === room.id,
                );

                return (
                  <GridRow
                    key={room.id}
                    room={room}
                    days={visibleDays}
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
  bookings,
  onSelectBooking,
  onCreateAtCell,
}: {
  room: AdminPlanningResponse["rooms"][number];
  days: string[];
  bookings: AdminPlanningResponse["bookings"];
  onSelectBooking: (bookingId: string) => void;
  onCreateAtCell: (day: string) => void;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 border-b border-r border-[#d8ccba] bg-white px-4 py-3">
        <p className="text-lg font-semibold text-[#1e1e1e]">{room.number}</p>
        <p className="text-sm text-[#6c675f]">
          {room.roomTypeName ?? "—"} • étage {room.floor}
        </p>
      </div>

      {days.map((day) => {
        const booking = bookings.find((item) =>
          isDayInsideBooking(day, item.startDate, item.endDate),
        );

        const isPast = isPastDay(day);

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
            day === days[0] && booking.startDate < day;

          const endsAfterVisibleRange =
            day === days[days.length - 1] && booking.endDate > nextDay;

          const isFirstVisibleSegment =
            !continuesFromPreviousVisibleDay && !startsBeforeVisibleRange;

          const isLastVisibleSegment =
            !continuesToNextVisibleDay && !endsAfterVisibleRange;

          const hasDateWarning = isBookingDateWarning(booking);
          const colors = getBookingColors(booking.status, hasDateWarning);
          const paymentStatus = getBookingPaymentStatus(booking);

          return (
            <div
              key={`${room.id}-${day}`}
              className={`min-h-[72px] border-b ${
                isLastVisibleSegment ? "border-r" : ""
              } ${
                isPast
                  ? "border-[#c8bba8] bg-[#e8e8e8]"
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
                title={`${booking.guestName} - ${segment.current}/${segment.total}`}
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
                : `${DEFAULT_CELL_BORDER} bg-white hover:bg-[#f7f2ea]`
            }`}
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
      stripTime(new Date(day)),
      stripTime(new Date(startDate)),
    ) + 1;

  const total = differenceInCalendarDays(
    stripTime(new Date(endDate)),
    stripTime(new Date(startDate)),
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

function isBookingDateWarning(
  booking: AdminPlanningResponse["bookings"][number],
) {
  const today = stripTime(new Date());
  const start = stripTime(new Date(booking.startDate));
  const end = stripTime(new Date(booking.endDate));

  if (booking.status === "pending") return true;
  if (booking.status === "confirmed" && start <= today && end > today) return true;
  if (booking.status === "confirmed" && end <= today) return true;
  if (booking.status === "checked_in" && end <= today) return true;
  if (booking.status === "checked_in" && start > today) return true;

  return false;
}

function isDayInsideBooking(day: string, startDate: string, endDate: string) {
  const d = stripTime(new Date(day));
  const start = stripTime(new Date(startDate));
  const end = stripTime(new Date(endDate));

  return d >= start && d < end;
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isPastDay(value: string) {
  return stripTime(new Date(value)) < stripTime(new Date());
}

function getTodayInputDate() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
}

function addDaysToInputDate(input: string, days: number) {
  const date = new Date(`${input}T00:00:00`);
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
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
  });
}

function formatDayHeader(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatRangeLabel(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);

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