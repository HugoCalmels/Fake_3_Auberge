"use client";

import { useMemo, useState } from "react";
import type {
  AdminBookingDetailDto,
  AdminBookingDto,
  AdminBookingStatus,
} from "@/features/admin/types";

type Mode = "review" | "upcoming" | "current" | "history";

type Props = {
  bookings: AdminBookingDto[];
  onSelectBooking: (bookingId: string) => void;
  onBookingUpdated: (
    booking: AdminBookingDto | AdminBookingDetailDto,
  ) => Promise<void> | void;
};

const TABS: Array<{ value: Mode; label: string }> = [
  { value: "review", label: "À vérifier" },
  { value: "upcoming", label: "À venir" },
  { value: "current", label: "En cours" },
  { value: "history", label: "Historique" },
];

export default function AdminBookingsListView({
  bookings,
  onSelectBooking,
}: Props) {
  const [mode, setMode] = useState<Mode>("review");
  const [search, setSearch] = useState("");

  const filteredBookings = useMemo(() => {
    const base = bookings.filter((booking) => {
      const hasDateWarning = isBookingDateWarning(booking);

      if (mode === "review") {
        return hasDateWarning;
      }

      if (hasDateWarning) {
        return false;
      }

      if (mode === "upcoming") {
        return booking.status === "confirmed" || booking.status === "pending";
      }

      if (mode === "current") {
        return booking.status === "checked_in";
      }

      return (
        booking.status === "checked_out" ||
        booking.status === "no_show" ||
        booking.status === "cancelled"
      );
    });

    const normalizedSearch = search.trim().toLowerCase();

    const searched = !normalizedSearch
      ? base
      : base.filter((booking) => {
          const haystack = [
            booking.guestName,
            booking.guestEmail,
            booking.roomNumber,
            booking.roomTypeName ?? "",
            booking.status,
            booking.notes ?? "",
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        });

    return searched.sort((a, b) => {
      if (mode === "history" || mode === "review") {
        return (
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      }

      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [bookings, mode, search]);

  const viewConfig = getViewConfig(mode);

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
              Réservations
            </h2>

            <p className="mt-3 text-sm text-[#6c675f]">
              {viewConfig.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setMode(tab.value)}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    mode === tab.value
                      ? "bg-[#314835] text-white"
                      : "bg-[#f8f3ea] text-[#314835] hover:bg-[#efe8dc]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full max-w-[360px]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8a847b]">
              Rechercher
            </label>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, email ou chambre"
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-4 py-2.5 text-base text-[#1e1e1e] outline-none transition focus:border-[#314835]"
            />
          </div>
        </div>
      </div>

      {!filteredBookings.length ? (
        <div className="px-5 py-8 text-sm text-[#6c675f]">
          Aucune réservation sur cette vue.
        </div>
      ) : (
        <div>
          {filteredBookings.map((booking, index) => {
            const hasDateWarning = isBookingDateWarning(booking);

            return (
              <button
                key={booking.id}
                type="button"
                onClick={() => onSelectBooking(booking.id)}
                className={`group grid w-full cursor-pointer gap-5 px-5 py-5 text-left transition hover:bg-[#fcfaf7] xl:grid-cols-[minmax(0,1.6fr)_170px_200px_150px] ${
                  index !== filteredBookings.length - 1
                    ? "border-b border-[#ece5d8]"
                    : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center truncate text-[1.05rem] font-semibold text-[#1e1e1e]">
                        {hasDateWarning ? (
                          <span className="mr-2 shrink-0 text-[#D9A520]/90">
                            ⚠
                          </span>
                        ) : null}

                        <span className="truncate">{booking.guestName}</span>
                      </p>

                      <p className="mt-1 truncate text-sm text-[#6c675f]">
                        {booking.guestEmail}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={booking.status} />

                      {hasDateWarning ? (
                        <SoftStatusBadge label="À vérifier" />
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-[#6c675f]">
                    {booking.adults} adulte{booking.adults > 1 ? "s" : ""}
                    {booking.children > 0
                      ? ` • ${booking.children} enfant${
                          booking.children > 1 ? "s" : ""
                        }`
                      : ""}
                  </p>

                  {booking.notes?.trim() ? (
                    <div className="mt-3 max-w-[560px] rounded-xl border border-[#e3dbcf] bg-[#fcfaf7] px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                        Notes
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm text-[#5f594f]">
                        {booking.notes}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label>Chambre</Label>
                  <Value>{booking.roomNumber}</Value>

                  {booking.roomTypeName ? (
                    <>
                      <Label className="mt-4">Type</Label>
                      <Value>{booking.roomTypeName}</Value>
                    </>
                  ) : null}
                </div>

                <div>
                  <Label>Arrivée</Label>
                  <Value>{formatDate(booking.startDate)}</Value>

                  <Label className="mt-4">Départ</Label>
                  <Value>{formatDate(booking.endDate)}</Value>
                </div>

                <div className="flex items-center xl:justify-end">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] transition group-hover:border-[#314835] group-hover:bg-[#faf6ef]">
                    <span>Ouvrir</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getViewConfig(mode: Mode) {
  if (mode === "review") {
    return {
      subtitle:
        "Corriger les réservations avec une incohérence entre statut et dates.",
    };
  }

  if (mode === "upcoming") {
    return {
      subtitle: "Préparer les réservations à venir avant l’arrivée client.",
    };
  }

  if (mode === "current") {
    return {
      subtitle: "Voir les séjours actuellement arrivés.",
    };
  }

  return {
    subtitle: "Retrouver les séjours partis, annulés ou marqués pas venus.",
  };
}

function StatusBadge({ status }: { status: AdminBookingStatus }) {
  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${config.classes}`}
    >
      {config.label}
    </div>
  );
}

function SoftStatusBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex shrink-0 rounded-full border border-[#D9A520] bg-[#D9A520] px-3 py-1.5 text-sm font-semibold text-white">
      {label}
    </div>
  );
}

function getStatusConfig(status: AdminBookingStatus) {
  if (status === "checked_in") {
    return {
      label: "Arrivé",
      classes: "border-[#0B8043] bg-[#0B8043] text-white",
    };
  }

  if (status === "checked_out") {
    return {
      label: "Parti",
      classes: "border-[#616161] bg-[#616161] text-white",
    };
  }

  if (status === "no_show") {
    return {
      label: "Pas venu",
      classes: "border-[#D96A3A] bg-[#D96A3A] text-white",
    };
  }

  if (status === "cancelled") {
    return {
      label: "Annulée",
      classes: "border-[#8C1D18] bg-[#8C1D18] text-white",
    };
  }

  if (status === "pending") {
    return {
      label: "En attente",
      classes: "border-[#D9A520] bg-[#D9A520] text-white",
    };
  }

  return {
    label: "Réservée",
    classes: "border-[#3F51B5] bg-[#3F51B5] text-white",
  };
}

function isBookingDateWarning(booking: AdminBookingDto) {
  const today = stripTime(new Date());
  const start = stripTime(new Date(booking.startDate));
  const end = stripTime(new Date(booking.endDate));

  if (
    (booking.status === "confirmed" || booking.status === "pending") &&
    end <= today
  ) {
    return true;
  }

  if (booking.status === "checked_in" && (start > today || end <= today)) {
    return true;
  }

  if (booking.status === "checked_out" && (start > today || end > today)) {
    return true;
  }

  if (booking.status === "no_show" && start >= today) {
    return true;
  }

  return false;
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}