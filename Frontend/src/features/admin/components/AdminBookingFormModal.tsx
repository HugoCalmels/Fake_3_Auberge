"use client";

import { useEffect, useMemo, useState } from "react";
import { createAdminBooking } from "@/features/admin/api/adminBookings.api";
import type {
  AdminBookingDetailDto,
  AdminRoomDto,
  AdminRoomTypeDto,
} from "@/features/admin/types";

type Props = {
  open: boolean;
  initialStartDate: string;
  initialEndDate: string;
  initialRoomId?: string;
  lockRoom?: boolean;
  rooms: AdminRoomDto[];
  roomTypes: AdminRoomTypeDto[];
  onClose: () => void;
  onCreated: (booking: AdminBookingDetailDto) => Promise<void> | void;
};

export default function AdminBookingFormModal({
  open,
  initialStartDate,
  initialEndDate,
  initialRoomId = "",
  lockRoom = false,
  rooms,
  roomTypes,
  onClose,
  onCreated,
}: Props) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [roomId, setRoomId] = useState(initialRoomId);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setRoomId(initialRoomId);
    setNotes("");
    setError("");
  }, [open, initialStartDate, initialEndDate, initialRoomId]);

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

      await onCreated(created);

      setGuestName("");
      setGuestEmail("");
      setStartDate("");
      setEndDate("");
      setAdults("1");
      setChildren("0");
      setRoomId("");
      setNotes("");

      onClose();
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 px-4">
      <div className="w-full max-w-3xl rounded-[26px] border border-[#d8d0c2] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#ece5d8] px-6 py-5">
          <div>
            <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
              Nouvelle réservation
            </h2>
            <p className="mt-2 text-sm text-[#6c675f]">
              Création rapide depuis le planning.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] hover:bg-[#faf6ef]"
          >
            Fermer
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.9fr]"
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                placeholder="Ex : arrivée tardive, préférence de chambre, information utile..."
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
                disabled={lockRoom}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 disabled:bg-[#f5f2eb] disabled:text-[#6c675f]"
                required
              >
                <option value="">Choisir une chambre</option>
                {sortedRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Chambre {room.number} — étage {room.floor}
                  </option>
                ))}
              </select>

              {lockRoom ? (
                <p className="mt-2 text-xs text-[#8a847b]">
                  Chambre préremplie depuis la case cliquée.
                </p>
              ) : null}
            </div>

            <div className="space-y-2 text-sm text-[#1e1e1e]">
              <p>
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
                  <span className="font-medium">Type :</span>{" "}
                  {selectedRoomType.name}
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
      </div>
    </div>
  );
}

function formatHumanDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
