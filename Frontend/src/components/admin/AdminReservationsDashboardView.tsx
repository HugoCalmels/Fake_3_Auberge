// src/components/admin/AdminReservationsDashboardView.tsx

"use client";

import type { AdminDashboardStatsDto } from "@/src/services/api/admin.types";

type Props = {
  stats: AdminDashboardStatsDto | null;
};

export default function AdminReservationsDashboardView({ stats }: Props) {
  const cards = [
    { label: "Arrivées du jour", value: stats?.arrivalsToday ?? 0 },
    { label: "Départs du jour", value: stats?.departuresToday ?? 0 },
    { label: "Clients sur place", value: stats?.currentGuests ?? 0 },
    { label: "Réservations à venir", value: stats?.bookingsUpcoming ?? 0 },
    { label: "Chambres dispos", value: stats?.availableRoomsToday ?? 0 },
    { label: "Maintenance", value: stats?.maintenanceRooms ?? 0 },
  ];

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#1e1e1e]">
          Dashboard réservations
        </h2>
        <p className="mt-1 text-sm text-[#6c675f]">
          Vue rapide du jour pour piloter l’exploitation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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