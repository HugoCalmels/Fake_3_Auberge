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

export default function AdminReservationPlanningView({
  rooms,
  roomTypes,
  onSelectBooking,
  onBookingCreated,
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

  const rangeEnd = useMemo(
    () => addDaysToInputDate(rangeStart, VISIBLE_DAYS - 1),
    [rangeStart]
  );

  const loadPlanning = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminPlanning(rangeStart, rangeEnd);
      setPlanning(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer le planning."
      );
    } finally {
      setLoading(false);
    }
  }, [rangeStart, rangeEnd]);

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

  function goToday() {
    setRangeStart(getTodayInputDate());
  }

  function goPrev() {
    setRangeStart((prev) => addDaysToInputDate(prev, -VISIBLE_DAYS));
  }

  function goNext() {
    setRangeStart((prev) => addDaysToInputDate(prev, VISIBLE_DAYS));
  }

  async function handleCreated(booking: AdminBookingDetailDto) {
    await onBookingCreated(booking);
    setCreateOpen(false);
  }

  return (
    <>
      <section className="rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
        <div className="border-b border-[#ece5d8] px-5 py-5">
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
                onClick={goPrev}
                className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] hover:bg-[#faf6ef]"
              >
                ←
              </button>

              <button
                type="button"
                onClick={goToday}
                className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] hover:bg-[#faf6ef]"
              >
                Aujourd’hui
              </button>

              <button
                type="button"
                onClick={goNext}
                className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] hover:bg-[#faf6ef]"
              >
                →
              </button>
            </div>

            <div className="flex justify-start xl:justify-self-end">
              <button
                type="button"
                onClick={openGenericCreate}
                className="cursor-pointer rounded-xl bg-[#314835] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3b563f]"
              >
                Nouvelle réservation
              </button>
            </div>
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
                gridTemplateColumns: `220px repeat(${planning.days.length}, minmax(108px, 1fr))`,
              }}
            >
              <div className="sticky left-0 z-10 border-b border-r border-[#ece5d8] bg-[#f8f3ea] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#756f67]">
                Chambres
              </div>

              {planning.days.map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-[#ece5d8] bg-[#f8f3ea] px-2 py-3 text-center"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                    {formatWeekdayHeader(day)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#5f594f]">
                    {formatDayHeader(day)}
                  </p>
                </div>
              ))}

              {planning.rooms.map((room) => {
                const roomBookings = planning.bookings.filter(
                  (booking) => booking.roomId === room.id
                );

                return (
                  <GridRow
                    key={room.id}
                    room={room}
                    days={planning.days}
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
      <div className="sticky left-0 z-10 border-b border-r border-[#ece5d8] bg-white px-4 py-3">
        <p className="text-lg font-semibold text-[#1e1e1e]">{room.number}</p>
        <p className="text-sm text-[#6c675f]">
          {room.roomTypeName ?? "—"} • étage {room.floor}
        </p>
      </div>

      {days.map((day) => {
        const booking = bookings.find((item) =>
          isDayInsideBooking(day, item.startDate, item.endDate)
        );

        if (booking) {
          const isBookingStart = isSameDay(day, booking.startDate);
          const bookingClass = getBookingCellClass(
            booking.status,
            isBookingStart
          );

          return (
            <button
              key={`${room.id}-${day}`}
              type="button"
              onClick={() => onSelectBooking(booking.id)}
              className={`cursor-pointer border-b border-r border-[#ece5d8] px-2 py-3 text-left ${bookingClass}`}
            >
              {isBookingStart ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]">
                    {getBookingLabel(booking.status)}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-[#1e1e1e]">
                    {booking.guestName}
                  </p>
                </div>
              ) : null}
            </button>
          );
        }

        return (
          <button
            key={`${room.id}-${day}`}
            type="button"
            onClick={() => onCreateAtCell(day)}
            className="cursor-pointer border-b border-r border-[#ece5d8] bg-white px-2 py-3 transition hover:bg-[#faf6ef]"
          />
        );
      })}
    </>
  );
}

function getBookingCellClass(status: string, isStart: boolean) {
  if (status === "cancelled") {
    return isStart
      ? "bg-[#f2f2f2] hover:bg-[#e7e7e7]"
      : "bg-[#f7f7f7] hover:bg-[#ececec]";
  }

  if (status === "checked_in") {
    return isStart
      ? "bg-[#d8eadc] hover:bg-[#cee2d2]"
      : "bg-[#e7f3ea] hover:bg-[#dcebdd]";
  }

  if (status === "checked_out") {
    return isStart
      ? "bg-[#e9edf5] hover:bg-[#dde4f0]"
      : "bg-[#f1f4f9] hover:bg-[#e7ecf5]";
  }

  if (status === "pending") {
    return isStart
      ? "bg-[#f3ead5] hover:bg-[#eadfc6]"
      : "bg-[#f8f1e2] hover:bg-[#f0e8d8]";
  }

  return isStart
    ? "bg-[#dfeee3] hover:bg-[#d3e7d9]"
    : "bg-[#edf7ef] hover:bg-[#e3f0e6]";
}

function getBookingLabel(status: string) {
  if (status === "checked_in") return "Sur place";
  if (status === "checked_out") return "Terminée";
  if (status === "pending") return "En attente";
  if (status === "cancelled") return "Annulée";
  return "Réservée";
}

function isDayInsideBooking(day: string, startDate: string, endDate: string) {
  const d = stripTime(new Date(day));
  const start = stripTime(new Date(startDate));
  const end = stripTime(new Date(endDate));
  return d >= start && d < end;
}

function isSameDay(a: string, b: string) {
  return stripTime(new Date(a)).getTime() === stripTime(new Date(b)).getTime();
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getTodayInputDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
}

function addDaysToInputDate(input: string, days: number) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatWeekdayHeader(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
  });
}

function formatDayHeader(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatRangeLabel(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

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
