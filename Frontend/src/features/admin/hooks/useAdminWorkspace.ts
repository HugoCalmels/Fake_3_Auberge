"use client";

import { useEffect, useState } from "react";

import { getAdminBookings } from "@/features/admin/api/adminBookings.api";
import {
  getAdminStats,
  type AdminStatsDashboardDto,
} from "@/features/admin/api/adminStats.api";
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
  deleteAdminRoomType,
  getAdminRoomTypes,
  updateAdminRoomType,
} from "@/features/admin/api/adminRoomTypes.api";
import { sortRooms } from "@/features/admin/lib/admin-utils";
import type {
  AdminBookingDetailDto,
  AdminBookingDto,
  AdminRoomDto,
  AdminRoomTypeDto,
  AdminWorkspacePanel,
  CreateAdminRoomTypePayload,
  UpdateAdminRoomTypePayload,
} from "@/features/admin/types";

export function useAdminWorkspace() {
  const [panel, setPanel] =
    useState<AdminWorkspacePanel>("reservations-planning");

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  const [rooms, setRooms] = useState<AdminRoomDto[]>([]);
  const [roomTypes, setRoomTypes] = useState<AdminRoomTypeDto[]>([]);
  const [bookings, setBookings] = useState<AdminBookingDto[]>([]);
const [stats, setStats] = useState<AdminStatsDashboardDto | null>(null);
const statsLoading = stats === null;

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
        const [roomsData, roomTypesData, bookingsData, statsData] =
          await Promise.all([
            getAdminRooms(),
            getAdminRoomTypes(),
            getAdminBookings().catch(() => []),
            getAdminStats(),
          ]);

        setRooms(roomsData.sort(sortRooms));
        setRoomTypes(roomTypesData);
        setBookings(bookingsData);
        setStats(statsData);
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

    void boot();
  }, []);

  async function refreshStats() {
    const freshStats = await getAdminStats().catch(() => null);
    setStats(freshStats);
  }

  async function refreshBookings() {
    const freshBookings = await getAdminBookings().catch(() => []);
    setBookings(freshBookings);
  }

  async function refreshReservationSurfaces() {
    await Promise.all([refreshBookings(), refreshStats()]);
    setPlanningRefreshKey((prev) => prev + 1);
  }

  async function handleAddRoom(input: CreateAdminRoomPayload) {
    setRoomsBusy(true);

    try {
      const created = await createAdminRoom(input);
      setRooms((prev) => [...prev, created].sort(sortRooms));
      await refreshStats();
      setPlanningRefreshKey((prev) => prev + 1);
    } finally {
      setRoomsBusy(false);
    }
  }

  async function handleDeleteRoom(roomId: string) {
    setRoomsBusy(true);

    try {
      await deleteAdminRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      await refreshStats();
      setPlanningRefreshKey((prev) => prev + 1);
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
        prev
          .map((room) => (room.id === roomId ? updated : room))
          .sort(sortRooms),
      );

      await refreshStats();
      setPlanningRefreshKey((prev) => prev + 1);
    } finally {
      setRoomsBusy(false);
    }
  }

  async function handleAddRoomType(input: CreateAdminRoomTypePayload) {
    setRoomTypesBusy(true);

    try {
      const created = await createAdminRoomType(input);
      setRoomTypes((prev) => [...prev, created]);
      await refreshStats();
    } finally {
      setRoomTypesBusy(false);
    }
  }

  async function handleUpdateRoomType(
    roomTypeId: string,
    input: UpdateAdminRoomTypePayload,
  ) {
    setRoomTypesBusy(true);

    try {
      const updated = await updateAdminRoomType(roomTypeId, input);

      setRoomTypes((prev) =>
        prev.map((type) => (type.id === updated.id ? updated : type)),
      );

      await refreshStats();
      setPlanningRefreshKey((prev) => prev + 1);
    } finally {
      setRoomTypesBusy(false);
    }
  }

  async function handleDeleteRoomType(roomTypeId: string) {
    setRoomTypesBusy(true);

    try {
      await deleteAdminRoomType(roomTypeId);

      setRoomTypes((prev) => prev.filter((type) => type.id !== roomTypeId));
      await refreshStats();
      setPlanningRefreshKey((prev) => prev + 1);
    } finally {
      setRoomTypesBusy(false);
    }
  }

  async function handleBookingUpdated(
    updatedBooking: AdminBookingDto | AdminBookingDetailDto,
  ) {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id
          ? { ...booking, ...updatedBooking }
          : booking,
      ),
    );

    await refreshReservationSurfaces();
  }

  async function handleBookingCreated(createdBooking: AdminBookingDetailDto) {
    setBookings((prev) => [createdBooking, ...prev]);
    await refreshReservationSurfaces();
  }

  return {
    panel,
    setPanel,
    selectedBookingId,
    setSelectedBookingId,

    rooms,
    roomTypes,
    bookings,
    stats,
statsLoading,

    bootLoading,
    bootError,
    roomsBusy,
    roomTypesBusy,
    planningRefreshKey,

    handleAddRoom,
    handleDeleteRoom,
    handleUpdateRoomStatus,

    handleAddRoomType,
    handleUpdateRoomType,
    handleDeleteRoomType,

    handleBookingUpdated,
    handleBookingCreated,
  };
}