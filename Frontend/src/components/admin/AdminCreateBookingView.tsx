"use client";

import { useMemo, useState } from "react";
import { createAdminBooking } from "@/src/services/api/adminBookings.api";
import type {
  AdminBookingDetailDto,
  AdminRoomDto,
  AdminRoomTypeDto,
} from "@/src/services/api/admin.types";

type Props = {
  rooms: AdminRoomDto[];
  roomTypes: AdminRoomTypeDto[];
  onSelectBooking: (bookingId: string) => void;
  onBookingCreated: (booking: AdminBookingDetailDto) => Promise<void> | void;
};

export default function AdminCreateBookingView({
  rooms,
  roomTypes,
  onSelectBooking,
  onBookingCreated,
}: Props) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [startDate, setStartDate] = useState(getTodayInputDate());
  const [endDate, setEndDate] = useState(addDaysToInputDate(getTodayInputDate(), 1));
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [roomId, setRoomId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.number.localeCompare(b.number);
    });
  }, [rooms]);

  const selectedRoom = useMemo(
    () => sortedRooms.find((room) => room.id === roomId) ?? null,
    [sortedRooms, roomId]
  );

  const selectedRoomType = useMemo(() => {
    if (!selectedRoom) return null;
    return roomTypes.find((type) => type.id === selectedRoom.roomTypeId) ?? null;
  }, [selectedRoom, roomTypes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const created = await createAdminBooking({
        guestName,
        guestEmail,
        startDate,
        endDate,
        adults: Number(adults),
        children: Number(children),
        roomId,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      await onBookingCreated(created);
      onSelectBooking(created.id);

      setGuestName("");
      setGuestEmail("");
      setStartDate(getTodayInputDate());
      setEndDate(addDaysToInputDate(getTodayInputDate(), 1));
      setAdults("1");
      setChildren("0");
      setRoomId("");
      setNotes("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la réservation."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#ece5d8] px-5 py-5">
        <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
          Nouvelle réservation
        </h2>
        <p className="mt-3 text-sm text-[#6c675f]">
          Saisie manuelle pour créer une réservation depuis l’interface admin.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 p-5 xl:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
              Nom du client
            </label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
              Email
            </label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                Arrivée
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
                required
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
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                Adultes
              </label>
              <input
                type="number"
                min={1}
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
                required
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
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
              Notes <span className="text-[#8a847b]">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ex : arrivée tardive, préférence, info utile..."
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 resize-none"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[20px] border border-[#e3dbcf] bg-[#fcfaf7] p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
              Chambre
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
              required
            >
              <option value="">Choisir une chambre</option>
              {sortedRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Chambre {room.number} — étage {room.floor}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 text-sm text-[#1e1e1e]">
            <p>AdminBookingDto
              <span className="font-medium">Arrivée :</span>{" "}
              {startDate ? formatHumanDate(startDate) : "—"}
            </p>
            <p>
              <span className="font-medium">Départ :</span>{" "}
              {endDate ? formatHumanDate(endDate) : "—"}
            </p>
            <p>
              <span className="font-medium">Chambre :</span>{" "}
              {selectedRoom
                ? `${selectedRoom.number} — étage ${selectedRoom.floor}`
                : "à choisir"}
            </p>
            {selectedRoomType ? (
              <p>
                <span className="font-medium">Type :</span> {selectedRoomType.name}
              </p>
            ) : null}
            {notes.trim() ? (
              <p className="pt-1 text-[#5f594f]">
                <span className="font-medium">Notes :</span> {notes}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-[#e2c1c1] bg-[#fff8f8] px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full cursor-pointer rounded-xl bg-[#314835] px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Création..." : "Créer la réservation"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function getTodayInputDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
}

function addDaysToInputDate(input: string, days: number) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatHumanDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}