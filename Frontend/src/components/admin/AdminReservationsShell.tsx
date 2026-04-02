// src/components/admin/AdminReservationsShell.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminBookings } from "@/src/services/api/adminBookings.api";
import { getAdminRooms } from "@/src/services/api/adminRooms.api";
import { getAdminRoomTypes } from "@/src/services/api/adminRoomTypes.api";
import { getAdminDashboardStats } from "@/src/services/api/adminStats.api";

import type {
  AdminBookingDetailDto,
  AdminBookingDto,
  AdminDashboardStatsDto,
  AdminRoomDto,
  AdminRoomTypeDto,
} from "@/src/services/api/admin.types";

import AdminReservationsSidebar, {
  type AdminReservationsPanel,
} from "./AdminReservationsSidebar";
import AdminReservationsDashboardView from "./AdminReservationsDashboardView";
import AdminBookingsView from "./AdminBookingsView";
import AdminBookingDetailView from "./AdminBookingDetailView";
import AdminCreateBookingView from "./AdminCreateBookingView";
import AdminStatsView from "./AdminStatsView";

type Props = {
  admin: {
    id: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
};

export default function AdminReservationsShell({ admin, onLogout }: Props) {
  const [panel, setPanel] = useState<AdminReservationsPanel>("dashboard");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const [rooms, setRooms] = useState<AdminRoomDto[]>([]);
  const [roomTypes, setRoomTypes] = useState<AdminRoomTypeDto[]>([]);
  const [bookings, setBookings] = useState<AdminBookingDto[]>([]);
  const [dashboardStats, setDashboardStats] =
    useState<AdminDashboardStatsDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setBootError("");

      try {
        const [roomsData, roomTypesData, bookingsData, statsData] =
          await Promise.all([
            getAdminRooms(),
            getAdminRoomTypes(),
            getAdminBookings(),
            getAdminDashboardStats().catch(() => null),
          ]);

        setRooms(roomsData);
        setRoomTypes(roomTypesData);
        setBookings(bookingsData);
        setDashboardStats(statsData);
      } catch (err) {
        setBootError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l'interface admin."
        );
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  function handleBookingUpdated(
    updatedBooking: AdminBookingDto | AdminBookingDetailDto
  ) {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id
          ? {
              ...booking,
              ...updatedBooking,
            }
          : booking
      )
    );
  }

  function handleBookingCreated(createdBooking: AdminBookingDetailDto) {
    setBookings((prev) => [...prev, createdBooking]);
    setPanel("bookings-upcoming");
    setSelectedBookingId(createdBooking.id);
  }

  const stats = useMemo(() => {
    return {
      totalRooms: rooms.length,
      availableRooms: rooms.filter((room) => room.status === "available").length,
      occupiedRooms: rooms.filter((room) => room.status === "occupied").length,
      roomTypesCount: roomTypes.length,
      totalBookings: bookings.length,
    };
  }, [rooms, roomTypes, bookings]);

  if (loading) {
    return (
      <div className="rounded-[22px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
        Chargement de l’interface admin...
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="rounded-[22px] border border-[#e2c1c1] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#1e1e1e]">Erreur</h2>
        <p className="mt-2 text-sm text-red-700">{bootError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[22px] border border-[#d8d0c2] bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
              Dashboard admin
            </h1>
            <p className="mt-2 text-sm leading-none text-[#6c675f]">
              Connecté en tant que {admin.email}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="w-fit shrink-0 cursor-pointer rounded-full border border-[#314835] px-5 py-2 text-sm font-semibold text-[#314835] transition hover:bg-[#314835] hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AdminReservationsSidebar
          panel={panel}
          onChange={(nextPanel) => {
            setSelectedBookingId(null);
            setPanel(nextPanel);
          }}
        />

        <main className="min-w-0">
          {selectedBookingId ? (
            <AdminBookingDetailView
              bookingId={selectedBookingId}
              rooms={rooms}
              onBack={() => setSelectedBookingId(null)}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "dashboard" ? (
            <AdminReservationsDashboardView stats={dashboardStats} />
          ) : null}

          {!selectedBookingId && panel === "bookings-create" ? (
            <AdminCreateBookingView
              rooms={rooms}
              roomTypes={roomTypes}
              onBookingCreated={handleBookingCreated}
            />
          ) : null}

          {!selectedBookingId && panel === "bookings-upcoming" ? (
            <AdminBookingsView
              bookings={bookings}
              mode="upcoming"
              onSelectBooking={setSelectedBookingId}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "bookings-current" ? (
            <AdminBookingsView
              bookings={bookings}
              mode="current"
              onSelectBooking={setSelectedBookingId}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "bookings-history" ? (
            <AdminBookingsView
              bookings={bookings}
              mode="history"
              onSelectBooking={setSelectedBookingId}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "stats" ? (
            <AdminStatsView stats={stats} />
          ) : null}
        </main>
      </div>
    </div>
  );
}