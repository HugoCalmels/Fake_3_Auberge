"use client";

import { useEffect, useMemo, useState } from "react";

import {
  assignAdminBookingRoom,
  cancelAdminBooking,
  getAdminBookingById,
  updateAdminBooking,
} from "@/features/admin/api/adminBookings.api";
import { sortRooms } from "@/features/admin/lib/admin-utils";
import type { AdminBookingDetailDto, AdminRoomDto } from "@/features/admin/types";

export function useAdminBookingDetails(bookingId: string, rooms: AdminRoomDto[]) {
  const [booking, setBooking] = useState<AdminBookingDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [notes, setNotes] = useState("");
  const [newRoomId, setNewRoomId] = useState("");

  useEffect(() => {
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
        setNewRoomId(data.roomId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger la reservation.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
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
    return booking.status !== "cancelled" && booking.status !== "checked_out";
  }, [booking]);

  async function save(onBookingUpdated: (booking: AdminBookingDetailDto) => Promise<void> | void) {
    if (!booking || !canEdit) return false;

    setBusy(true);
    setError("");

    try {
      const updated = await updateAdminBooking(booking.id, {
        startDate,
        endDate,
        adults: Number(adults),
        children: Number(children),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      setBooking(updated);
      await onBookingUpdated(updated);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier la reservation.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function assignRoom(
    onBookingUpdated: (booking: AdminBookingDetailDto) => Promise<void> | void,
  ) {
    if (!booking || !newRoomId || !canEdit) return false;

    setBusy(true);
    setError("");

    try {
      const updated = await assignAdminBookingRoom(booking.id, {
        roomId: newRoomId,
      });

      setBooking(updated);
      await onBookingUpdated(updated);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de reassigner la chambre.",
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
      await onBookingUpdated(merged);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler la reservation.",
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
    newRoomId,
    setStartDate,
    setEndDate,
    setAdults,
    setChildren,
    setNotes,
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
