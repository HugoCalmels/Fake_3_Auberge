import { useMemo, useState } from "react";
import {
  getBookingAvailability,
  type BookingPaymentMethod,
} from "@/features/booking/api/bookings.api";
import {
  DEFAULT_BOOKING_SEARCH,
  type RoomAvailability,
  type SelectedRoomLine,
} from "@/features/booking/types";
import { getNights } from "@/features/booking/lib/pricing";

export type BookingStep = 1 | 2 | 3 | 4;

export function useBookingFlow() {
  const [step, setStep] = useState<BookingStep>(1);

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
  const [guestPhone, setGuestPhone] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<BookingPaymentMethod>("card");
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentSubmitTrigger, setPaymentSubmitTrigger] = useState(0);
  const [paymentSuccessIntentId, setPaymentSuccessIntentId] = useState<
    string | null
  >(null);

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const totalPersons = useMemo(() => {
    return selectedRooms.reduce((sum, room) => sum + room.persons, 0);
  }, [selectedRooms]);

  const canGoNext =
    (step === 1 && Boolean(startDate && endDate && nights > 0)) ||
    (step === 2 && selectedRooms.length > 0);

  const canSubmit =
    step === 3 &&
    Boolean(startDate && endDate) &&
    selectedRooms.length > 0 &&
    guestName.trim().length > 1 &&
    guestEmail.trim().length > 3 &&
    paymentReady &&
    !isSubmitting;

  async function loadAvailability() {
    if (!startDate || !endDate) return;

    try {
      setIsLoadingAvailability(true);
      setAvailabilityError("");
      setSelectedRooms([]);
      setPaymentReady(false);
      setSubmitError("");
      setRoomTypeFilter("all");

      const response = await getBookingAvailability({ startDate, endDate });

      setAvailability(
        response.roomTypes.map((roomType) => ({
          ...roomType,
          availableRooms: roomType.availableRooms ?? 0,
          mealPlans: roomType.mealPlans ?? [],
        })),
      );

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

  function addRoom(room: SelectedRoomLine) {
    setSelectedRooms((prev) => [...prev, room]);
    setPaymentReady(false);
  }

  function removeRoom(lineId: string) {
    setSelectedRooms((prev) => prev.filter((room) => room.lineId !== lineId));
    setPaymentReady(false);
  }

  function submitBooking() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError("");
    setPaymentSubmitTrigger((prev) => prev + 1);
  }

  function handlePaymentSuccess(paymentIntentId: string) {
    setPaymentSuccessIntentId(paymentIntentId);
    setSubmitError("");
    setIsSubmitting(false);
    setPaymentReady(false);
    setStep(4);
  }

  function handlePaymentError(message: string) {
    setSubmitError(message);
    setIsSubmitting(false);
  }

  function goNext() {
    if (step === 1) {
      void loadAvailability();
      return;
    }

    if (step === 2) {
      setPaymentReady(false);
      setSubmitError("");
      setStep(3);
    }
  }

  function goBack() {
    setSubmitError("");
    setIsSubmitting(false);

    setStep((prev) => {
      if (prev === 4) return 3;
      if (prev === 3) return 2;
      if (prev === 2) return 1;
      return 1;
    });
  }

  function selectDate(value: string) {
    setPaymentReady(false);
    setSubmitError("");
    setPaymentSuccessIntentId(null);

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

  return {
    step,
    startDate,
    endDate,
    nights,
    roomTypeFilter,
    roomTypeOptions,
    availability: step === 1 || step === 2 ? filteredOffers : availability,
    availabilityError,
    isLoadingAvailability,
    selectedRooms,
    guestName,
    guestEmail,
    guestPhone,
    paymentMethod,
    paymentReady,
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
    loadAvailability,
    addRoom,
    removeRoom,
    submitBooking,
    handlePaymentSuccess,
    handlePaymentError,
    goNext,
    goBack,
  };
}