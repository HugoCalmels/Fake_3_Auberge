"use client";

import type { AdminRoomStatus } from "@/features/admin/types";
import { useAdminWorkspace } from "@/features/admin/hooks/useAdminWorkspace";
import AdminBookingDetailView from "./AdminBookingDetailView";
import AdminBookingsListView from "./AdminBookingsListView";
import AdminReservationPlanningView from "./AdminReservationPlanningView";
import AdminReservationsSidebar from "./AdminReservationsSidebar";
import AdminRoomsView from "./AdminRoomViews";
import AdminRoomTypesView from "./AdminRoomTypesView";
import AdminStatsPanel from "./AdminStatsPanel";
import AdminSystemLogsView from "./AdminSystemLogsView";

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
  const {
    panel,
    setPanel,
    selectedBookingId,
    setSelectedBookingId,

    rooms,
    roomTypes,
    bookings,
    stats,

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
  } = useAdminWorkspace();

  if (bootLoading) {
    return (
      <div className="rounded-[22px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
        Chargement de l&apos;interface admin...
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
            <h1 className="text-[1.75rem] font-semibold leading-none text-[#1e1e1e]">
              Admin
            </h1>
            <p className="mt-2 text-sm leading-none text-[#6c675f]">
              Connecté en tant que {admin.email}
            </p>
          </div>

          <button
            type="button"
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
          {!selectedBookingId && panel === "reservations-planning" ? (
            <AdminReservationPlanningView
              rooms={rooms}
              roomTypes={roomTypes}
              onSelectBooking={setSelectedBookingId}
              onBookingCreated={handleBookingCreated}
              refreshKey={planningRefreshKey}
            />
          ) : null}

          {!selectedBookingId && panel === "bookings-list" ? (
            <AdminBookingsListView
              bookings={bookings}
              onSelectBooking={setSelectedBookingId}
              onBookingUpdated={handleBookingUpdated}
            />
          ) : null}

          {!selectedBookingId && panel === "rooms" ? (
            <AdminRoomsView
              rooms={rooms}
              roomTypes={roomTypes}
              busy={roomsBusy}
              onAddRoom={(input) =>
                handleAddRoom({
                  ...input,
                  floor: 1,
                })
              }
              onDeleteRoom={handleDeleteRoom}
              onUpdateRoomStatus={(roomId, status: AdminRoomStatus) =>
                handleUpdateRoomStatus(roomId, { status })
              }
            />
          ) : null}

          {!selectedBookingId && panel === "roomTypes" ? (
            <AdminRoomTypesView
              roomTypes={roomTypes}
              busy={roomTypesBusy}
              onAddRoomType={handleAddRoomType}
              onUpdateRoomType={handleUpdateRoomType}
              onDeleteRoomType={handleDeleteRoomType}
            />
          ) : null}

          {!selectedBookingId && panel === "stats" ? (
            <AdminStatsPanel stats={stats} />
          ) : null}

          {!selectedBookingId && panel === "system-logs" ? (
            <AdminSystemLogsView />
          ) : null}
        </main>
      </div>

      <AdminBookingDetailView
        open={Boolean(selectedBookingId)}
        bookingId={selectedBookingId}
        rooms={rooms}
        roomTypes={roomTypes}
        onClose={() => setSelectedBookingId(null)}
        onUpdated={handleBookingUpdated}
      />
    </div>
  );
}