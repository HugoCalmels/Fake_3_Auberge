"use client";

import { useEffect, useMemo, useState } from "react";

import { getAdminBookings } from "@/features/admin/api/adminBookings.api";
import {
  createAdminRoom,
  deleteAdminRoom,
  getAdminRooms,
  type CreateAdminRoomPayload,
  type UpdateAdminRoomStatusPayload,
  updateAdminRoomStatus,
} from "@/features/admin/api/adminRooms.api";
import {
  createAdminRoomType,
  getAdminRoomTypes,
} from "@/features/admin/api/adminRoomTypes.api";
import { sortRooms } from "@/features/admin/lib/admin-utils";
import type {
  AdminBookingDetailDto,
  AdminBookingDto,
  AdminRoomTypeDto,
  AdminWorkspacePanel,
  AdminRoomDto,
} from "@/features/admin/types";

export function useAdminWorkspace() {
  const [panel, setPanel] =
    useState<AdminWorkspacePanel>("reservations-dashboard");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const [rooms, setRooms] = useState<AdminRoomDto[]>([]);
  const [roomTypes, setRoomTypes] = useState<AdminRoomTypeDto[]>([]);
  const [bookings, setBookings] = useState<AdminBookingDto[]>([]);

  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState("");
  const [roomsBusy, setRoomsBusy] = useState(false);
  const [roomTypesBusy, setRoomTypesBusy] = useState(false);
  const [planningRefreshKey, setPlanningRefreshKey] = useState(0);

  useEffect(() => {
    async function boot() {
      setBootLoading(true);
      setBootError("");

      try {
        const [roomsData, roomTypesData, bookingsData] = await Promise.all([
          getAdminRooms(),
          getAdminRoomTypes(),
          getAdminBookings().catch(() => []),
        ]);

        setRooms(roomsData);
        setRoomTypes(roomTypesData);
        setBookings(bookingsData);
      } catch (err) {
        setBootError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l'interface admin.",
        );
      } finally {
        setBootLoading(false);
      }
    }

    boot();
  }, []);

  async function refreshBookings() {
    const freshBookings = await getAdminBookings().catch(() => []);
    setBookings(freshBookings);
  }

  async function refreshReservationSurfaces() {
    await refreshBookings();
    setPlanningRefreshKey((prev) => prev + 1);
  }

  async function handleAddRoom(input: CreateAdminRoomPayload) {
    setRoomsBusy(true);

    try {
      const created = await createAdminRoom(input);
      setRooms((prev) => [...prev, created].sort(sortRooms));
    } finally {
      setRoomsBusy(false);
    }
  }

  async function handleDeleteRoom(roomId: string) {
    setRoomsBusy(true);

    try {
      await deleteAdminRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    } finally {
      setRoomsBusy(false);
    }
  }

  async function handleUpdateRoomStatus(
    roomId: string,
    payload: UpdateAdminRoomStatusPayload,
  ) {
    setRoomsBusy(true);

    try {
      const updated = await updateAdminRoomStatus(roomId, payload);

      setRooms((prev) =>
        prev.map((room) => (room.id === roomId ? updated : room)).sort(sortRooms),
      );
    } finally {
      setRoomsBusy(false);
    }
  }

  async function handleAddRoomType(input: {
    code: string;
    name: string;
    capacity: number;
  }) {
    setRoomTypesBusy(true);

    try {
      const created = await createAdminRoomType(input);
      setRoomTypes((prev) => [...prev, created]);
    } finally {
      setRoomTypesBusy(false);
    }
  }

  async function handleBookingUpdated(
    updatedBooking: AdminBookingDto | AdminBookingDetailDto,
  ) {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id ? { ...booking, ...updatedBooking } : booking,
      ),
    );

    await refreshReservationSurfaces();
  }

  async function handleBookingCreated(createdBooking: AdminBookingDetailDto) {
    setBookings((prev) => [createdBooking, ...prev]);
    await refreshReservationSurfaces();
  }

  const stats = useMemo(
    () => ({
      totalRooms: rooms.length,
      availableRooms: rooms.filter((room) => room.status === "available").length,
      occupiedRooms: rooms.filter((room) => room.status === "occupied").length,
      roomTypesCount: roomTypes.length,
      totalBookings: bookings.length,
    }),
    [rooms, roomTypes, bookings],
  );

  return {
    panel,
    setPanel,
    selectedBookingId,
    setSelectedBookingId,
    rooms,
    roomTypes,
    bookings,
    bootLoading,
    bootError,
    roomsBusy,
    roomTypesBusy,
    planningRefreshKey,
    stats,
    handleAddRoom,
    handleDeleteRoom,
    handleUpdateRoomStatus,
    handleAddRoomType,
    handleBookingUpdated,
    handleBookingCreated,
  };
}
