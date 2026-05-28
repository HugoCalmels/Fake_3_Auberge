"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminBookingDetails } from "@/features/admin/hooks/useAdminBookingDetails";
import { getBookingAvailability } from "@/features/booking/api/bookings.api";
import type { MealPlanCode } from "@/features/booking/api/bookings.api";
import type {
  AdminBookingDetailDto,
  AdminBookingStatus,
  AdminPaymentStatus,
  AdminRoomDto,
  AdminRoomTypeDto,
} from "@/features/admin/types";

type BookingAvailabilityResponse = Awaited<
  ReturnType<typeof getBookingAvailability>
>;

type ApiRoomAvailability = BookingAvailabilityResponse["roomTypes"][number];

type AdminRoomAvailability = ApiRoomAvailability & {
  availableRooms: number;
  mealPlans: NonNullable<ApiRoomAvailability["mealPlans"]>;
};

type Props = {
  open: boolean;
  bookingId: string | null;
  rooms?: AdminRoomDto[];
  roomTypes?: AdminRoomTypeDto[];
  onClose: () => void;
  onUpdated: (booking: AdminBookingDetailDto) => Promise<void> | void;
};

const BOOKING_STATUS_OPTIONS: Array<{
  value: AdminBookingStatus;
  label: string;
}> = [
  { value: "confirmed", label: "Réservée" },
  { value: "checked_in", label: "Arrivé (checkin)" },
  { value: "checked_out", label: "Parti (checkout)" },
  { value: "no_show", label: "Pas venu" },
];

export default function AdminBookingDetailView({
  open,
  bookingId,
  rooms = [],
  roomTypes = [],
  onClose,
  onUpdated,
}: Props) {
  const safeBookingId = bookingId ?? "";

  const {
    booking,
    loading,
    busy,
    error,
    sortedRooms,
    canCancel,

    startDate,
    endDate,
    adults,
    children,
    notes,
    guestPhone,
    paymentStatus,
    paymentNote,
    mealPlanCode,
    status,
    newRoomId,

    setStartDate,
    setEndDate,
    setAdults,
    setChildren,
    setNotes,
    setGuestPhone,
    setPaymentStatus,
    setPaymentNote,
    setMealPlanCode,
    setStatus,
    setNewRoomId,

    save,
    assignRoom,
    cancel,
  } = useAdminBookingDetails(safeBookingId, rooms);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [offers, setOffers] = useState<AdminRoomAvailability[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return getNights(startDate, endDate);
  }, [startDate, endDate]);

  const selectedRoom = useMemo(() => {
    if (!newRoomId) return null;
    return sortedRooms.find((room) => room.id === newRoomId) ?? null;
  }, [sortedRooms, newRoomId]);

  const selectedRoomType = useMemo(() => {
    if (!selectedRoom) return null;
    return roomTypes.find((type) => type.id === selectedRoom.roomTypeId) ?? null;
  }, [selectedRoom, roomTypes]);

  const selectedOffer = useMemo(() => {
    if (!selectedRoomType) return null;
    return offers.find((offer) => offer.id === selectedRoomType.id) ?? null;
  }, [offers, selectedRoomType]);

  const selectedMealPlan = useMemo(() => {
    return (
      selectedOffer?.mealPlans.find((plan) => plan.code === mealPlanCode) ??
      selectedOffer?.mealPlans[0] ??
      null
    );
  }, [selectedOffer, mealPlanCode]);

  const maxCapacity =
    selectedOffer?.maxCapacity ??
    selectedRoomType?.maxCapacity ??
    Math.max(1, Number(adults) + Number(children));

  const persons = Number(adults) + Number(children);

  const estimatedRoomPrice =
    (selectedOffer?.basePrice ?? selectedRoomType?.basePrice ?? 0) * nights;

  const estimatedMealPlanPrice =
    selectedMealPlan && nights > 0
      ? ((selectedMealPlan.adultPrice ?? 0) * Number(adults) +
          (selectedMealPlan.childPrice ?? 0) * Number(children)) *
        nights
      : 0;

  const estimatedTotalPrice = estimatedRoomPrice + estimatedMealPlanPrice;

  const displayedRoomNumber = selectedRoom?.number ?? booking?.roomNumber ?? "—";
  const displayedRoomType =
    selectedRoomType?.name ?? booking?.roomTypeName ?? "Type inconnu";

  useEffect(() => {
    if (!booking) return;
    setGuestName(booking.guestName);
    setGuestEmail(booking.guestEmail);
  }, [booking]);

  useEffect(() => {
    if (!open) return;
    if (!startDate || !endDate) return;
    if (new Date(endDate) <= new Date(startDate)) return;

    async function loadAvailability() {
      try {
        setIsLoadingAvailability(true);
        setAvailabilityError("");

        const response = await getBookingAvailability({ startDate, endDate });
        setOffers(normalizeRoomAvailabilities(response.roomTypes));
      } catch (err) {
        setOffers([]);
        setAvailabilityError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les disponibilités.",
        );
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    void loadAvailability();
  }, [open, startDate, endDate]);

  useEffect(() => {
    if (!selectedOffer) return;
    if (selectedOffer.mealPlans.some((plan) => plan.code === mealPlanCode)) {
      return;
    }

    setMealPlanCode(selectedOffer.mealPlans[0]?.code ?? "room_only");
  }, [selectedOffer, mealPlanCode, setMealPlanCode]);

  async function handleSaveClick() {
    if (busy) return;

    if (booking && newRoomId !== booking.roomId) {
      const roomSuccess = await assignRoom(onUpdated);
      if (!roomSuccess) return;
    }

    const success = await save(onUpdated);
    if (success) onClose();
  }

  async function handleCancelBooking() {
    if (!booking || !canCancel || busy) return;

    const confirmed = window.confirm(
      "Confirmer l'annulation de cette réservation ?",
    );

    if (!confirmed) return;

    const success = await cancel(onUpdated);
    if (success) onClose();
  }

  if (!open || !bookingId) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="flex h-[94vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-[28px] border border-[#d8d0c2] bg-white shadow-2xl">
        <div className="border-b border-[#ece5d8] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
                Chambre {displayedRoomNumber}
              </h2>
              <p className="mt-2 text-sm font-medium text-[#6c675f]">
                Modifier une réservation
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusDropdown
                status={status}
                disabled={busy}
                onChange={setStatus}
              />

              <button
                type="button"
                onClick={onClose}
                className="h-[42px] rounded-xl border border-[#d8d0c2] bg-white px-4 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[#6c675f]">
            Chargement de la réservation...
          </div>
        ) : !booking ? (
          <div className="p-6 text-sm text-red-700">
            Réservation introuvable.
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-0 overflow-y-auto bg-[#fffdfa] p-5">
              <div className="space-y-5">
                <div className="grid gap-5 xl:grid-cols-2">
                  <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-5">
                    <SectionTitle
                      eyebrow="Section 1"
                      title="Informations client"
                    />

                    <div className="mt-4 space-y-4">
                      <Field label="Nom du client">
                        <TextInput
                          value={guestName}
                          onChange={setGuestName}
                          disabled={busy}
                        />
                      </Field>

                      <Field label="Email">
                        <TextInput
                          type="email"
                          value={guestEmail}
                          onChange={setGuestEmail}
                          disabled={busy}
                        />
                      </Field>

                      <Field label="Téléphone">
                        <TextInput
                          type="tel"
                          value={guestPhone}
                          onChange={setGuestPhone}
                          placeholder="Optionnel"
                          disabled={busy}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-5">
                    <SectionTitle eyebrow="Section 2" title="Séjour" />

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Field label="Arrivée">
                        <TextInput
                          type="date"
                          value={startDate}
                          onChange={setStartDate}
                          disabled={busy}
                        />
                      </Field>

                      <Field label="Départ">
                        <TextInput
                          type="date"
                          value={endDate}
                          onChange={setEndDate}
                          disabled={busy}
                        />
                      </Field>
                    </div>

                    <div className="mt-4">
                      <Field label="Notes internes">
                        <TextArea
                          value={notes}
                          onChange={setNotes}
                          rows={5}
                          placeholder="Arrivée tardive, préférence, info utile..."
                          disabled={busy}
                        />
                      </Field>
                    </div>
                  </section>
                </div>

                <section className="rounded-[20px] border border-[#d8d0c2] bg-white p-5">
                  <SectionTitle eyebrow="Section 3" title="Paiement" />

                  <div className="mt-4 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#1e1e1e]">
                        Statut paiement
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        {(["unpaid", "paid"] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            disabled={busy}
                            onClick={() => setPaymentStatus(value)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                              paymentStatus === value
                                ? "border-[#314835] bg-[#314835] text-white"
                                : "border-[#d8d0c2] bg-white text-[#314835] hover:bg-[#faf6ef]"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {getPaymentStatusLabel(value)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#1e1e1e]">
                        Note de paiement
                      </label>

                      <TextArea
                        value={paymentNote}
                        onChange={setPaymentNote}
                        rows={3}
                        placeholder="Optionnel"
                        disabled={busy}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-[20px] border border-[#d8d0c2] bg-white">
                  <div className="border-b border-[#ece5d8] px-5 py-4">
                    <SectionTitle
                      eyebrow="Section 4"
                      title="Chambre et formule"
                    />
                  </div>

                  <div className="px-5 py-4">
                    <article className="rounded-[22px] border border-[#d8d0c2] bg-[#fcfaf7] p-4">
                      <div className="grid gap-4 xl:grid-cols-[130px_minmax(0,1fr)_120px]">
                        <div className="aspect-square overflow-hidden rounded-[16px] border border-[#ddd4c6] bg-[#f3eee6]">
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#8a847b]">
                            Image
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
                                Chambre sélectionnée
                              </p>

                              <h3 className="mt-1 text-[18px] font-semibold text-[#1e1e1e]">
                                Chambre {displayedRoomNumber}
                              </h3>

                              <p className="mt-1 text-sm text-[#314835]">
                                {displayedRoomType}
                                {selectedRoom?.floor
                                  ? ` · étage ${selectedRoom.floor}`
                                  : ""}
                                {maxCapacity
                                  ? ` · jusqu’à ${maxCapacity} personnes`
                                  : ""}
                              </p>
                            </div>

                            <div className="rounded-full bg-[#e7f3ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#22422a]">
                              {newRoomId === booking.roomId
                                ? "Actuelle"
                                : "Nouvelle"}
                            </div>
                          </div>

                          {availabilityError ? (
                            <div className="mt-3 rounded-xl border border-[#e2c1c1] bg-[#fff8f8] px-3 py-2 text-sm text-red-700">
                              {availabilityError}
                            </div>
                          ) : null}

                          <div className="mt-4 grid gap-3 md:max-w-[620px] md:grid-cols-4">
                            <div className="md:col-span-2">
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                                Chambre
                              </label>

                              <SelectInput
                                value={newRoomId}
                                onChange={setNewRoomId}
                                disabled={busy}
                                options={sortedRooms.map((room) => ({
                                  value: room.id,
                                  label: `Chambre ${room.number} · étage ${room.floor}`,
                                }))}
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                                Adultes
                              </label>

                              <SelectInput
                                value={adults}
                                onChange={(value) => {
                                  const nextAdults = Number(value);
                                  setAdults(value);

                                  if (
                                    nextAdults + Number(children) >
                                    maxCapacity
                                  ) {
                                    setChildren(
                                      String(
                                        Math.max(0, maxCapacity - nextAdults),
                                      ),
                                    );
                                  }
                                }}
                                disabled={busy}
                                options={Array.from(
                                  { length: Math.max(1, maxCapacity) },
                                  (_, i) => ({
                                    value: String(i + 1),
                                    label: String(i + 1),
                                  }),
                                )}
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                                Enfants
                              </label>

                              <SelectInput
                                value={children}
                                onChange={setChildren}
                                disabled={busy}
                                options={Array.from(
                                  {
                                    length:
                                      Math.max(
                                        0,
                                        maxCapacity - Number(adults),
                                      ) + 1,
                                  },
                                  (_, i) => ({
                                    value: String(i),
                                    label: String(i),
                                  }),
                                )}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                                Formule
                              </label>

                              <SelectInput
                                value={mealPlanCode}
                                onChange={(value) =>
                                  setMealPlanCode(value as MealPlanCode)
                                }
                                disabled={busy}
                                options={getMealPlanOptions(selectedOffer)}
                              />
                            </div>
                          </div>

                          <p className="mt-4 text-sm text-[#6c675f]">
                            {persons} pers · {nights} nuit
                            {nights > 1 ? "s" : ""}
                            {isLoadingAvailability
                              ? " · chargement des prix..."
                              : ""}
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-2 xl:items-end">
                          <p className="text-xs text-[#8a847b]">
                            Pour {nights} nuit{nights > 1 ? "s" : ""}
                          </p>

                          <p className="text-[26px] font-semibold leading-none text-[#2d2c29]">
                            {estimatedTotalPrice} €
                          </p>

                          {estimatedMealPlanPrice > 0 ? (
                            <p className="text-xs text-[#8a847b]">
                              dont repas : {estimatedMealPlanPrice} €
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </div>
                </section>

                {error ? (
                  <div className="rounded-xl border border-[#e2c1c1] bg-[#fff8f8] px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="min-h-0 overflow-y-auto border-l border-[#ece5d8] bg-[#fcfaf7] p-5">
              <div className="sticky top-0">
                <SectionTitle eyebrow="Résumé" title="Vue d’ensemble" />

                <div className="mt-4 space-y-4 rounded-[20px] border border-[#e3dbcf] bg-white p-4">
                  <StatusSummary status={status} />

                  <SummaryRow label="Client" value={guestName || "à définir"} />
                  <SummaryRow label="Email" value={guestEmail || "à définir"} />
                  <SummaryRow
                    label="Téléphone"
                    value={guestPhone.trim() || "à définir"}
                  />
                  <SummaryRow
                    label="Arrivée"
                    value={startDate ? formatHumanDate(startDate) : "à définir"}
                  />
                  <SummaryRow
                    label="Départ"
                    value={endDate ? formatHumanDate(endDate) : "à définir"}
                  />
                  <SummaryRow
                    label="Durée"
                    value={
                      nights > 0
                        ? `${nights} nuit${nights > 1 ? "s" : ""}`
                        : "à définir"
                    }
                  />
                  <SummaryRow label="Voyageurs" value={`${persons} pers`} />
                  <SummaryRow label="Chambre" value={displayedRoomNumber} />
                  <SummaryRow label="Type" value={displayedRoomType} />
                  <SummaryRow
                    label="Formule"
                    value={getMealPlanLabel(mealPlanCode)}
                  />
                  <SummaryRow
                    label="Paiement"
                    value={getPaymentStatusLabel(paymentStatus)}
                  />

                  {paymentNote.trim() ? (
                    <InfoBlock title="Note paiement">{paymentNote}</InfoBlock>
                  ) : null}
                  {notes.trim() ? (
                    <InfoBlock title="Notes internes">{notes}</InfoBlock>
                  ) : null}
                </div>

                <div className="mt-5 rounded-[20px] border border-[#e3dbcf] bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                    Total estimé
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#2d2c29]">
                    {estimatedTotalPrice} €
                  </p>
                  <p className="mt-1 text-sm text-[#8a847b]">
                    1 ligne · {nights} nuit{nights > 1 ? "s" : ""}
                  </p>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleSaveClick}
                      className="w-full rounded-xl bg-[#314835] px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? "Enregistrement..." : "Enregistrer"}
                    </button>

                    {canCancel ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleCancelBooking}
                        className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? "Annulation..." : "Annuler la réservation"}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full rounded-xl border border-[#d8d0c2] px-4 py-3 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeRoomAvailabilities(
  roomTypes: ApiRoomAvailability[],
): AdminRoomAvailability[] {
  return roomTypes.map((roomType) => ({
    ...roomType,
    availableRooms: roomType.availableRooms ?? 0,
    mealPlans: roomType.mealPlans ?? [],
  }));
}

function StatusDropdown({
  status,
  disabled,
  onChange,
}: {
  status: AdminBookingStatus;
  disabled: boolean;
  onChange: (value: AdminBookingStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex h-[42px] min-w-[172px] items-center justify-between gap-3 rounded-xl border border-[#d8d0c2] bg-white px-4 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{getBookingStatusLabel(status)}</span>
        <span className="text-xs text-[#8a847b]">▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[48px] z-[100] w-[220px] overflow-hidden rounded-xl border border-[#d8d0c2] bg-white shadow-xl">
          {BOOKING_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-[#faf6ef] ${
                status === option.value
                  ? "bg-[#f7f3ec] font-semibold text-[#1e1e1e]"
                  : "text-[#314835]"
              }`}
            >
              <span>{option.label}</span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${getStatusBarColor(
                  option.value,
                )}`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StatusSummary({ status }: { status: AdminBookingStatus }) {
  return (
    <div className="border-b border-[#f0ebe2] pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
        Statut du séjour
      </p>
      <p className="mt-1 text-sm font-semibold text-[#1e1e1e]">
        {getBookingStatusLabel(status)}
      </p>
      <div
        className={`mt-2 h-2 w-[100px] rounded-full transition-colors ${getStatusBarColor(
          status,
        )}`}
      />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a847b]">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-[1.1rem] font-semibold text-[#1e1e1e]">
        {title}
      </h3>
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
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#1e1e1e]">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full rounded-[16px] border border-[#d8d0c2] bg-white px-4 py-3 text-[14px] text-[#1e1e1e] outline-none transition placeholder:text-[#9a9489] focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10 disabled:cursor-not-allowed disabled:bg-[#f7f3ec] disabled:text-[#8a847b]"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full resize-none rounded-[16px] border border-[#d8d0c2] bg-white px-4 py-3 text-[14px] text-[#1e1e1e] outline-none transition placeholder:text-[#9a9489] focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10 disabled:cursor-not-allowed disabled:bg-[#f7f3ec] disabled:text-[#8a847b]"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="w-full rounded-[16px] border border-[#d8d0c2] bg-white px-4 py-3 text-[14px] text-[#1e1e1e] outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10 disabled:cursor-not-allowed disabled:bg-[#f7f3ec] disabled:text-[#8a847b]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0ebe2] pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-[#8a847b]">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-medium text-[#1e1e1e]">
        {value}
      </span>
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#fcfaf7] p-3 text-sm text-[#5f594f]">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
        {title}
      </span>
      <div className="mt-2 whitespace-pre-wrap">{children}</div>
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

function getPaymentStatusLabel(value: AdminPaymentStatus) {
  return value === "paid" ? "Payé" : "Non payé";
}

function getBookingStatusLabel(value: AdminBookingStatus) {
  if (value === "checked_in") return "Arrivé";
  if (value === "checked_out") return "Parti";
  if (value === "no_show") return "Pas venu";
  if (value === "cancelled") return "Annulée";
  if (value === "pending") return "En attente";
  return "Réservée";
}

function getStatusBarColor(status: AdminBookingStatus) {
  if (status === "checked_in") return "bg-[#0B8043]";
  if (status === "checked_out") return "bg-[#616161]";
  if (status === "no_show") return "bg-[#D96A3A]";
  if (status === "cancelled") return "bg-[#B91C1C]";
  if (status === "pending") return "bg-[#F6BF26]";
  return "bg-[#3F51B5]";
}

function getMealPlanLabel(value: MealPlanCode) {
  if (value === "half_board") return "Demi-pension";
  if (value === "full_board") return "Pension complète";
  return "Chambre seule";
}

function getMealPlanOptions(offer: AdminRoomAvailability | null) {
  if (!offer) {
    return [
      { value: "room_only", label: "Chambre seule" },
      { value: "half_board", label: "Demi-pension" },
      { value: "full_board", label: "Pension complète" },
    ];
  }

  return offer.mealPlans.map((plan) => ({
    value: plan.code,
    label: plan.name,
  }));
}

function getNights(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return Math.max(
    0,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}