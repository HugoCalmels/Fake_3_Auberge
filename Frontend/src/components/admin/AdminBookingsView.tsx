// src/components/admin/AdminBookingsView.tsx

"use client";

import { useMemo, useState } from "react";
import { cancelAdminBooking } from "@/src/services/api/adminBookings.api";
import type { AdminBookingDto } from "@/src/services/api/admin.types";

export type BookingMode = "upcoming" | "current" | "history";

type Props = {
  bookings: AdminBookingDto[];
  mode: BookingMode;
  onSelectBooking: (bookingId: string) => void;
  onBookingUpdated: (booking: AdminBookingDto) => void;
};

export default function AdminBookingsView({
  bookings,
  mode,
  onSelectBooking,
  onBookingUpdated,
}: Props) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);

        if (mode === "upcoming") {
          return start >= todayStart && booking.status !== "cancelled";
        }

        if (mode === "current") {
          return (
            start <= todayStart &&
            end >= todayStart &&
            booking.status !== "cancelled"
          );
        }

        return end < todayStart || booking.status === "cancelled";
      })
      .filter((booking) => {
        if (!normalizedQuery) return true;

        return (
          booking.guestName.toLowerCase().includes(normalizedQuery) ||
          booking.guestEmail.toLowerCase().includes(normalizedQuery) ||
          booking.roomNumber.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
  }, [bookings, mode, query, todayStart]);

  async function handleCancelBooking(bookingId: string) {
    setError("");
    setBusyId(bookingId);

    try {
      const updated = await cancelAdminBooking(bookingId);
      onBookingUpdated(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler la réservation."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#1e1e1e]">
              {mode === "upcoming"
                ? "Réservations à venir"
                : mode === "current"
                  ? "Séjours en cours"
                  : "Historique des réservations"}
            </h2>
            <p className="mt-1 text-sm text-[#6c675f]">
              {mode === "upcoming"
                ? "Préparer les arrivées et annuler si le client le demande."
                : mode === "current"
                  ? "Voir les clients présents et agir rapidement."
                  : "Retrouver les anciennes réservations et annulations."}
            </p>
          </div>

          <div className="w-full xl:w-[340px]">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
              Rechercher
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, email ou chambre"
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 text-[#1e1e1e]"
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {!filteredBookings.length ? (
        <div className="px-5 py-8 text-sm text-[#6c675f]">
          Aucune réservation sur cette vue.
        </div>
      ) : (
        <div className="divide-y divide-[#ece5d8]">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]"
            >
              <div>
                <p className="text-lg font-semibold text-[#1e1e1e]">
                  {booking.guestName}
                </p>
                <p className="mt-1 text-sm text-[#6c675f]">{booking.guestEmail}</p>
                <p className="mt-2 text-sm text-[#6c675f]">
                  {booking.adults} adulte{booking.adults > 1 ? "s" : ""}
                  {booking.children > 0
                    ? ` • ${booking.children} enfant${booking.children > 1 ? "s" : ""}`
                    : ""}
                </p>
              </div>

              <div>
                <Label>Chambre</Label>
                <Value>{booking.roomNumber}</Value>
                <Label className="mt-3">Type</Label>
                <Value>{booking.roomTypeName ?? "—"}</Value>
              </div>

              <div>
                <Label>Arrivée</Label>
                <Value>{formatDate(booking.startDate)}</Value>
                <Label className="mt-3">Départ</Label>
                <Value>{formatDate(booking.endDate)}</Value>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <StatusBadge status={booking.status} />

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm lg:justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectBooking(booking.id)}
                    className="cursor-pointer font-medium text-[#314835] underline-offset-4 hover:underline"
                  >
                    Voir le détail
                  </button>

                  {booking.status !== "cancelled" ? (
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => handleCancelBooking(booking.id)}
                      className="cursor-pointer font-medium text-red-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === booking.id ? "Annulation..." : "Annuler"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847b] ${className}`}
    >
      {children}
    </p>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-base text-[#1e1e1e]">{children}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "cancelled"
      ? {
          label: "Annulée",
          classes: "border-[#e2c1c1] bg-[#f8e6e6] text-[#7b2d2d]",
        }
      : status === "pending"
        ? {
            label: "En attente",
            classes: "border-[#e2d5b8] bg-[#f7f0de] text-[#6b5423]",
          }
        : status === "checked_in"
          ? {
              label: "En cours",
              classes: "border-[#bfd5c4] bg-[#e7f3ea] text-[#22422a]",
            }
          : status === "checked_out"
            ? {
                label: "Terminée",
                classes: "border-[#d2d7e2] bg-[#eef1f7] text-[#40516f]",
              }
            : {
                label: "Confirmée",
                classes: "border-[#bfd5c4] bg-[#e7f3ea] text-[#22422a]",
              };

  return (
    <div
      className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${config.classes}`}
    >
      {config.label}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}