"use client";

import { useState } from "react";
import {
  getAdminRoomTypeImageSrc,
  uploadAdminRoomTypeImage,
} from "@/features/admin/api/adminRoomTypes.api";
import type {
  AdminRoomTypeDto,
  CreateAdminRoomTypePayload,
  UpdateAdminRoomTypePayload,
} from "@/features/admin/types";

type Props = {
  roomTypes: AdminRoomTypeDto[];
  busy: boolean;
  onAddRoomType: (input: CreateAdminRoomTypePayload) => Promise<void>;
  onUpdateRoomType: (
    roomTypeId: string,
    input: UpdateAdminRoomTypePayload,
  ) => Promise<void>;
  onDeleteRoomType: (roomTypeId: string) => Promise<void>;
};

export default function AdminRoomTypesView({
  roomTypes,
  busy,
  onAddRoomType,
  onUpdateRoomType,
  onDeleteRoomType,
}: Props) {
  const [editing, setEditing] = useState<AdminRoomTypeDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");

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
                Types de chambres
              </h2>
              <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#6c675f]">
                Gère les produits vendus : nom, description, capacité, prix de
                base et image.
              </p>

              <p className="mt-3 text-sm text-[#8a847b]">
                {roomTypes.length} type{roomTypes.length > 1 ? "s" : ""} de
                chambre
              </p>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => setCreateOpen(true)}
              className="w-fit cursor-pointer rounded-xl bg-[#314835] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b563f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ajouter un type
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/10 px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}
        </div>

        {!roomTypes.length ? (
          <div className="px-5 py-8 text-sm text-[#6c675f]">
            Aucun type de chambre créé.
          </div>
        ) : (
          <div>
            {roomTypes.map((type, index) => (
              <article
                key={type.id}
                className={`grid gap-4 px-5 py-4 transition hover:bg-[#fcfaf7] md:grid-cols-[150px_minmax(0,1fr)_110px_110px_190px] md:items-center ${
                  index !== roomTypes.length - 1
                    ? "border-b border-[#ece5d8]"
                    : ""
                }`}
              >
                <div className="overflow-hidden rounded-[14px] border border-[#e3dbcf] bg-[#f3eee6]">
                  {type.imageUrl ? (
                    <img
                      src={getAdminRoomTypeImageSrc(type.imageUrl)}
                      alt={type.name}
                      className="h-[92px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[92px] w-full items-center justify-center text-xs text-[#8a847b]">
                      Image
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
                    Type
                  </p>
                  <h3 className="mt-1 truncate text-base font-semibold text-[#1e1e1e]">
                    {type.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6c675f]">
                    {type.description}
                  </p>
                </div>

                <InfoCell label="Capacité" value={`${type.maxCapacity} pers.`} />
                <InfoCell label="Prix" value={`${type.basePrice} €`} />

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <TableActionButton disabled={busy} onClick={() => setEditing(type)}>
                    Modifier
                  </TableActionButton>

                  <TableActionButton
                    danger
                    disabled={busy}
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Supprimer ce type de chambre ?",
                      );

                      if (!confirmed) return;

                      void safeAction(() => onDeleteRoomType(type.id));
                    }}
                  >
                    Supprimer
                  </TableActionButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {createOpen ? (
        <RoomTypeModal
          title="Ajouter un type"
          busy={busy}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            await safeAction(() =>
              onAddRoomType(input as CreateAdminRoomTypePayload),
            );
            setCreateOpen(false);
          }}
        />
      ) : null}

      {editing ? (
        <RoomTypeModal
          title="Modifier le type"
          initialValue={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            await safeAction(() =>
              onUpdateRoomType(editing.id, input as UpdateAdminRoomTypePayload),
            );
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function RoomTypeModal({
  title,
  initialValue,
  busy,
  onClose,
  onSubmit,
}: {
  title: string;
  initialValue?: AdminRoomTypeDto;
  busy: boolean;
  onClose: () => void;
  onSubmit: (
    input: CreateAdminRoomTypePayload | UpdateAdminRoomTypePayload,
  ) => Promise<void>;
}) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [description, setDescription] = useState(
    initialValue?.description ?? "",
  );
  const [maxCapacity, setMaxCapacity] = useState(
    String(initialValue?.maxCapacity ?? 2),
  );
  const [basePrice, setBasePrice] = useState(
    String(initialValue?.basePrice ?? 80),
  );
  const [imageUrl, setImageUrl] = useState(initialValue?.imageUrl ?? "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const cleanImageUrl = imageUrl.trim();

    if (!cleanName || !cleanDescription) return;

    await onSubmit({
      name: cleanName,
      description: cleanDescription,
      maxCapacity: Number(maxCapacity),
      basePrice: Number(basePrice),
      imageUrl: cleanImageUrl || undefined,
    });
  }

  async function handleImageUpload(file: File) {
    setUploadError("");

    try {
      setUploadingImage(true);
      const result = await uploadAdminRoomTypeImage(file);
      setImageUrl(result.imageUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Impossible d'envoyer l'image.",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="max-h-[94vh] w-full max-w-[720px] overflow-y-auto rounded-[24px] border border-[#d8d0c2] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[#1e1e1e]">{title}</h3>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Nom">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Chambre double"
              required
              className="w-full rounded-xl border border-[#d8d0c2] px-4 py-3 text-sm outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              required
              className="w-full resize-none rounded-xl border border-[#d8d0c2] px-4 py-3 text-sm outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Capacité max">
              <input
                value={maxCapacity}
                onChange={(event) => setMaxCapacity(event.target.value)}
                type="number"
                min={1}
                required
                className="w-full rounded-xl border border-[#d8d0c2] px-4 py-3 text-sm outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
              />
            </Field>

            <Field label="Prix de base / nuit">
              <input
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                type="number"
                min={0}
                required
                className="w-full rounded-xl border border-[#d8d0c2] px-4 py-3 text-sm outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
              />
            </Field>
          </div>

          <Field label="Image">
            <div className="space-y-3">
              {imageUrl ? (
                <div className="overflow-hidden rounded-xl border border-[#d8d0c2] bg-[#f3eee6]">
                  <img
                    src={getAdminRoomTypeImageSrc(imageUrl)}
                    alt="Aperçu chambre"
                    className="h-[190px] w-full object-cover"
                  />
                </div>
              ) : null}
<label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#d8d0c2] bg-[#fcfaf7] px-4 py-6 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]">
  {uploadingImage ? "Upload en cours..." : "Choisir une image"}

  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    disabled={busy || uploadingImage}
    onChange={(event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      void handleImageUpload(file);
    }}
    className="hidden"
  />
</label>



              {uploadingImage ? (
                <p className="text-sm text-[#6c675f]">Upload en cours...</p>
              ) : null}

              {uploadError ? (
                <p className="text-sm text-[#B91C1C]">{uploadError}</p>
              ) : null}
            </div>
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
              disabled={busy || uploadingImage}
              className="cursor-pointer rounded-xl bg-[#314835] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b563f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#1e1e1e]">{value}</p>
    </div>
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

function TableActionButton({
  children,
  danger = false,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-[#B91C1C]/50 text-[#B91C1C] hover:bg-[#B91C1C]/10"
          : "border-[#d8d0c2] text-[#314835] hover:bg-[#faf6ef]"
      }`}
    >
      {children}
    </button>
  );
}