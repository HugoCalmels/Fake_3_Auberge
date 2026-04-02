"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createAdminRoom,
  deleteAdminRoom,
  getAdminRooms,
  updateAdminRoomStatus,
} from "@/src/services/api/adminRooms.api";
import {
  createAdminRoomType,
  getAdminRoomTypes,
} from "@/src/services/api/adminRoomTypes.api";
import { getAdminBookings } from "@/src/services/api/adminBookings.api";

import type {
  AdminBookingDetailDto,
  AdminBookingDto,
  AdminRoomDto,
  AdminRoomStatus,
  AdminRoomTypeDto,
} from "@/src/services/api/admin.types";

import AdminReservationsSidebar, {
  type AdminWorkspacePanel,
} from "./AdminReservationsSidebar";
import AdminRoomsView from "./AdminRoomViews";
import AdminBookingsListView from "./AdminBookingsListView";
import AdminBookingDetailView from "./AdminBookingDetailView";
import AdminReservationPlanningView from "./AdminReservationPlanningView";
import AdminCreateBookingView from "./AdminCreateBookingView";

type Props = {
  admin: {
    id: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
};

export default function AdminReservationsWorkspace({
  admin,
  onLogout,
}: Props) {
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
            : "Impossible de charger l’interface admin."
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

  async function handleAddRoom(input: {
    floor: number;
    number: string;
    roomTypeId: string;
    status: AdminRoomStatus;
  }) {
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
    status: AdminRoomStatus
  ) {
    setRoomsBusy(true);

    try {
      const updated = await updateAdminRoomStatus(roomId, { status });

      setRooms((prev) =>
        prev.map((room) => (room.id === roomId ? updated : room)).sort(sortRooms)
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
    updatedBooking: AdminBookingDto | AdminBookingDetailDto
  ) {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id
          ? { ...booking, ...updatedBooking }
          : booking
      )
    );

    await refreshReservationSurfaces();
  }

  async function handleBookingCreated(createdBooking: AdminBookingDetailDto) {
    setBookings((prev) => [createdBooking, ...prev]);
    await refreshReservationSurfaces();
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

  if (bootLoading) {
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

          {!selectedBookingId && panel === "reservations-dashboard" ? (
            <AdminReservationPlanningView
              rooms={rooms}
              roomTypes={roomTypes}
              onSelectBooking={setSelectedBookingId}
              onBookingCreated={handleBookingCreated}
              refreshKey={planningRefreshKey}
            />
          ) : null}



          {!selectedBookingId && panel === "bookings-upcoming" ? (
            <AdminBookingsListView
              bookings={bookings}
              mode="upcoming"
              onSelectBooking={setSelectedBookingId}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "bookings-current" ? (
            <AdminBookingsListView
              bookings={bookings}
              mode="current"
              onSelectBooking={setSelectedBookingId}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "bookings-history" ? (
            <AdminBookingsListView
              bookings={bookings}
              mode="history"
              onSelectBooking={setSelectedBookingId}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "rooms" ? (
            <AdminRoomsView
              rooms={rooms}
              roomTypes={roomTypes}
              busy={roomsBusy}
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
              onUpdateRoomStatus={handleUpdateRoomStatus}
            />
          ) : null}

          {!selectedBookingId && panel === "roomTypes" ? (
            <RoomTypesView
              roomTypes={roomTypes}
              busy={roomTypesBusy}
              onAddRoomType={handleAddRoomType}
            />
          ) : null}

          {!selectedBookingId && panel === "stats" ? (
            <StatsView stats={stats} />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function sortRooms(a: AdminRoomDto, b: AdminRoomDto) {
  if (a.floor !== b.floor) return a.floor - b.floor;
  return a.number.localeCompare(b.number);
}

function RoomTypesView({
  roomTypes,
  busy,
  onAddRoomType,
}: {
  roomTypes: AdminRoomTypeDto[];
  busy: boolean;
  onAddRoomType: (input: {
    code: string;
    name: string;
    capacity: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !code.trim()) return;

    try {
      await onAddRoomType({
        code: code.trim(),
        name: name.trim(),
        capacity: Number(capacity),
      });

      setName("");
      setCode("");
      setCapacity("2");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter le type de chambre."
      );
    }
  }

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#1e1e1e]">
          Types de chambres
        </h2>
        <p className="mt-1 text-sm text-[#6c675f]">
          Gérer les catégories visibles dans la réservation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-3 rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-4 md:grid-cols-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom"
          className="rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code"
          className="rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
        />
        <input
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          type="number"
          min={1}
          className="rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
        />
        <button
          type="submit"
          disabled={busy}
          className="cursor-pointer rounded-xl bg-[#314835] px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Ajout..." : "Ajouter un type"}
        </button>
      </form>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roomTypes.map((type) => (
          <div
            key={type.id}
            className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5"
          >
            <h3 className="text-xl font-semibold text-[#1e1e1e]">{type.name}</h3>
            <p className="mt-2 text-sm text-[#6c675f]">Code : {type.code}</p>
            <p className="text-sm text-[#6c675f]">Capacité : {type.capacity}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsView({
  stats,
}: {
  stats: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    roomTypesCount: number;
    totalBookings: number;
  };
}) {
  const cards = [
    { label: "Chambres totales", value: stats.totalRooms },
    { label: "Disponibles", value: stats.availableRooms },
    { label: "Occupées", value: stats.occupiedRooms },
    { label: "Types de chambres", value: stats.roomTypesCount },
    { label: "Réservations", value: stats.totalBookings },
  ];

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-[#1e1e1e]">Stats</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5"
          >
            <p className="text-sm text-[#6c675f]">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold text-[#1e1e1e]">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}