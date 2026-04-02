import { useMemo, useState } from "react";
import { createBooking, getBookingAvailability } from "@/features/booking/api/bookings.api";
import {
  DEFAULT_BOOKING_SEARCH,
  type RoomAvailability,
  type SelectedRoomLine,
} from "@/features/booking/types";
import { getNights } from "@/features/booking/lib/pricing";

export type BookingStep = 1 | 2 | 3;

export function useBookingFlow() {
  const [step, setStep] = useState<BookingStep>(1);
  const [startDate, setStartDate] = useState<string | null>(DEFAULT_BOOKING_SEARCH.startDate);
  const [endDate, setEndDate] = useState<string | null>(DEFAULT_BOOKING_SEARCH.endDate);
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [selectedRooms, setSelectedRooms] = useState<SelectedRoomLine[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

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
      ...Array.from(unique.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [availability]);

  const totalPrice = useMemo(() => {
    return selectedRooms.reduce((sum, room) => sum + room.totalPrice, 0);
  }, [selectedRooms]);

  const canGoNext =
    (step === 1 && Boolean(startDate && endDate && nights > 0)) ||
    (step === 2 && selectedRooms.length > 0) ||
    step === 3;

  const primarySelectedRoom = useMemo(() => {
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

  async function loadAvailability() {
    if (!startDate || !endDate) return;

    try {
      setIsLoadingAvailability(true);
      setAvailabilityError("");
      setSelectedRooms([]);
      setRoomTypeFilter("all");

      const response = await getBookingAvailability({ startDate, endDate });
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

  function addRoom(room: SelectedRoomLine) {
    setSelectedRooms((prev) => [...prev, room]);
  }

  function removeRoom(lineId: string) {
    setSelectedRooms((prev) => prev.filter((room) => room.lineId !== lineId));
  }

  async function submitBooking(closeBooking: () => void) {
    if (!startDate || !endDate || selectedRooms.length === 0) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
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

  function goNext() {
    if (step === 1) {
      loadAvailability();
      return;
    }
    setStep((prev) => (prev === 2 ? 3 : 3));
  }

  function goBack() {
    setStep((prev) => (prev === 3 ? 2 : prev === 2 ? 1 : 1));
  }

  function selectDate(value: string) {
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
    availability:
      step === 2 || step === 1
        ? filteredOffers
        : availability,
    availabilityError,
    isLoadingAvailability,
    selectedRooms,
    guestName,
    guestEmail,
    submitError,
    isSubmitting,
    totalPrice,
    primarySelectedRoom,
    canGoNext,
    setRoomTypeFilter,
    setGuestName,
    setGuestEmail,
    selectDate,
    loadAvailability,
    addRoom,
    removeRoom,
    submitBooking,
    goNext,
    goBack,
  };
}
