"use client";

import { useEffect, useMemo, useState } from "react";
import BookingStepBar from "./BookingStepBar";
import BookingDateStep from "./BookingDateStep";
import BookingPaymentStep from "./BookingPaymentStep";
import BookingRoomsStep from "./BookingRoomStep";
import { createBooking, getBookingAvailability } from "@/src/services/api/bookings.api";
import {
  DEFAULT_BOOKING_SEARCH,
  type RoomAvailability,
  type SelectedRoomConfig,
  type SelectedRoomLine,
} from "@/src/services/booking/booking.types";
import { getNights } from "@/src/services/booking/pricing.service";

export type BookingStep = 1 | 2 | 3;

export default function BookingModal({
  closeBooking,
}: {
  closeBooking: () => void;
}) {
  const [step, setStep] = useState<BookingStep>(1);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [startDate, setStartDate] = useState<string | null>(
    DEFAULT_BOOKING_SEARCH.startDate,
  );
  const [endDate, setEndDate] = useState<string | null>(
    DEFAULT_BOOKING_SEARCH.endDate,
  );

  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [selectedRooms, setSelectedRooms] = useState<SelectedRoomLine[]>([]);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBooking();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeBooking]);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return getNights(startDate, endDate);
  }, [startDate, endDate]);

  const filteredOffers = useMemo(() => {
    if (roomTypeFilter === "all") return availability;
    return availability.filter((offer) => offer.code === roomTypeFilter);
  }, [availability, roomTypeFilter]);

  const roomTypeOptions = useMemo(() => {
    const unique = new Map<string, string>();

    for (const offer of availability) {
      unique.set(offer.code, offer.name);
    }

    return [
      { value: "all", label: "Toutes les chambres" },
      ...Array.from(unique.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [availability]);

  const totalPrice = useMemo(() => {
    return selectedRooms.reduce((sum, room) => sum + room.totalPrice, 0);
  }, [selectedRooms]);

  const canGoNext =
    (step === 1 && Boolean(startDate && endDate && nights > 0)) ||
    (step === 2 && selectedRooms.length > 0) ||
    step === 3;

  const primarySelectedRoom = useMemo<SelectedRoomConfig | null>(() => {
    const first = selectedRooms[0];
    if (!first) return null;

    return {
      id: first.lineId,
      offerId: first.offerId,
      roomName: first.roomName,
      persons: first.persons,
      roomPrice: first.totalPrice,
      mealPlans: first.mealPlans,
      mealPlanCode: first.mealPlanCode,
    };
  }, [selectedRooms]);

  async function handleLoadAvailability() {
    if (!startDate || !endDate) return;

    try {
      setIsLoadingAvailability(true);
      setAvailabilityError("");
      setSelectedRooms([]);
      setRoomTypeFilter("all");

      const response = await getBookingAvailability({
        startDate,
        endDate,
      });

      setAvailability(response.roomTypes);
      setStep(2);
    } catch (error) {
      setAvailability([]);
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : "Impossible de charger les disponibilités.",
      );
    } finally {
      setIsLoadingAvailability(false);
    }
  }

  function handleAddRoom(room: SelectedRoomLine) {
    setSelectedRooms((prev) => [...prev, room]);
  }

  function handleRemoveRoom(lineId: string) {
    setSelectedRooms((prev) => prev.filter((room) => room.lineId !== lineId));
  }

  async function handleSubmitBooking() {
    if (!startDate || !endDate || selectedRooms.length === 0) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      await createBooking({
        startDate,
        endDate,
        guestName,
        guestEmail,
        selections: selectedRooms.map((room) => ({
          roomTypeId: room.offerId,
          adults: room.adults,
          children: room.children,
          mealPlanCode: room.mealPlanCode,
        })),
      });

      closeBooking();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la réservation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goNext() {
    if (step === 1) {
      await handleLoadAvailability();
      return;
    }

    setStep((prev) => {
      if (prev === 2) return 3;
      return 3;
    });
  }

  function goBack() {
    setStep((prev) => {
      if (prev === 3) return 2;
      if (prev === 2) return 1;
      return 1;
    });
  }

  function handlePrevMonth() {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }

  function handleNextMonth() {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  function handleToday() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function handleSelectDate(value: string) {
    if (!startDate) {
      setStartDate(value);
      setEndDate(null);
      setSelectedRooms([]);
      return;
    }

    if (!endDate) {
      if (new Date(value) <= new Date(startDate)) {
        setStartDate(value);
        setEndDate(null);
        setSelectedRooms([]);
        return;
      }

      setEndDate(value);
      setSelectedRooms([]);
      return;
    }

    setStartDate(value);
    setEndDate(null);
    setSelectedRooms([]);
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
      onClick={closeBooking}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="w-[min(980px,94vw)] rounded-[28px] border border-[#d8d0c2] bg-[#f4f0e8] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-[#e1d9cd] px-6 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
                Réservation
              </p>
              <h2 className="mt-2 text-[24px] font-semibold leading-none text-[#1e1e1e]">
                {step === 1 && "1. Dates du séjour"}
                {step === 2 && "2. Chambres"}
                {step === 3 && "3. Paiement"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeBooking}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d0c3] text-[20px] leading-none text-[#2d2c29] transition hover:bg-[#ece6dc]"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="px-6 pt-4">
            <div className="mx-auto w-full max-w-[860px]">
              <BookingStepBar step={step} />
            </div>
          </div>

          <div className="h-[640px] overflow-hidden px-6 py-5">
            <div className="mx-auto h-full w-full max-w-[860px]">
              {step === 1 && (
                <BookingDateStep
                  visibleMonth={visibleMonth}
                  startDate={startDate ?? ""}
                  endDate={endDate ?? ""}
                  nights={nights}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onToday={handleToday}
                  onSelectDate={handleSelectDate}
                />
              )}

              {step === 2 && (
                <>
                  {isLoadingAvailability ? (
                    <div className="rounded-[22px] border border-[#d8d0c2] bg-white p-5 text-[14px] text-[#5f584d] shadow-sm">
                      Chargement des disponibilités...
                    </div>
                  ) : availabilityError ? (
                    <div className="rounded-[22px] border border-[#e6c8c8] bg-white p-5 text-[14px] text-[#8c3b3b] shadow-sm">
                      {availabilityError}
                    </div>
                  ) : (
                    <BookingRoomsStep
                      startDate={startDate ?? ""}
                      endDate={endDate ?? ""}
                      roomTypeFilter={roomTypeFilter}
                      roomTypeOptions={roomTypeOptions}
                      offers={filteredOffers}
                      selectedRooms={selectedRooms}
                      onChangeRoomTypeFilter={setRoomTypeFilter}
                      onAddRoom={handleAddRoom}
                      onRemoveRoom={handleRemoveRoom}
                    />
                  )}
                </>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  {submitError ? (
                    <div className="rounded-[14px] border border-[#e6c8c8] bg-white px-4 py-3 text-[14px] text-[#8c3b3b]">
                      {submitError}
                    </div>
                  ) : null}

                  <BookingPaymentStep
                    startDate={startDate ?? ""}
                    endDate={endDate ?? ""}
                    nights={nights}
                    selectedRoom={primarySelectedRoom}
                    roomSubtotal={totalPrice}
                    supplementsTotal={0}
                    totalPrice={totalPrice}
                    guestName={guestName}
                    guestEmail={guestEmail}
                    onGuestNameChange={setGuestName}
                    onGuestEmailChange={setGuestEmail}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#e1d9cd] px-6 py-5">
            <div className="min-w-0 flex-1 pr-4">
              {startDate && endDate && nights > 0 ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] leading-6 text-[#4f4a43]">
                  <span>
                    Séjour : {formatShortDate(startDate)} → {formatShortDate(endDate)} ·{" "}
                    {nights} nuit{nights > 1 ? "s" : ""}
                  </span>
                  <span className="text-[#a79d8d]">—</span>
                  <span>
                    Prix total :{" "}
                    <span className="font-semibold text-[#1e1e1e]">
                      {totalPrice} €
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-[14px] text-[#6c675f]">
                  Sélectionnez vos dates pour continuer
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-xl border border-[#d8d0c2] bg-white px-5 py-3 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
                >
                  Retour
                </button>
              ) : null}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext || isLoadingAvailability}
                  className="rounded-xl bg-[#314835] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2a3d2d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step === 1 && isLoadingAvailability ? "Chargement..." : "Continuer"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={!guestName || !guestEmail || isSubmitting || selectedRooms.length === 0}
                  className="rounded-xl bg-[#314835] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2a3d2d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Envoi..." : "Payer"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}