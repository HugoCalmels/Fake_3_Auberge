"use client";

import { useAdminBookingDetails } from "@/features/admin/hooks/useAdminBookingDetails";
import type { AdminBookingDetailDto, AdminRoomDto } from "@/features/admin/types";

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
  const {
    booking,
    loading,
    busy,
    error,
    sortedRooms,
    canCancel,
    canEdit,
    startDate,
    endDate,
    adults,
    children,
    notes,
    newRoomId,
    setStartDate,
    setEndDate,
    setAdults,
    setChildren,
    setNotes,
    setNewRoomId,
    save,
    assignRoom,
    cancel,
  } = useAdminBookingDetails(bookingId, rooms);

  async function handleUpdateBooking(event: React.FormEvent) {
    event.preventDefault();
    const success = await save(onBookingUpdated);
    if (success) onBack();
  }

  async function handleAssignRoom() {
    const success = await assignRoom(onBookingUpdated);
    if (success) onBack();
  }

  async function handleCancelBooking() {
    if (!booking || !canCancel) return;

    const confirmed = window.confirm(
      "Confirmer l'annulation de cette reservation ?",
    );

    if (!confirmed) return;

    const success = await cancel(onBookingUpdated);
    if (success) onBack();
  }

  if (loading) {
    return (
      <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
        Chargement de la reservation...
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
        Reservation introuvable.
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
          <span>&larr;</span>
          <span>Retour aux reservations</span>
        </button>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
              Reservation de {booking.guestName}
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
                {busy ? "Annulation..." : "Annuler la reservation"}
              </button>
            ) : (
              <p className="text-sm text-[#8a847b]">
                Cette reservation ne peut plus etre annulee.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5">
            <h3 className="text-xl font-semibold text-[#1e1e1e]">Detail sejour</h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <InfoItem label="Chambre" value={booking.roomNumber} />
              <InfoItem label="Type" value={booking.roomTypeName ?? "—"} />
              <InfoItem label="Arrivee" value={formatDate(booking.startDate)} />
              <InfoItem label="Depart" value={formatDate(booking.endDate)} />
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
              <Field label="Arrivee">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </Field>

              <Field label="Depart">
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </Field>

              <Field label="Adultes">
                <input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(event) => setAdults(event.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </Field>

              <Field label="Enfants">
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(event) => setChildren(event.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                />
              </Field>
            </div>

            <Field label="Notes" className="mt-4">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={!canEdit}
                rows={4}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
                placeholder="Notes internes, infos utiles, demande speciale..."
              />
            </Field>

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
              Reassigner la chambre
            </h3>

            <Field label="Chambre" className="mt-5">
              <select
                value={newRoomId}
                onChange={(event) => setNewRoomId(event.target.value)}
                disabled={!canEdit}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:opacity-60"
              >
                {sortedRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Chambre {room.number} - etage {room.floor}
                  </option>
                ))}
              </select>
            </Field>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={busy || !canEdit}
                onClick={handleAssignRoom}
                className="cursor-pointer rounded-xl border border-[#314835] px-4 py-2.5 text-sm font-medium text-[#314835] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Mise a jour..." : "Changer de chambre"}
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

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
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
      ? { label: "Annulee", classes: "border-[#e2c1c1] bg-[#f8e6e6] text-[#7b2d2d]" }
      : status === "pending"
        ? { label: "En attente", classes: "border-[#e2d5b8] bg-[#f7f0de] text-[#6b5423]" }
        : status === "checked_in"
          ? { label: "Sur place", classes: "border-[#bfd5c4] bg-[#e7f3ea] text-[#22422a]" }
          : status === "checked_out"
            ? { label: "Terminee", classes: "border-[#d2d7e2] bg-[#eef1f7] text-[#40516f]" }
            : { label: "Confirmee", classes: "border-[#bfd5c4] bg-[#e7f3ea] text-[#22422a]" };

  return (
    <div className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${config.classes}`}>
      {config.label}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatStatusText(status: string) {
  if (status === "confirmed") return "Confirmee";
  if (status === "pending") return "En attente";
  if (status === "checked_in") return "Sur place";
  if (status === "checked_out") return "Terminee";
  if (status === "cancelled") return "Annulee";
  return status;
}
