"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assignAdminBookingRoom,
  cancelAdminBooking,
  getAdminBookingById,
  updateAdminBooking,
} from "@/src/services/api/adminBookings.api";
import type {
  AdminBookingDetailDto,
  AdminRoomDto,
} from "@/src/services/api/admin.types";

type Props = {
  bookingId: string;
  rooms: AdminRoomDto[];
  onBack: () => void;
  onBookingUpdated: (booking: AdminBookingDetailDto) => Promise<void> | void;
};

export default function AdminBookingDetailView({
  bookingId,
  rooms,
  onBack,
  onBookingUpdated,
}: Props) {
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
            : "Impossible de charger la réservation."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId]);

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.number.localeCompare(b.number);
    });
  }, [rooms]);

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

  async function handleUpdateBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || !canEdit) return;

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
      onBack();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier la réservation."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignRoom() {
    if (!booking || !newRoomId || !canEdit) return;

    setBusy(true);
    setError("");

    try {
      const updated = await assignAdminBookingRoom(booking.id, {
        roomId: newRoomId,
      });

      setBooking(updated);
      await onBookingUpdated(updated);
      onBack();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de réassigner la chambre."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelBooking() {
    if (!booking || !canCancel) return;

    const confirmed = window.confirm(
      "Confirmer l'annulation de cette réservation ?"
    );

    if (!confirmed) return;

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
      onBack();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler la réservation."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
        Chargement de la réservation...
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
        Réservation introuvable.
      </section>
    );
  }

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-5 py-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d8d0c2] px-3 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
        >
          <span>←</span>
          <span>Retour aux réservations</span>
        </button>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
              Réservation de {booking.guestName}
            </h2>
            <p className="mt-3 text-base text-[#6c675f]">{booking.guestEmail}</p>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <StatusBadge status={booking.status} />

            {canCancel ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleCancelBooking}
                className="cursor-pointer text-sm font-medium text-red-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Annulation..." : "Annuler la réservation"}
              </button>
            ) : (
              <p className="text-sm text-[#8a847b]">
                Cette réservation ne peut plus être annulée.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5">
            <h3 className="text-xl font-semibold text-[#1e1e1e]">
              Détail séjour
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <InfoItem label="Chambre" value={booking.roomNumber} />
              <InfoItem label="Type" value={booking.roomTypeName ?? "—"} />
              <InfoItem label="Arrivée" value={formatDate(booking.startDate)} />
              <InfoItem label="Départ" value={formatDate(booking.endDate)} />
              <InfoItem
                label="Voyageurs"
                value={`${booking.adults} adulte(s) • ${booking.children} enfant(s)`}
              />
              <InfoItem label="Statut" value={formatStatusText(booking.status)} />
            </div>
          </div>

          <form
            onSubmit={handleUpdateBooking}
            className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5"
          >
            <h3 className="text-xl font-semibold text-[#1e1e1e]">Modifier</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                  Arrivée
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                  Départ
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                  Adultes
                </label>
                <input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                  Enfants
                </label>
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canEdit}
                rows={4}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                placeholder="Notes internes, infos utiles, demande spéciale..."
              />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={busy || !canEdit}
                className="cursor-pointer rounded-xl bg-[#314835] px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5">
            <h3 className="text-xl font-semibold text-[#1e1e1e]">
              Réassigner la chambre
            </h3>

            <div className="mt-5">
              <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                Chambre
              </label>
              <select
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
              >
                {sortedRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Chambre {room.number} — étage {room.floor}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={busy || !canEdit}
                onClick={handleAssignRoom}
                className="cursor-pointer rounded-xl border border-[#314835] px-4 py-2.5 text-sm font-medium text-[#314835] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Mise à jour..." : "Changer de chambre"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-[18px] border border-[#e2c1c1] bg-white p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
        {label}
      </p>
      <p className="mt-1 text-base text-[#1e1e1e]">{value}</p>
    </div>
  );
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
          label: "Sur place",
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

function toInputDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatStatusText(status: string) {
  if (status === "confirmed") return "Confirmée";
  if (status === "pending") return "En attente";
  if (status === "checked_in") return "Sur place";
  if (status === "checked_out") return "Terminée";
  if (status === "cancelled") return "Annulée";
  return status;
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}