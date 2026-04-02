"use client";

import { useState } from "react";

import type { AdminRoomTypeDto } from "@/features/admin/types";

type Props = {
  roomTypes: AdminRoomTypeDto[];
  busy: boolean;
  onAddRoomType: (input: {
    code: string;
    name: string;
    capacity: number;
  }) => Promise<void>;
};

export default function AdminRoomTypesView({
  roomTypes,
  busy,
  onAddRoomType,
}: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !code.trim()) return;

    try {
      await onAddRoomType({
        code: code.trim(),
        name: name.trim(),
        capacity: Number(capacity),
      });

      setName("");
      setCode("");
      setCapacity("2");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter le type de chambre.",
      );
    }
  }

  return (
    <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#1e1e1e]">Types de chambres</h2>
        <p className="mt-1 text-sm text-[#6c675f]">
          Gerer les categories visibles dans la reservation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-3 rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-4 md:grid-cols-4"
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom"
          className="rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
        />
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Code"
          className="rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
        />
        <input
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          type="number"
          min={1}
          className="rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5"
        />
        <button
          type="submit"
          disabled={busy}
          className="cursor-pointer rounded-xl bg-[#314835] px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Ajout..." : "Ajouter un type"}
        </button>
      </form>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roomTypes.map((type) => (
          <div
            key={type.id}
            className="rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-5"
          >
            <h3 className="text-xl font-semibold text-[#1e1e1e]">{type.name}</h3>
            <p className="mt-2 text-sm text-[#6c675f]">Code : {type.code}</p>
            <p className="text-sm text-[#6c675f]">Capacite : {type.capacity}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
