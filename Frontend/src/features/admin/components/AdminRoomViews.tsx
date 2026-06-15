"use client";

import { useMemo, useState } from "react";
import type {
  AdminRoomDto,
  AdminRoomStatus,
  AdminRoomTypeDto,
} from "@/features/admin/types";

type Props = {
  rooms: AdminRoomDto[];
  roomTypes: AdminRoomTypeDto[];
  busy?: boolean;
  onAddRoom: (input: {
    number: string;
    roomTypeId: string;
    status: AdminRoomStatus;
  }) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onUpdateRoomStatus: (
    roomId: string,
    status: AdminRoomStatus,
  ) => Promise<void>;
};

export default function AdminRoomsView({
  rooms,
  roomTypes,
  busy = false,
  onAddRoom,
  onDeleteRoom,
  onUpdateRoomStatus,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) =>
      a.number.localeCompare(b.number, "fr", { numeric: true }),
    );
  }, [rooms]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter((room) => room.status === "available").length,
      maintenance: rooms.filter((room) => room.status === "maintenance")
        .length,
    };
  }, [rooms]);

  async function safeAction(action: () => Promise<void>) {
    setError("");

    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-[22px] border border-[#d8d0c2] bg-white shadow-sm">
        <div className="border-b border-[#ece5d8] px-5 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#1e1e1e]">
                Chambres
              </h2>
              <p className="mt-2 max-w-[640px] text-sm leading-6 text-[#6c675f]">
                Gère l’inventaire des chambres physiques : numéro, type
                commercial et état technique.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full border border-[#d8d0c2] bg-[#fcfaf7] px-3 py-1 text-[#6c675f]">
                  {stats.total} chambre{stats.total > 1 ? "s" : ""}
                </span>
                <span className="rounded-full border border-[#0B8043]/20 bg-[#0B8043]/5 px-3 py-1 text-[#0B8043]">
                  {stats.available} active{stats.available > 1 ? "s" : ""}
                </span>
                <span className="rounded-full border border-[#F6BF26]/30 bg-[#F6BF26]/10 px-3 py-1 text-[#7A5A00]">
                  {stats.maintenance} maintenance
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={busy || roomTypes.length === 0}
              onClick={() => setCreateOpen(true)}
              className="w-fit cursor-pointer rounded-xl bg-[#314835] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b563f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ajouter une chambre
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/10 px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}
        </div>

        {!sortedRooms.length ? (
          <div className="px-5 py-8 text-sm text-[#6c675f]">
            Aucune chambre créée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ece5d8] bg-[#fcfaf7]">
                  <TableHead>Chambre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacité</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>État technique</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </thead>

              <tbody>
                {sortedRooms.map((room) => {
                  const roomType = roomTypes.find(
                    (type) => type.id === room.roomTypeId,
                  );
                  const statusConfig = getStatusConfig(room.status);

                  return (
                    <tr
                      key={room.id}
                      className={`border-b border-[#ece5d8] transition hover:bg-[#fcfaf7] ${statusConfig.row}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] text-[#8a847b]">#</span>
                          <span className="text-base font-semibold text-[#1e1e1e]">
                            {room.number}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[260px] truncate text-sm font-medium text-[#1e1e1e]">
                          {roomType?.name ?? "Type inconnu"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-[#6c675f]">
                          {roomType ? `${roomType.maxCapacity} pers.` : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-[#6c675f]">
                          {roomType ? `${roomType.basePrice} €/nuit` : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={room.status} />
                      </TableCell>

                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          {room.status !== "available" ? (
                            <IconActionButton
                              label="Activer"
                              disabled={busy}
                              onClick={() =>
                                safeAction(() =>
                                  onUpdateRoomStatus(room.id, "available"),
                                )
                              }
                            >
                              ✓
                            </IconActionButton>
                          ) : null}

                          {room.status !== "maintenance" ? (
                            <IconActionButton
                              label="Mettre en maintenance"
                              disabled={busy}
                              onClick={() =>
                                safeAction(() =>
                                  onUpdateRoomStatus(room.id, "maintenance"),
                                )
                              }
                            >
                              ⚙
                            </IconActionButton>
                          ) : null}

                          <IconActionButton
                            label="Supprimer"
                            danger
                            disabled={busy}
                            onClick={() => {
                              const confirmed = window.confirm(
                                "Supprimer cette chambre ?",
                              );

                              if (!confirmed) return;

                              void safeAction(() => onDeleteRoom(room.id));
                            }}
                          >
                            ×
                          </IconActionButton>
                        </div>
                      </TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {createOpen ? (
        <AddRoomModal
          roomTypes={roomTypes}
          busy={busy}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            await safeAction(() => onAddRoom(input));
            setCreateOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function AddRoomModal({
  roomTypes,
  busy,
  onClose,
  onSubmit,
}: {
  roomTypes: AdminRoomTypeDto[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: {
    number: string;
    roomTypeId: string;
    status: AdminRoomStatus;
  }) => Promise<void>;
}) {
  const [number, setNumber] = useState("");
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [status, setStatus] = useState<AdminRoomStatus>("available");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!number.trim() || !roomTypeId) return;

    await onSubmit({
      number: number.trim(),
      roomTypeId,
      status,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="w-full max-w-[560px] rounded-[24px] border border-[#d8d0c2] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#1e1e1e]">
              Ajouter une chambre
            </h3>
 
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Numéro de chambre">
            <input
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder="101"
              required
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
            />
          </Field>

          <Field label="Type de chambre">
            <select
              value={roomTypeId}
              onChange={(event) => setRoomTypeId(event.target.value)}
              required
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
            >
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} · {type.maxCapacity} pers. · {type.basePrice} €
                </option>
              ))}
            </select>
          </Field>

          <Field label="État technique initial">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AdminRoomStatus)
              }
              className="w-full rounded-xl border border-[#d8d0c2] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
            >
              <option value="available">Active</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2.5 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer rounded-xl bg-[#314835] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b563f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-5 py-3 align-middle ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#1e1e1e]">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: AdminRoomStatus }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${config.classes}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function getStatusConfig(status: AdminRoomStatus) {
  if (status === "maintenance") {
    return {
      label: "Maintenance",
      classes: "border-[#F6BF26]/40 bg-[#F6BF26]/10 text-[#7A5A00]",
      dot: "bg-[#F6BF26]",
      row: "bg-[#F6BF26]/[0.06]",
    };
  }

  return {
    label: "Active",
    classes: "border-[#0B8043]/30 bg-[#0B8043]/10 text-[#0B8043]",
    dot: "bg-[#0B8043]",
    row: "bg-[#0B8043]/[0.04]",
  };
}

function IconActionButton({
  children,
  label,
  danger = false,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-[#B91C1C]/40 text-[#B91C1C] hover:bg-[#B91C1C]/10"
          : "border-[#d8d0c2] text-[#314835] hover:bg-[#faf6ef]"
      }`}
    >
      {children}
    </button>
  );
}