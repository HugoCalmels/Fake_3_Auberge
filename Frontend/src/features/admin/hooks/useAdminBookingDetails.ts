"use client";

import { useEffect, useMemo, useState } from "react";

import {
  assignAdminBookingRoom,
  cancelAdminBooking,
  getAdminBookingById,
  updateAdminBooking,
} from "@/features/admin/api/adminBookings.api";
import { sortRooms } from "@/features/admin/lib/admin-utils";
import type { MealPlanCode } from "@/features/booking/api/bookings.api";
import type {
  AdminBookingDetailDto,
  AdminBookingStatus,
  AdminPaymentStatus,
  AdminRoomDto,
} from "@/features/admin/types";

export function useAdminBookingDetails(
  bookingId: string,
  rooms: AdminRoomDto[],
) {
  const [booking, setBooking] = useState<AdminBookingDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<AdminBookingStatus>("confirmed");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<AdminPaymentStatus>("unpaid");
  const [paymentNote, setPaymentNote] = useState("");
  const [mealPlanCode, setMealPlanCode] = useState<MealPlanCode>("room_only");

  const [newRoomId, setNewRoomId] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    async function loadBooking() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminBookingById(bookingId);

        setBooking(data);
        setStartDate(toInputDate(data.startDate));
        setEndDate(toInputDate(data.endDate));
        setAdults(String(data.adults));
        setChildren(String(data.children));
        setNotes(data.notes ?? "");
        setStatus(data.status ?? "confirmed");
        setGuestPhone(data.guestPhone ?? "");
        setPaymentStatus(data.paymentStatus ?? "unpaid");
        setPaymentNote(data.paymentNote ?? "");
        setMealPlanCode(data.mealPlanCode ?? "room_only");
        setNewRoomId(data.roomId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger la réservation.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [bookingId]);

  const sortedRooms = useMemo(() => [...rooms].sort(sortRooms), [rooms]);

  const canCancel = useMemo(() => {
    if (!booking) return false;

    const today = stripTime(new Date());
    const bookingEnd = stripTime(new Date(booking.endDate));

    return (
      booking.status !== "cancelled" &&
      booking.status !== "checked_out" &&
      bookingEnd >= today
    );
  }, [booking]);

  const canEdit = useMemo(() => {
    if (!booking) return false;
    return booking.status !== "cancelled";
  }, [booking]);

  async function save(
    onBookingUpdated: (booking: AdminBookingDetailDto) => Promise<void> | void,
  ) {
    if (!booking || booking.status === "cancelled") return false;

    setBusy(true);
    setError("");

    try {
      const updated = await updateAdminBooking(booking.id, {
        startDate,
        endDate,
        adults: Number(adults),
        children: Number(children),
        notes: notes.trim() ? notes.trim() : undefined,
        status,
        guestPhone: guestPhone.trim() ? guestPhone.trim() : undefined,
        paymentStatus,
        paymentNote: paymentNote.trim() ? paymentNote.trim() : undefined,
        mealPlanCode,
      });

      setBooking(updated);
      setStartDate(toInputDate(updated.startDate));
      setEndDate(toInputDate(updated.endDate));
      setAdults(String(updated.adults));
      setChildren(String(updated.children));
      setNotes(updated.notes ?? "");
      setStatus(updated.status ?? "confirmed");
      setGuestPhone(updated.guestPhone ?? "");
      setPaymentStatus(updated.paymentStatus ?? "unpaid");
      setPaymentNote(updated.paymentNote ?? "");
      setMealPlanCode(updated.mealPlanCode ?? "room_only");
      setNewRoomId(updated.roomId);

      await onBookingUpdated(updated);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier la réservation.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function assignRoom(
    onBookingUpdated: (booking: AdminBookingDetailDto) => Promise<void> | void,
  ) {
    if (!booking || !newRoomId || booking.status === "cancelled") return false;

    setBusy(true);
    setError("");

    try {
      const updated = await assignAdminBookingRoom(booking.id, {
        roomId: newRoomId,
      });

      setBooking(updated);
      setStatus(updated.status ?? "confirmed");
      setNewRoomId(updated.roomId);
      setMealPlanCode(updated.mealPlanCode ?? "room_only");

      await onBookingUpdated(updated);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de réassigner la chambre.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function cancel(
    onBookingUpdated: (booking: AdminBookingDetailDto) => Promise<void> | void,
  ) {
    if (!booking || !canCancel) return false;

    setBusy(true);
    setError("");

    try {
      const updated = await cancelAdminBooking(booking.id);
      const merged: AdminBookingDetailDto = {
        ...booking,
        ...updated,
      };

      setBooking(merged);
      setStatus(merged.status ?? "cancelled");

      await onBookingUpdated(merged);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler la réservation.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    booking,
    loading,
    busy,
    error,
    sortedRooms,
    canCancel,
    canEdit,

    startDate,
    endDate,
    adults,
    children,
    notes,
    status,
    guestPhone,
    paymentStatus,
    paymentNote,
    mealPlanCode,
    newRoomId,

    setStartDate,
    setEndDate,
    setAdults,
    setChildren,
    setNotes,
    setStatus,
    setGuestPhone,
    setPaymentStatus,
    setPaymentNote,
    setMealPlanCode,
    setNewRoomId,

    save,
    assignRoom,
    cancel,
  };
}

function toInputDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}