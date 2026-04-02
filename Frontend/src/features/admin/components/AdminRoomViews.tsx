"use client";

import { useMemo, useState } from "react";
import type {
  AdminRoomDto,
  AdminRoomStatus,
  AdminRoomTypeDto,
} from "@/features/admin/types";

type AdminRoomsViewProps = {
  rooms: AdminRoomDto[];
  roomTypes: AdminRoomTypeDto[];
  busy?: boolean;
  onAddRoom: (input: {
    floor: number;
    number: string;
    roomTypeId: string;
    status: AdminRoomStatus;
  }) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onUpdateRoomStatus: (
    roomId: string,
    status: AdminRoomStatus
  ) => Promise<void>;
};

export default function AdminRoomsView({
  rooms,
  roomTypes,
  busy = false,
  onAddRoom,
  onDeleteRoom,
  onUpdateRoomStatus,
}: AdminRoomsViewProps) {
  const floors = useMemo(() => {
    return [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b);
  }, [rooms]);

  const [modalFloor, setModalFloor] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function safeAction(action: () => Promise<void>) {
    setError("");

    try {
      await action();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue."
      );
    }
  }

  return (
    <>
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-[#1e1e1e]">Chambres</h2>
          <p className="mt-1 text-sm text-[#6c675f]">
            Gestion par étage, avec lecture simple et actions claires.
          </p>
        </div>

        {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

        <div className="space-y-8">
          {floors.map((floor) => {
            const floorRooms = rooms
              .filter((room) => room.floor === floor)
              .sort((a, b) => a.number.localeCompare(b.number));

            return (
              <FloorSection
                key={floor}
                floor={floor}
                rooms={floorRooms}
                roomTypes={roomTypes}
                busy={busy}
                onOpenAddRoom={() => setModalFloor(floor)}
                onDeleteRoom={(roomId) =>
                  safeAction(() => onDeleteRoom(roomId))
                }
                onUpdateRoomStatus={(roomId, status) =>
                  safeAction(() => onUpdateRoomStatus(roomId, status))
                }
              />
            );
          })}
        </div>
      </section>

      {modalFloor !== null ? (
        <AddRoomModal
          floor={modalFloor}
          roomTypes={roomTypes}
          busy={busy}
          onClose={() => setModalFloor(null)}
          onSubmit={async (input) => {
            await safeAction(() => onAddRoom(input));
            setModalFloor(null);
          }}
        />
      ) : null}
    </>
  );
}

function FloorSection({
  floor,
  rooms,
  roomTypes,
  busy,
  onOpenAddRoom,
  onDeleteRoom,
  onUpdateRoomStatus,
}: {
  floor: number;
  rooms: AdminRoomDto[];
  roomTypes: AdminRoomTypeDto[];
  busy: boolean;
  onOpenAddRoom: () => void;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onUpdateRoomStatus: (roomId: string, status: AdminRoomStatus) => Promise<void>;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#e6dfd3] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[#1e1e1e]">Étage {floor}</h3>
          <p className="text-sm text-[#6c675f]">
            {rooms.length} chambre{rooms.length > 1 ? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddRoom}
          disabled={busy}
          className="w-fit cursor-pointer rounded-full border border-[#314835] px-4 py-2 text-sm font-semibold text-[#314835] transition hover:bg-[#314835] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ajouter une chambre
        </button>
      </div>

      <div className="hidden grid-cols-[115px_1.1fr_110px_160px_1.5fr] border-b border-[#e6dfd3] bg-[#f5f0e7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#756f67] md:grid">
        <div>Chambre</div>
        <div>Type</div>
        <div>Capacité</div>
        <div>Statut</div>
        <div className="text-center">Actions</div>
      </div>

      <div className="divide-y divide-[#e6dfd3]">
        {rooms.map((room) => {
          const roomType = roomTypes.find((type) => type.id === room.roomTypeId);

          return (
            <div
              key={room.id}
              className="grid gap-4 px-5 py-4 md:grid-cols-[115px_1.1fr_110px_160px_1.5fr] md:items-center"
            >
              <InfoCell label="Chambre" value={room.number} strong />
              <InfoCell label="Type" value={roomType?.name ?? "—"} />
              <InfoCell label="Capacité" value={String(roomType?.capacity ?? "—")} />

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847b] md:hidden">
                  Statut
                </div>
                <StatusCell status={room.status} />
              </div>

              <div className="flex h-full items-center justify-center">
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                  {room.status !== "available" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onUpdateRoomStatus(room.id, "available")}
                      className="cursor-pointer font-medium text-[#314835] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Marquer disponible
                    </button>
                  ) : null}

                  {room.status !== "occupied" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onUpdateRoomStatus(room.id, "occupied")}
                      className="cursor-pointer font-medium text-[#314835] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Marquer occupée
                    </button>
                  ) : null}

                  {room.status !== "maintenance" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onUpdateRoomStatus(room.id, "maintenance")}
                      className="cursor-pointer font-medium text-[#314835] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Passer en maintenance
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDeleteRoom(room.id)}
                    className="cursor-pointer font-medium text-red-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
        {label}
      </div>
      <div
        className={
          strong
            ? "text-[2rem] font-semibold leading-none text-[#1e1e1e]"
            : "text-base text-[#1e1e1e]"
        }
      >
        {value}
      </div>
    </div>
  );
}

function StatusCell({ status }: { status: AdminRoomStatus }) {
  const label = formatStatus(status);
  const classes = getStatusClasses(status);

  return (
    <div
      className={`inline-flex min-w-[132px] items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold ${classes}`}
    >
      {label}
    </div>
  );
}

function getStatusClasses(status: AdminRoomStatus) {
  switch (status) {
    case "available":
      return "border-[#bfd5c4] bg-[#e7f3ea] text-[#22422a]";
    case "occupied":
      return "border-[#e2d5b8] bg-[#f7f0de] text-[#6b5423]";
    case "maintenance":
      return "border-[#e2c1c1] bg-[#f8e6e6] text-[#7b2d2d]";
    default:
      return "border-[#d8d0c2] bg-white text-[#1e1e1e]";
  }
}

function formatStatus(status: AdminRoomStatus) {
  switch (status) {
    case "available":
      return "Disponible";
    case "occupied":
      return "Occupée";
    case "maintenance":
      return "Maintenance";
    default:
      return status;
  }
}

function AddRoomModal({
  floor,
  roomTypes,
  busy,
  onClose,
  onSubmit,
}: {
  floor: number;
  roomTypes: AdminRoomTypeDto[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: {
    floor: number;
    number: string;
    roomTypeId: string;
    status: AdminRoomStatus;
  }) => Promise<void>;
}) {
  const [number, setNumber] = useState("");
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [status, setStatus] = useState<AdminRoomStatus>("available");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!number.trim() || !roomTypeId) return;

    await onSubmit({
      floor,
      number: number.trim(),
      roomTypeId,
      status,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-[18px] border border-[#d8d0c2] bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#1e1e1e]">
              Ajouter une chambre
            </h3>
            <p className="mt-1 text-sm text-[#6c675f]">Étage {floor}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-[#d8d0c2] px-4 py-2 text-sm text-[#1e1e1e]"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
              Numéro de chambre
            </label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="204"
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
              Type de chambre
            </label>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
            >
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} — {type.capacity} pers.
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
              Statut initial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminRoomStatus)}
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
            >
              <option value="available">Disponible</option>
              <option value="occupied">Occupée</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2.5 text-sm font-medium text-[#1e1e1e]"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer rounded-xl bg-[#314835] px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Ajout..." : "Ajouter la chambre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
