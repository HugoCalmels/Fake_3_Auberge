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

const VISIBLE_DAYS = 10;
const NAV_STEP_DAYS = VISIBLE_DAYS - 1;
const FETCH_PADDING_DAYS = 45;
const PLANNING_RANGE_STORAGE_KEY = "admin-planning-range-start";
const PLANNING_ALERTS_STORAGE_KEY = "admin-planning-show-alerts";

const CHECKIN_WARNING_HOUR = 18;
const CHECKOUT_WARNING_HOUR = 12;

const GRID_BORDER = "border-[#d8ccba]";
const DEFAULT_CELL_BORDER = `border-b border-r ${GRID_BORDER}`;
const PAST_CELL_BORDER = "border-b border-r border-[#c8bba8]";

const TODAY_CELL_BG = "bg-[#d2e0cf]";
const TODAY_CELL_BORDER = "border-b border-r border-[#abc1a9]";
const TODAY_CELL_HOVER = "hover:bg-[#bed3ba]";
const FUTURE_CELL_HOVER = "hover:bg-[#eadfcd]";

const ROOM_COL_WIDTH = 150;
const DAY_MIN_WIDTH = 0;
const ROW_HEIGHT = 58;
const CONTINUED_BOOKING_OVERFLOW_PX = 36;

const STATUS_HELP_ITEMS = [
  {
    color: "bg-[#3F51B5]",
    label: "Réservée",
    description: "Réservation confirmée, client attendu.",
  },
  {
    color: "bg-[#0B8043]",
    label: "Arrivé / check-in",
    description: "Client marqué comme arrivé dans l’établissement.",
  },
  {
    color: "bg-[#616161]",
    label: "Parti / check-out",
    description: "Client marqué comme parti, séjour clôturé.",
  },
  {
    color: "bg-[#F4511E]",
    label: "Pas venu",
    description: "Client marqué comme no-show.",
  },
];

const ALERT_HELP_ITEMS = [
  {
    label: "Arrivée non faite",
    description: `Réservation confirmée, arrivée aujourd’hui, mais client pas marqué arrivé après ${CHECKIN_WARNING_HOUR}h00.`,
  },
  {
    label: "Arrivée dépassée",
    description:
      "Date d’arrivée passée, mais réservation toujours confirmée.",
  },
  {
    label: "Départ non fait",
    description: `Client arrivé, départ aujourd’hui, mais pas marqué parti après ${CHECKOUT_WARNING_HOUR}h00.`,
  },
  {
    label: "Départ dépassé",
    description: "Date de départ passée, mais client toujours marqué arrivé.",
  },
  {
    label: "Pending urgent",
    description:
      "Réservation en attente avec une arrivée prévue aujourd’hui ou déjà passée.",
  },
  {
    label: "Incohérence métier",
    description:
      "Exemple : client marqué arrivé alors que sa date d’arrivée est encore future.",
  },
];

export default function AdminReservationPlanningView({
  rooms = [],
  roomTypes = [],
  onSelectBooking,
  refreshKey,
}: Props) {
  const today = getTodayInputDate();

  const [rangeStart, setRangeStart] = useState(() => {
    if (typeof window === "undefined") {
      return today;
    }

    const savedRangeStart = window.sessionStorage.getItem(
      PLANNING_RANGE_STORAGE_KEY,
    );

    return savedRangeStart || today;
  });

  const [planning, setPlanning] = useState<AdminPlanningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createRoomId, setCreateRoomId] = useState("");
  const [lockRoom, setLockRoom] = useState(false);
  const [showAlerts, setShowAlerts] = useState(() => {
    if (typeof window === "undefined") return false;

    return (
      window.sessionStorage.getItem(PLANNING_ALERTS_STORAGE_KEY) === "true"
    );
  });

  useEffect(() => {
    window.sessionStorage.setItem(PLANNING_RANGE_STORAGE_KEY, rangeStart);
  }, [rangeStart]);

  useEffect(() => {
    window.sessionStorage.setItem(
      PLANNING_ALERTS_STORAGE_KEY,
      String(showAlerts),
    );
  }, [showAlerts]);

  const visibleDays = useMemo(
    () =>
      Array.from({ length: VISIBLE_DAYS }, (_, index) =>
        addDaysToInputDate(rangeStart, index),
      ),
    [rangeStart],
  );

  const rangeEnd = visibleDays[visibleDays.length - 1];

  const sortedPlanningRooms = useMemo(() => {
    if (!planning) return [];

    return [...planning.rooms].sort(compareRoomsByNumber);
  }, [planning]);

  const fetchStart = useMemo(
    () => addDaysToInputDate(rangeStart, -FETCH_PADDING_DAYS),
    [rangeStart],
  );

  const fetchEnd = useMemo(() => addDaysToInputDate(rangeEnd, 1), [rangeEnd]);

  const visibleAlertCount = useMemo(() => {
    if (!planning) return 0;

    return (planning.bookings ?? []).filter(
      (booking) =>
        normalizeInputDate(booking.startDate) < fetchEnd &&
        normalizeInputDate(booking.endDate) > rangeStart &&
        Boolean(getBookingWarningReason(booking)),
    ).length;
  }, [fetchEnd, planning, rangeStart]);

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

  function handleSelectBooking(bookingId: string) {
    if (typeof onSelectBooking === "function") {
      onSelectBooking(bookingId);
    }
  }

  async function handleCreated() {
    await loadPlanning();
    setCreateOpen(false);
  }

  return (
    <>
      <section className="w-full overflow-hidden rounded-[22px] border border-[#cfc2ad] bg-white shadow-sm">
        <div className="border-b border-[#d8ccba] bg-white px-3 py-2">
          <div className="mb-3">
            <h2 className="text-2xl font-semibold text-[#1e1e1e]">Planning</h2>
          </div>

          <div className="flex flex-col gap-2 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center">
            <div className="text-sm text-[#6c675f] xl:justify-self-start">
              {formatRangeLabel(rangeStart, rangeEnd)}
            </div>

            <div className="flex items-center justify-start gap-2 xl:justify-self-center">
              <button
                type="button"
                onClick={() =>
                  setRangeStart((prev) =>
                    addDaysToInputDate(prev, -NAV_STEP_DAYS),
                  )
                }
                className="cursor-pointer rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#eee6da]"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => setRangeStart(today)}
                className="cursor-pointer rounded-full border border-[#d8d0c2] bg-white px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#eee6da]"
              >
                Aujourd’hui
              </button>

              <button
                type="button"
                onClick={() =>
                  setRangeStart((prev) =>
                    addDaysToInputDate(prev, NAV_STEP_DAYS),
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

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6c675f]">
            <LegendItem color="bg-[#3F51B5]" label="Réservée" />
            <LegendItem color="bg-[#0B8043]" label="Arrivé / check-in" />
            <LegendItem color="bg-[#616161]" label="Parti / check-out" />
            <LegendItem color="bg-[#F4511E]" label="Pas venu" />

            <button
              type="button"
              onClick={() => setShowAlerts((prev) => !prev)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border px-2 py-1 text-xs transition ${
                showAlerts
                  ? "border-[#D9A520] bg-[#fff7dc] text-[#8a6500]"
                  : "border-[#d8d0c2] bg-white text-[#6c675f] hover:border-[#bfae96] hover:bg-[#f4f0e8] hover:text-[#314835]"
              }`}
              title="Afficher ou masquer les réservations à vérifier"
            >
              <span className="h-3.5 w-3.5 rounded-[4px] bg-[#F6BF26]" />
              <span>À vérifier {visibleAlertCount > 0 ? `(${visibleAlertCount})` : ""}</span>
            </button>

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
              className="grid w-full"
              style={{
                gridTemplateColumns: `${ROOM_COL_WIDTH}px minmax(0, 1fr)`,
              }}
            >
              <div className="sticky left-0 z-20 border-b border-r border-[#d8ccba] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#756f67]">
                Chambres
              </div>

              <div
                className="grid border-b border-[#d8ccba] bg-white"
                style={{
                  gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
                }}
              >
                {visibleDays.map((day, index) => {
                  const isLastColumn = index === visibleDays.length - 1;

                  return (
                    <div
                      key={day}
                      className={`px-1 py-2 text-center ${
                        isLastColumn ? "" : "border-r border-[#d8ccba]"
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
              </div>

              {sortedPlanningRooms.map((room) => {
                const roomBookings = (planning.bookings ?? []).filter(
                  (booking) => booking.roomId === room.id,
                );

                return (
                  <GridRow
                    key={room.id}
                    room={room}
                    days={visibleDays}
                    today={today}
                    bookings={roomBookings}
                    roomTypes={roomTypes}
                    showAlerts={showAlerts}
                    onSelectBooking={handleSelectBooking}
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
        rooms={rooms ?? []}
        roomTypes={roomTypes ?? []}
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
  bookings = [],
  roomTypes = [],
  showAlerts,
  onSelectBooking,
  onCreateAtCell,
}: {
  room: AdminPlanningResponse["rooms"][number];
  days: string[];
  today: string;
  bookings?: AdminPlanningResponse["bookings"];
  roomTypes?: AdminRoomTypeDto[];
  showAlerts: boolean;
  onSelectBooking: (bookingId: string) => void;
  onCreateAtCell: (day: string) => void;
}) {
  const visibleStart = days[0];
  const visibleEndExclusive = addDaysToInputDate(days[days.length - 1], 1);

  const visibleBookings = bookings.filter(
    (booking) =>
      normalizeInputDate(booking.startDate) < visibleEndExclusive &&
      normalizeInputDate(booking.endDate) > visibleStart,
  );

  const roomNightPrice = getRoomNightPriceLabel(room, roomTypes);

  return (
    <>
      <div
        className="sticky left-0 z-20 border-b border-r border-[#d8ccba] bg-white px-3 py-2"
        style={{ minHeight: ROW_HEIGHT }}
      >
        <p className="text-lg font-semibold text-[#1e1e1e]">{room.number}</p>
        <p className="text-sm text-[#6c675f]">{room.roomTypeName ?? "—"}</p>
        {roomNightPrice ? (
          <p className="mt-0.5 text-xs font-medium text-[#8a7a62]">
            {roomNightPrice}
          </p>
        ) : null}
      </div>

      <div
        className="relative overflow-hidden"
        style={{ minHeight: ROW_HEIGHT }}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          const bookingButton = target.closest("[data-booking-id]");

          if (bookingButton) return;

          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const dayIndex = clamp(
            Math.floor((x / rect.width) * days.length),
            0,
            days.length - 1,
          );
          const day = days[dayIndex];

          if (!day) return;

          const bookingAtCell = bookings.find((booking) =>
            isDayInsideBooking(day, booking.startDate, booking.endDate),
          );

          if (bookingAtCell && typeof onSelectBooking === "function") {
            onSelectBooking(bookingAtCell.id);
            return;
          }

          if (typeof onCreateAtCell === "function") {
            onCreateAtCell(day);
          }
        }}
      >
        <div
          className="absolute inset-0 z-0 grid"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          {days.map((day, index) => {
            const isPast = isPastDay(day);
            const isToday = day === today;
            const isLastColumn = index === days.length - 1;

            return (
              <div
                key={`${room.id}-${day}`}
                className={`relative z-0 min-h-[58px] cursor-pointer transition ${
                  isPast
                    ? `${PAST_CELL_BORDER} bg-[#e8e8e8] hover:bg-[#dddddd]`
                    : isToday
                      ? `${TODAY_CELL_BORDER} ${TODAY_CELL_BG} ${TODAY_CELL_HOVER}`
                      : `${DEFAULT_CELL_BORDER} bg-white ${FUTURE_CELL_HOVER}`
                } ${isLastColumn ? "border-r-0" : ""}`}
              />
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 z-30">
          {visibleBookings.map((booking) => {
            const placement = getBookingPlacement(
              booking.startDate,
              booking.endDate,
              visibleStart,
              days.length,
            );

            const warningReason = getBookingWarningReason(booking);
            const hasDateWarning = Boolean(warningReason);
            const displayAlert = showAlerts && hasDateWarning;
            const colors = displayAlert
              ? getAlertBookingColors()
              : getBookingColors(booking.status);
            const paymentStatus = getBookingPaymentStatus(booking);

            const startsBeforeVisible =
              normalizeInputDate(booking.startDate) < visibleStart;

            const endsAfterVisible =
              getBookingRightUnits(booking.endDate, visibleStart) > days.length;

            return (
              <button
                key={booking.id}
                type="button"
                data-booking-id={booking.id}
                onMouseDownCapture={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClickCapture={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (typeof onSelectBooking === "function") {
                    onSelectBooking(booking.id);
                  }
                }}
                className="group pointer-events-auto absolute top-[5px] bottom-[5px] z-10 cursor-pointer overflow-visible px-0 text-left text-white transition hover:z-20"
                style={{
                  left:
                    startsBeforeVisible && endsAfterVisible
                      ? `calc(${placement.leftPercent}% - ${CONTINUED_BOOKING_OVERFLOW_PX}px)`
                      : startsBeforeVisible
                        ? `calc(${placement.leftPercent}% - ${CONTINUED_BOOKING_OVERFLOW_PX}px)`
                        : `calc(${placement.leftPercent}% + 10px)`,
                  width:
                    startsBeforeVisible && endsAfterVisible
                      ? `calc(${placement.widthPercent}% + ${CONTINUED_BOOKING_OVERFLOW_PX * 2}px)`
                      : startsBeforeVisible
                        ? `calc(${placement.widthPercent}% + ${CONTINUED_BOOKING_OVERFLOW_PX}px)`
                        : endsAfterVisible
                          ? `calc(${placement.widthPercent}% - 10px + ${CONTINUED_BOOKING_OVERFLOW_PX * 2}px)`
                          : `calc(${placement.widthPercent}% - 14px)`,
                }}
                title={
                  warningReason
                    ? `${booking.guestName}\n\n⚠ À vérifier : ${warningReason}`
                    : booking.guestName
                }
              >
                <span className="absolute inset-[-4px] z-0 block" />

                <span
                  className={`pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.16)] transition group-hover:brightness-110 group-hover:shadow-[0_3px_10px_rgba(0,0,0,0.20)] ${colors.card}`}
                  style={{
                    transform: "skewX(-28deg)",
                    transformOrigin: "center",
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                    borderTopRightRadius: 12,
                    borderBottomRightRadius: 12,
                  }}
                >
                  <span
                    className={`absolute inset-x-0 bottom-0 h-[12px] ${
                      paymentStatus === "unpaid"
                        ? colors.paymentUnpaid
                        : colors.paymentPaid
                    }`}
                  />
                </span>

                {displayAlert ? (
                  <>
                    <span
                      className="pointer-events-none absolute inset-[-2px] z-20 rounded-[14px] border-2 border-[#F6BF26]"
                      style={{
                        transform: "skewX(-28deg)",
                        transformOrigin: "center",
                        borderTopLeftRadius: 14,
                        borderBottomLeftRadius: 14,
                        borderTopRightRadius: 14,
                        borderBottomRightRadius: 14,
                      }}
                    />

                  </>
                ) : null}

                <span className="pointer-events-none absolute inset-x-0 top-0 bottom-[12px] z-20 flex items-center justify-center px-3 text-center">
                  <span className="max-w-full truncate text-[12px] font-semibold leading-4 text-white">
                    {booking.guestName}
                  </span>
                </span>

                <span className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[12px] items-center justify-center px-2 text-[7.5px] font-semibold uppercase leading-[12px] tracking-[0.08em] text-white">
                  {paymentStatus === "unpaid" ? "Non payé" : "Payé"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function compareRoomsByNumber(
  a: AdminPlanningResponse["rooms"][number],
  b: AdminPlanningResponse["rooms"][number],
) {
  const aParsed = parseRoomNumber(a.number);
  const bParsed = parseRoomNumber(b.number);

  if (aParsed.numeric !== bParsed.numeric) {
    return aParsed.numeric - bParsed.numeric;
  }

  return aParsed.suffix.localeCompare(bParsed.suffix, "fr-FR", {
    numeric: true,
    sensitivity: "base",
  });
}

function parseRoomNumber(value: string) {
  const cleanValue = value.trim();
  const match = cleanValue.match(/^(\d+)(.*)$/);

  if (!match) {
    return {
      numeric: Number.MAX_SAFE_INTEGER,
      suffix: cleanValue,
    };
  }

  return {
    numeric: Number(match[1]),
    suffix: match[2] ?? "",
  };
}

function getRoomNightPriceLabel(
  room: AdminPlanningResponse["rooms"][number],
  roomTypes: AdminRoomTypeDto[],
) {
  const extendedRoom = room as AdminPlanningResponse["rooms"][number] & {
    roomTypeId?: string | null;
    roomTypeCode?: string | null;
    basePrice?: number | null;
    roomTypeBasePrice?: number | null;
  };

  const directPrice =
    typeof extendedRoom.basePrice === "number"
      ? extendedRoom.basePrice
      : typeof extendedRoom.roomTypeBasePrice === "number"
        ? extendedRoom.roomTypeBasePrice
        : null;

  if (directPrice !== null) {
    return formatNightPrice(directPrice);
  }

  const matchedRoomType = roomTypes.find((roomType) => {
    const typedRoomType = roomType as AdminRoomTypeDto & {
      code?: string | null;
    };

    return (
      roomType.id === extendedRoom.roomTypeId ||
      typedRoomType.code === extendedRoom.roomTypeCode ||
      roomType.name === room.roomTypeName
    );
  });

  if (!matchedRoomType || typeof matchedRoomType.basePrice !== "number") {
    return null;
  }

  return formatNightPrice(matchedRoomType.basePrice);
}

function formatNightPrice(value: number) {
  return `${value.toLocaleString("fr-FR")} € / nuit`;
}

function getBookingPlacement(
  startDate: string,
  endDate: string,
  visibleStart: string,
  visibleDaysCount: number,
) {
  const startDiff = differenceInCalendarDays(
    inputDateToLocalDate(startDate),
    inputDateToLocalDate(visibleStart),
  );

  const endDiff = differenceInCalendarDays(
    inputDateToLocalDate(endDate),
    inputDateToLocalDate(visibleStart),
  );

  const rawLeftUnits = startDiff + 0.5;
  const rawRightUnits = endDiff + 0.5;

  const leftUnits = clamp(rawLeftUnits, 0, visibleDaysCount);
  const rightUnits = clamp(rawRightUnits, 0, visibleDaysCount);

  const leftPercent = (leftUnits / visibleDaysCount) * 100;
  const widthPercent =
    (Math.max(0.35, rightUnits - leftUnits) / visibleDaysCount) * 100;

  return {
    leftPercent,
    widthPercent,
  };
}

function getBookingRightUnits(endDate: string, visibleStart: string) {
  return (
    differenceInCalendarDays(
      inputDateToLocalDate(endDate),
      inputDateToLocalDate(visibleStart),
    ) + 0.5
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
        aria-label="Comprendre les alertes du planning"
      >
        ?
      </button>

      <div className="pointer-events-none absolute left-1/2 top-7 z-50 hidden w-[330px] -translate-x-1/2 rounded-2xl border border-[#d8ccba] bg-white p-3 text-left text-xs text-[#5f5a52] shadow-[0_14px_34px_rgba(0,0,0,0.16)] group-hover:block">
        <p className="text-sm font-semibold text-[#1e1e1e]">
          À quoi sert “À vérifier” ?
        </p>

        <p className="mt-1.5 leading-4">
          Ce n’est <strong>pas un statut</strong>. C’est un filtre pour repérer
          les réservations qui demandent une action du gérant.
        </p>

        <div className="mt-3 space-y-1.5 leading-4">
          <p>
            <strong>Arrivée :</strong> client pas marqué arrivé après{" "}
            <strong>{CHECKIN_WARNING_HOUR}h</strong>.
          </p>
          <p>
            <strong>Départ :</strong> client pas marqué parti après{" "}
            <strong>{CHECKOUT_WARNING_HOUR}h</strong>.
          </p>
          <p>
            <strong>Retard :</strong> arrivée ou départ déjà dépassé.
          </p>
          <p>
            <strong>Pending :</strong> réservation en attente qui arrive
            aujourd’hui ou avant.
          </p>
          <p>
            <strong>Incohérence :</strong> état impossible à vérifier
            manuellement.
          </p>
        </div>

        <div className="mt-3 rounded-xl bg-[#fff7dc] p-2.5 leading-4 text-[#6a4f00]">
          Active le bouton <strong>À vérifier</strong> pour colorer ces
          réservations en jaune dans le planning.
        </div>
      </div>
    </div>
  );
}


function differenceInCalendarDays(a: Date, b: Date) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.round((utcA - utcB) / 86_400_000);
}

function getAlertBookingColors() {
  return {
    card: "border-[#D9A520] bg-[#D9A520] hover:bg-[#C89316]",
    paymentPaid: "bg-[#8A6500]",
    paymentUnpaid: "bg-[#A85F12]",
  };
}

function getBookingColors(status: string) {
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
  const now = new Date();
  const today = stripTime(now);
  const currentHour = now.getHours();

  const start = inputDateToLocalDate(booking.startDate);
  const end = inputDateToLocalDate(booking.endDate);

  const startsToday = isSameCalendarDay(start, today);
  const endsToday = isSameCalendarDay(end, today);

  if (booking.status === "checked_in" && start > today) {
    return "Action attendue : vérifier les dates ou remettre en Réservée.";
  }

  if (booking.status === "pending" && start <= today) {
    return "Action attendue : confirmer ou annuler.";
  }

  if (
    booking.status === "confirmed" &&
    startsToday &&
    currentHour >= CHECKIN_WARNING_HOUR
  ) {
    return "Action attendue : marquer Arrivé ou Pas venu.";
  }

  if (booking.status === "confirmed" && start < today) {
    return "Action attendue : marquer Arrivé ou Pas venu.";
  }

  if (
    booking.status === "checked_in" &&
    endsToday &&
    currentHour >= CHECKOUT_WARNING_HOUR
  ) {
    return "Action attendue : marquer Parti.";
  }

  if (booking.status === "checked_in" && end < today) {
    return "Action attendue : marquer Parti.";
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

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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


function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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