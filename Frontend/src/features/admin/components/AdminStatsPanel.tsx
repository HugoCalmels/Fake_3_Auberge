"use client";

import type { AdminStatsDashboardDto } from "@/features/admin/api/adminStats.api";

type Props = {
  stats: AdminStatsDashboardDto;
};

export default function AdminStatsPanel({ stats }: Props) {
  const maxMonthValue = Math.max(
    1,
    ...stats.reservationsByMonth.map((item) => item.value),
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
        <h2 className="text-4xl font-semibold text-[#1e1e1e]">
          Statistiques
        </h2>

        <p className="mt-2 text-sm text-[#6c675f]">
          Activité, réservations et revenus de l'auberge.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard label="CA ce mois" value={formatEuros(stats.monthlyRevenue)} />
        <StatCard label="Réservations" value={stats.totalBookings} />
        <StatCard label="Occupation" value={`${stats.occupancyRate}%`} />
        <StatCard label="Panier moyen" value={formatEuros(stats.averageBasket)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
  <div className="mb-6">
    <h3 className="text-xl font-semibold text-[#1e1e1e]">
      Évolution des réservations
    </h3>
    <p className="mt-1 text-sm text-[#8a847b]">Année en cours</p>
  </div>

  <div className="overflow-x-auto pb-1">
    <div className="flex h-[280px] min-w-[720px] items-end justify-between gap-3">
      {stats.reservationsByMonth.map((item) => {
        const isCurrentMonth =
          item.label.toLowerCase().replace(".", "") ===
          new Date()
            .toLocaleDateString("fr-FR", { month: "short" })
            .toLowerCase()
            .replace(".", "");

        return (
          <div
            key={item.label}
            className="flex min-w-[44px] flex-1 flex-col items-center gap-2"
          >
            <span
              className={`text-xs font-medium ${
                isCurrentMonth ? "text-[#314835]" : "text-[#6c675f]"
              }`}
            >
              {item.value}
            </span>

            <div
              className={`w-full rounded-t-md transition ${
                isCurrentMonth ? "bg-[#1f3a27]" : "bg-[#314835]"
              }`}
              style={{
                height: `${Math.max(
                  8,
                  (item.value / maxMonthValue) * 190,
                )}px`,
              }}
              title={`${item.value} réservation(s)`}
            />

            <span
              className={`max-w-full truncate text-xs ${
                isCurrentMonth
                  ? "font-semibold text-[#314835]"
                  : "text-[#8a847b]"
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
</div>

        <div className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[#1e1e1e]">
              Répartition des réservations
            </h3>
            <p className="mt-1 text-sm text-[#8a847b]">Par type de chambre</p>
          </div>

          <div className="space-y-5">
            {stats.roomDistribution.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between gap-4 text-sm">
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 font-medium">{item.value}%</span>
                </div>

                <div className="h-3 rounded-full bg-[#ece5d8]">
                  <div
                    className="h-3 rounded-full bg-[#314835]"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[#1e1e1e]">
              Top chambres
            </h3>
            <p className="mt-1 text-sm text-[#8a847b]">
              Chambres les plus réservées
            </p>
          </div>

          <div className="space-y-4">
            {stats.topRooms.map((room) => (
              <div
                key={room.roomNumber}
                className="flex items-center justify-between gap-4 border-b border-[#ece5d8] pb-3 last:border-b-0 last:pb-0"
              >
                <span className="font-medium text-[#1e1e1e]">
                  Chambre {room.roomNumber}
                </span>

                <span className="shrink-0 text-[#6c675f]">
                  {room.bookings} réservation{room.bookings > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[#1e1e1e]">
              Prévisions 30 jours
            </h3>
            <p className="mt-1 text-sm text-[#8a847b]">
              Réservations futures
            </p>
          </div>

          <div className="space-y-5">
            <ForecastRow
              label="Réservations à venir"
              value={stats.forecast.upcomingBookings}
            />
            <ForecastRow
              label="Nuits vendues"
              value={stats.forecast.soldNights}
            />
            <ForecastRow
              label="CA prévisionnel"
              value={formatEuros(stats.forecast.expectedRevenue)}
            />
            <ForecastRow
              label="Occupation estimée"
              value={`${stats.forecast.occupancyRate}%`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#e3dbcf] bg-white p-5">
      <p className="text-sm text-[#6c675f]">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-[#1e1e1e]">{value}</p>
    </div>
  );
}

function ForecastRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#1e1e1e]">{label}</span>
      <strong className="shrink-0 text-[#1e1e1e]">{value}</strong>
    </div>
  );
}

function formatEuros(value: number) {
  return `${value.toLocaleString("fr-FR")} €`;
}