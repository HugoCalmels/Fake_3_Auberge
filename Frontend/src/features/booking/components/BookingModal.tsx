"use client";

import { useEffect, useState } from "react";
import BookingStepBar from "./BookingStepBar";
import BookingDateStep from "./BookingDateStep";
import BookingPaymentStep from "./BookingPaymentStep";
import BookingRoomsStep from "./BookingRoomStep";
import BookingSuccessStep from "./BookingSuccessStep";
import { useBookingFlow } from "@/features/booking/hooks/useBookingFlow";
import { formatShortDate } from "@/features/booking/booking.utils";

export default function BookingModal({
  closeBooking,
}: {
  closeBooking: () => void;
}) {
  const {
    step,
    startDate,
    endDate,
    nights,
    roomTypeFilter,
    roomTypeOptions,
    availability,
    availabilityError,
    isLoadingAvailability,
    selectedRooms,
    guestName,
    guestEmail,
    guestPhone,
    paymentMethod,
    paymentSubmitTrigger,
    paymentSuccessIntentId,
    submitError,
    isSubmitting,
    totalPrice,
    totalPersons,
    canGoNext,
    canSubmit,
    setRoomTypeFilter,
    setGuestName,
    setGuestEmail,
    setGuestPhone,
    setPaymentMethod,
    setPaymentReady,
    selectDate,
    addRoom,
    removeRoom,
    submitBooking,
    handlePaymentSuccess,
    handlePaymentError,
    goNext,
    goBack,
  } = useBookingFlow();

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const isSuccessStep = step === 4;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBooking();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeBooking]);

  const handlePrevMonth = () => {
    setVisibleMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setVisibleMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  };

  const handleToday = () => {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
<div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-[2px]">
      <div className="flex justify-center px-3 py-3 sm:min-h-screen sm:items-center sm:p-4">
        <div
          className="w-full max-w-[375px] overflow-hidden border border-[#d8d0c2] bg-[#f4f0e8] shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:w-[min(980px,94vw)] sm:max-w-none sm:rounded-[28px]"
    
        >
          <div className="flex items-start justify-between border-b border-[#e1d9cd] px-4 py-3 sm:px-6 sm:py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a9184] sm:text-[11px]">
                Réservation
              </p>

              <h2 className="mt-1.5 text-[22px] font-semibold leading-none text-[#1e1e1e] sm:mt-2 sm:text-[24px]">
                {step === 1
                  ? "1. Dates du séjour"
                  : step === 2
                    ? "2. Chambres"
                    : step === 3
                      ? "3. Paiement"
                      : "Réservation confirmée"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeBooking}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8d0c3] text-[18px] leading-none text-[#2d2c29] transition hover:bg-[#ece6dc] sm:h-10 sm:w-10 sm:text-[20px]"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="px-4 pt-3 sm:px-6 sm:pt-4">
            <div className="mx-auto w-full max-w-[860px]">
              {isSuccessStep ? (
                <div className="h-[28px] sm:h-[35px]" />
              ) : (
                <BookingStepBar step={step} />
              )}
            </div>
          </div>

          <div className="px-4 py-3 sm:h-[640px] sm:overflow-hidden sm:px-6 sm:py-5">
            <div className="mx-auto w-full max-w-[860px] sm:h-full">
              {step === 1 ? (
                <BookingDateStep
                  visibleMonth={visibleMonth}
                  startDate={startDate ?? ""}
                  endDate={endDate ?? ""}
                  nights={nights}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onToday={handleToday}
                  onSelectDate={selectDate}
                />
              ) : null}

              {step === 2 ? (
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
                      offers={availability}
                      selectedRooms={selectedRooms}
                      onChangeRoomTypeFilter={setRoomTypeFilter}
                      onAddRoom={addRoom}
                      onRemoveRoom={removeRoom}
                    />
                  )}
                </>
              ) : null}

              {step === 3 ? (
                <div className="sm:h-full sm:min-h-0">
                  {submitError ? (
                    <div className="mb-4 rounded-[14px] border border-[#e6c8c8] bg-white px-4 py-3 text-[14px] text-[#8c3b3b]">
                      {submitError}
                    </div>
                  ) : null}

                  <BookingPaymentStep
                    startDate={startDate ?? ""}
                    endDate={endDate ?? ""}
                    nights={nights}
                    selectedRooms={selectedRooms}
                    totalPersons={totalPersons}
                    totalPrice={totalPrice}
                    guestName={guestName}
                    guestEmail={guestEmail}
                    guestPhone={guestPhone}
                    paymentMethod={paymentMethod}
                    paymentSubmitTrigger={paymentSubmitTrigger}
                    onGuestNameChange={setGuestName}
                    onGuestEmailChange={setGuestEmail}
                    onGuestPhoneChange={setGuestPhone}
                    onPaymentMethodChange={setPaymentMethod}
                    onPaymentReadyChange={setPaymentReady}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </div>
              ) : null}

              {step === 4 ? (
                <BookingSuccessStep
                  startDate={startDate ?? ""}
                  endDate={endDate ?? ""}
                  nights={nights}
                  selectedRooms={selectedRooms}
                  totalPersons={totalPersons}
                  totalPrice={totalPrice}
                  guestEmail={guestEmail}
                  paymentIntentId={paymentSuccessIntentId}
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#e1d9cd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="min-w-0 flex-1 sm:pr-4">
              {startDate && endDate && nights > 0 ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-5 text-[#4f4a43] sm:text-[15px] sm:leading-6">
                  <span>
                    Séjour : {formatShortDate(startDate)} →{" "}
                    {formatShortDate(endDate)} · {nights} nuit
                    {nights > 1 ? "s" : ""}
                  </span>

                  <span className="hidden text-[#a79d8d] sm:inline">—</span>

                  <span>
                    Prix total :{" "}
                    <span className="font-semibold text-[#1e1e1e]">
                      {totalPrice} €
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-[13px] text-[#6c675f] sm:text-[14px]">
                  Sélectionnez vos dates pour continuer
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
              {isSuccessStep ? (
                <button
                  type="button"
                  onClick={closeBooking}
                  className="rounded-xl bg-[#314835] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a3d2d] sm:px-5 sm:py-3"
                >
                  Fermer
                </button>
              ) : (
                <>
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={isSubmitting}
                      className="rounded-xl border border-[#d8d0c2] bg-white px-4 py-2.5 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3"
                    >
                      Retour
                    </button>
                  ) : null}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canGoNext || isLoadingAvailability}
                      className="rounded-xl bg-[#314835] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a3d2d] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3"
                    >
                      {step === 1 && isLoadingAvailability
                        ? "Chargement..."
                        : "Continuer"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submitBooking}
                      disabled={!canSubmit}
                      className="rounded-xl bg-[#314835] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a3d2d] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3"
                    >
                      {isSubmitting ? "Paiement..." : "Payer"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}