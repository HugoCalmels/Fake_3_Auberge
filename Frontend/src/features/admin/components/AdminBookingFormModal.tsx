"use client";

import { useEffect, useMemo, useState } from "react";
import { createAdminBooking } from "@/features/admin/api/adminBookings.api";
import { getBookingAvailability } from "@/features/booking/api/bookings.api";
import type { MealPlanCode } from "@/features/booking/api/bookings.api";
import type {
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

type AdminSelectedRoomLine = {
  lineId: string;
  roomTypeId: string;
  roomName: string;
  adults: number;
  children: number;
  persons: number;
  mealPlanCode: MealPlanCode;
  mealPlanName: string;
  roomPrice: number;
  mealPlanPrice: number;
  totalPrice: number;
  mealPlans: AdminRoomAvailability["mealPlans"];
};

type Props = {
  open: boolean;
  initialStartDate: string;
  initialEndDate: string;
  initialRoomId?: string | null;
  fromPlanning?: boolean;
  lockRoom?: boolean;
  rooms: AdminRoomDto[];
  roomTypes: AdminRoomTypeDto[];
  onClose: () => void;
  onCreated: () => Promise<void> | void;
};

export default function AdminBookingFormModal({
  open,
  initialStartDate,
  initialEndDate,
  initialRoomId = null,
  fromPlanning = false,
  lockRoom = false,
  rooms,
  roomTypes,
  onClose,
  onCreated,
}: Props) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [notes, setNotes] = useState("");

  const [paymentStatus, setPaymentStatus] =
    useState<AdminPaymentStatus>("unpaid");
  const [paymentNote, setPaymentNote] = useState("");

  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [offers, setOffers] = useState<AdminRoomAvailability[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<AdminSelectedRoomLine[]>(
    [],
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  useEffect(() => {
    if (!open) return;

    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setNotes("");
    setPaymentStatus("unpaid");
    setPaymentNote("");
    setRoomTypeFilter("all");
    setOffers([]);
    setSelectedRooms([]);
    setBusy(false);
    setError("");
    setAvailabilityError("");
    setIsLoadingAvailability(false);
  }, [open, initialStartDate, initialEndDate, initialRoomId]);

  const selectedPlanningRoom = useMemo(() => {
    if (!initialRoomId) return null;
    return rooms.find((room) => room.id === initialRoomId) ?? null;
  }, [rooms, initialRoomId]);

  const selectedPlanningRoomType = useMemo(() => {
    if (!selectedPlanningRoom) return null;
    return (
      roomTypes.find((type) => type.id === selectedPlanningRoom.roomTypeId) ??
      null
    );
  }, [selectedPlanningRoom, roomTypes]);

  const isLockedPlanningRoom =
    Boolean(lockRoom || fromPlanning) &&
    Boolean(selectedPlanningRoom) &&
    Boolean(selectedPlanningRoomType);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return Math.max(
      0,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }, [startDate, endDate]);

  const effectiveOffers = useMemo(() => {
    if (isLockedPlanningRoom && selectedPlanningRoomType) {
      return offers.filter((offer) => offer.id === selectedPlanningRoomType.id);
    }

    if (roomTypeFilter === "all") return offers;
    return offers.filter((offer) => offer.code === roomTypeFilter);
  }, [offers, roomTypeFilter, selectedPlanningRoomType, isLockedPlanningRoom]);

  const lockedRoomOffer = useMemo(() => {
    if (!isLockedPlanningRoom || !selectedPlanningRoomType) return null;

    return (
      offers.find((offer) => offer.id === selectedPlanningRoomType.id) ?? null
    );
  }, [offers, selectedPlanningRoomType, isLockedPlanningRoom]);

  const roomTypeOptions = useMemo(() => {
    const unique = new Map<string, string>();

    for (const offer of offers) {
      unique.set(offer.code, offer.name);
    }

    return [
      { value: "all", label: "Toutes les chambres" },
      ...Array.from(unique.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [offers]);

  const totalPrice = useMemo(() => {
    return selectedRooms.reduce((sum, room) => sum + room.totalPrice, 0);
  }, [selectedRooms]);

  const totalPersons = useMemo(() => {
    return selectedRooms.reduce((sum, room) => sum + room.persons, 0);
  }, [selectedRooms]);

  function getSelectedCountForOffer(roomTypeId: string) {
    return selectedRooms.filter((room) => room.roomTypeId === roomTypeId)
      .length;
  }

  async function loadAvailability() {
    if (!startDate || !endDate) return;

    try {
      setIsLoadingAvailability(true);
      setAvailabilityError("");
      setOffers([]);
      setSelectedRooms([]);
      setRoomTypeFilter("all");

      const response = await getBookingAvailability({
        startDate,
        endDate,
      });

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

  useEffect(() => {
    if (!open) return;
    if (!startDate || !endDate) return;
    if (new Date(endDate) <= new Date(startDate)) return;

    void loadAvailability();
  }, [open, startDate, endDate]);

  function addRoom(room: AdminSelectedRoomLine) {
    setSelectedRooms((prev) => [...prev, room]);
  }

  function removeRoom(lineId: string) {
    setSelectedRooms((prev) => prev.filter((room) => room.lineId !== lineId));
  }

  function setLockedRoom(room: AdminSelectedRoomLine) {
    setSelectedRooms([room]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await createAdminBooking({
        guestName,
        guestEmail,
        guestPhone: guestPhone.trim() ? guestPhone.trim() : undefined,
        startDate,
        endDate,
        notes: notes.trim() ? notes.trim() : undefined,
        paymentStatus,
        paymentNote: paymentNote.trim() ? paymentNote.trim() : undefined,
        createdBy: "admin",
        selections: selectedRooms.map((room) => ({
          roomTypeId: room.roomTypeId,
          adults: room.adults,
          children: room.children,
          mealPlanCode: room.mealPlanCode,
        })),
      });

      await onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la réservation.",
      );
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    Boolean(guestName.trim()) &&
    Boolean(guestEmail.trim()) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    nights > 0 &&
    selectedRooms.length > 0 &&
    !busy;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="flex h-[94vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-[28px] border border-[#d8d0c2] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#ece5d8] px-6 py-5">
          <h2 className="text-[2rem] font-semibold leading-none text-[#1e1e1e]">
            Nouvelle réservation
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d8d0c2] px-4 py-2 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
          >
            Fermer
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
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
                        required
                      />
                    </Field>

                    <Field label="Email">
                      <TextInput
                        type="email"
                        value={guestEmail}
                        onChange={setGuestEmail}
                        required
                      />
                    </Field>

                    <Field label="Téléphone">
                      <TextInput
                        type="tel"
                        value={guestPhone}
                        onChange={setGuestPhone}
                        placeholder="Optionnel"
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
                        onChange={(value) => {
                          setStartDate(value);
                          setSelectedRooms([]);
                        }}
                        required
                      />
                    </Field>

                    <Field label="Départ">
                      <TextInput
                        type="date"
                        value={endDate}
                        onChange={(value) => {
                          setEndDate(value);
                          setSelectedRooms([]);
                        }}
                        required
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Notes internes">
                      <TextArea
                        value={notes}
                        onChange={setNotes}
                        rows={5}
                        placeholder="Arrivée tardive, préférence, info utile pour l’owner..."
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
                      Statut
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["unpaid", "Non payé"],
                          ["paid", "Payé"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setPaymentStatus(value as AdminPaymentStatus)
                          }
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            paymentStatus === value
                              ? "border-[#314835] bg-[#314835] text-white"
                              : "border-[#d8d0c2] bg-white text-[#314835] hover:bg-[#faf6ef]"
                          }`}
                        >
                          {label}
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
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] border border-[#d8d0c2] bg-white">
                <div className="border-b border-[#ece5d8] px-5 py-4">
                  <SectionTitle
                    eyebrow="Section 4"
                    title="Sélection de la chambre"
                  />
                </div>

                <div className="px-5 py-4">
                  {isLockedPlanningRoom &&
                  selectedPlanningRoom &&
                  selectedPlanningRoomType ? (
                    isLoadingAvailability ? (
                      <div className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4 text-sm text-[#5f584d]">
                        Chargement de la chambre sélectionnée...
                      </div>
                    ) : availabilityError ? (
                      <div className="rounded-xl border border-[#e2c1c1] bg-[#fff8f8] px-3 py-2 text-sm text-red-700">
                        {availabilityError}
                      </div>
                    ) : lockedRoomOffer ? (
                      <LockedPlanningRoomCard
                        room={selectedPlanningRoom}
                        roomType={selectedPlanningRoomType}
                        offer={lockedRoomOffer}
                        nights={nights}
                        onChange={setLockedRoom}
                      />
                    ) : (
                      <div className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4 text-sm text-[#5f584d]">
                        Cette chambre n’est pas disponible sur cette période.
                      </div>
                    )
                  ) : (
                    <>
                      <div className="mb-4 max-w-[280px]">
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                          Type de chambre
                        </label>
                        <SelectInput
                          value={roomTypeFilter}
                          onChange={setRoomTypeFilter}
                          options={roomTypeOptions}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                          Chambres ajoutées
                        </label>

                        {selectedRooms.length === 0 ? (
                          <div className="rounded-[16px] border border-dashed border-[#d8d0c2] bg-[#fcfaf7] px-4 py-3 text-sm text-[#8a847b]">
                            Aucune chambre ajoutée.
                          </div>
                        ) : (
                          <div className="flex max-h-[106px] flex-wrap gap-2 overflow-y-auto rounded-[16px] border border-[#d8d0c2] bg-[#fcfaf7] p-2">
                            {selectedRooms.map((room) => (
                              <div
                                key={room.lineId}
                                className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#b9d7bf] bg-[#eef6f0] px-3 py-2 text-xs text-[#22422a]"
                              >
                                <span className="truncate">
                                  {room.roomName} · {room.persons} pers ·{" "}
                                  {room.totalPrice} €
                                </span>

                                <button
                                  type="button"
                                  onClick={() => removeRoom(room.lineId)}
                                  className="rounded-full p-0.5 transition hover:bg-[#dcecdf]"
                                  title="Retirer"
                                  aria-label="Retirer"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {availabilityError ? (
                        <div className="mb-4 rounded-xl border border-[#e2c1c1] bg-[#fff8f8] px-3 py-2 text-sm text-red-700">
                          {availabilityError}
                        </div>
                      ) : null}

                      {isLoadingAvailability ? (
                        <div className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4 text-sm text-[#5f584d]">
                          Chargement des disponibilités...
                        </div>
                      ) : effectiveOffers.length === 0 ? (
                        <div className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4 text-sm text-[#5f584d]">
                          Aucune chambre disponible sur cette période.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {effectiveOffers.map((offer) => (
                            <AdminRoomOfferCard
                              key={offer.id}
                              offer={offer}
                              nights={nights}
                              alreadySelectedCount={getSelectedCountForOffer(
                                offer.id,
                              )}
                              onAddRoom={addRoom}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l border-[#ece5d8] bg-[#fcfaf7] p-5">
            <div className="sticky top-0">
              <SectionTitle eyebrow="Résumé" title="Vue d’ensemble" />

              <div className="mt-4 space-y-4 rounded-[20px] border border-[#e3dbcf] bg-white p-4">
                <SummaryRow
                  label="Client"
                  value={guestName.trim() || "à définir"}
                />
                <SummaryRow
                  label="Email"
                  value={guestEmail.trim() || "à définir"}
                />
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
                <SummaryRow
                  label="Chambres"
                  value={
                    selectedRooms.length > 0
                      ? `${selectedRooms.length} sélectionnée${
                          selectedRooms.length > 1 ? "s" : ""
                        }`
                      : "aucune"
                  }
                />
                <SummaryRow
                  label="Voyageurs"
                  value={totalPersons > 0 ? `${totalPersons}` : "0"}
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
                  {totalPrice} €
                </p>
                <p className="mt-1 text-sm text-[#8a847b]">
                  {selectedRooms.length} ligne
                  {selectedRooms.length > 1 ? "s" : ""} · {nights} nuit
                  {nights > 1 ? "s" : ""}
                </p>

                {error ? (
                  <div className="mt-4 rounded-xl border border-[#e2c1c1] bg-[#fff8f8] px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-xl bg-[#314835] px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Création..." : "Créer la réservation"}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-xl border border-[#d8d0c2] px-4 py-3 text-sm font-medium text-[#314835] transition hover:bg-[#faf6ef]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function LockedPlanningRoomCard({
  room,
  roomType,
  offer,
  nights,
  onChange,
}: {
  room: AdminRoomDto;
  roomType: AdminRoomTypeDto;
  offer: AdminRoomAvailability;
  nights: number;
  onChange: (value: AdminSelectedRoomLine) => void;
}) {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [mealPlanCode, setMealPlanCode] = useState<MealPlanCode>(
    offer.mealPlans[0]?.code ?? "room_only",
  );

  const persons = adults + children;

  const selectedMealPlan =
    offer.mealPlans.find((plan) => plan.code === mealPlanCode) ??
    offer.mealPlans[0];

  const roomPrice = offer.basePrice * nights;
  const mealPlanPrice =
    ((selectedMealPlan?.adultPrice ?? 0) * adults +
      (selectedMealPlan?.childPrice ?? 0) * children) *
    nights;
  const totalPrice = roomPrice + mealPlanPrice;

  useEffect(() => {
    onChange({
      lineId: `locked-${room.id}`,
      roomTypeId: roomType.id,
      roomName: `Chambre ${room.number}`,
      adults,
      children,
      persons,
      mealPlanCode,
      mealPlanName: selectedMealPlan?.name ?? "Chambre seule",
      roomPrice,
      mealPlanPrice,
      totalPrice,
      mealPlans: offer.mealPlans,
    });
  }, [
    room.id,
    room.number,
    roomType.id,
    adults,
    children,
    persons,
    mealPlanCode,
    selectedMealPlan?.name,
    roomPrice,
    mealPlanPrice,
    totalPrice,
    offer.mealPlans,
    onChange,
  ]);

  return (
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
                Chambre verrouillée
              </p>
              <h3 className="mt-1 text-[18px] font-semibold text-[#1e1e1e]">
                Chambre {room.number}
              </h3>
              <p className="mt-1 text-sm text-[#314835]">
                {roomType.name} · étage {room.floor} · jusqu’à{" "}
                {offer.maxCapacity} personnes
              </p>
            </div>

            <div className="rounded-full bg-[#e7f3ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#22422a]">
              Sélectionnée
            </div>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#5f584d]">
            {offer.description || roomType.description}
          </p>

          <div className="mt-4 grid gap-3 md:max-w-[520px] md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                Adultes
              </label>
              <SelectInput
                value={String(adults)}
                onChange={(value) => {
                  const nextAdults = Number(value);
                  setAdults(nextAdults);

                  if (nextAdults + children > offer.maxCapacity) {
                    setChildren(Math.max(0, offer.maxCapacity - nextAdults));
                  }
                }}
                options={Array.from(
                  { length: offer.maxCapacity },
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
                value={String(children)}
                onChange={(value) => setChildren(Number(value))}
                options={Array.from(
                  { length: offer.maxCapacity - adults + 1 },
                  (_, i) => ({
                    value: String(i),
                    label: String(i),
                  }),
                )}
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                Formule
              </label>
              <SelectInput
                value={mealPlanCode}
                onChange={(value) => setMealPlanCode(value as MealPlanCode)}
                options={offer.mealPlans.map((plan) => ({
                  value: plan.code,
                  label: plan.name,
                }))}
              />
            </div>
          </div>

          <p className="mt-4 text-sm text-[#6c675f]">
            {persons} pers · {nights} nuit{nights > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 xl:items-end">
          <p className="text-xs text-[#8a847b]">
            Pour {nights} nuit{nights > 1 ? "s" : ""}
          </p>
          <p className="text-[26px] font-semibold leading-none text-[#2d2c29]">
            {totalPrice} €
          </p>
          {mealPlanPrice > 0 ? (
            <p className="text-xs text-[#8a847b]">
              dont repas : {mealPlanPrice} €
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AdminRoomOfferCard({
  offer,
  nights,
  alreadySelectedCount,
  onAddRoom,
}: {
  offer: AdminRoomAvailability;
  nights: number;
  alreadySelectedCount: number;
  onAddRoom: (value: AdminSelectedRoomLine) => void;
}) {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [mealPlanCode, setMealPlanCode] = useState<MealPlanCode>(
    offer.mealPlans[0]?.code ?? "room_only",
  );

  const persons = adults + children;
  const remainingStock = Math.max(
    0,
    offer.availableRooms - alreadySelectedCount,
  );
  const canAdd = remainingStock > 0;

  const selectedMealPlan =
    offer.mealPlans.find((plan) => plan.code === mealPlanCode) ??
    offer.mealPlans[0];

  const roomPrice = offer.basePrice * nights;
  const mealPlanPrice =
    ((selectedMealPlan?.adultPrice ?? 0) * adults +
      (selectedMealPlan?.childPrice ?? 0) * children) *
    nights;
  const totalPrice = roomPrice + mealPlanPrice;

  return (
    <article className="rounded-[22px] border border-[#d8d0c2] bg-[#fcfaf7] p-4">
      <div className="grid gap-4 xl:grid-cols-[130px_minmax(0,1fr)_110px]">
        <div className="aspect-square overflow-hidden rounded-[16px] border border-[#ddd4c6] bg-[#f3eee6]">
          <div className="flex h-full w-full items-center justify-center text-xs text-[#8a847b]">
            Image
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-semibold text-[#1e1e1e]">
                {offer.name}
              </h3>
              <p className="mt-1 text-sm text-[#314835]">
                Jusqu’à {offer.maxCapacity} personnes
              </p>
            </div>

            <div className="rounded-full bg-[#e7f3ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#22422a]">
              Stock : {remainingStock}
            </div>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#5f584d]">
            {offer.description}
          </p>

          <div className="mt-4 grid gap-3 md:max-w-[520px] md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                Adultes
              </label>
              <SelectInput
                value={String(adults)}
                onChange={(value) => {
                  const nextAdults = Number(value);
                  setAdults(nextAdults);

                  if (nextAdults + children > offer.maxCapacity) {
                    setChildren(Math.max(0, offer.maxCapacity - nextAdults));
                  }
                }}
                options={Array.from(
                  { length: offer.maxCapacity },
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
                value={String(children)}
                onChange={(value) => setChildren(Number(value))}
                options={Array.from(
                  { length: offer.maxCapacity - adults + 1 },
                  (_, i) => ({
                    value: String(i),
                    label: String(i),
                  }),
                )}
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                Formule
              </label>
              <SelectInput
                value={mealPlanCode}
                onChange={(value) => setMealPlanCode(value as MealPlanCode)}
                options={offer.mealPlans.map((plan) => ({
                  value: plan.code,
                  label: plan.name,
                }))}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[#6c675f]">
              {persons} pers · {nights} nuit{nights > 1 ? "s" : ""}
            </p>

            <button
              type="button"
              disabled={!canAdd}
              onClick={() =>
                onAddRoom({
                  lineId: `${offer.id}-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 7)}`,
                  roomTypeId: offer.id,
                  roomName: offer.name,
                  adults,
                  children,
                  persons,
                  mealPlanCode,
                  mealPlanName: selectedMealPlan?.name ?? "Chambre seule",
                  roomPrice,
                  mealPlanPrice,
                  totalPrice,
                  mealPlans: offer.mealPlans,
                })
              }
              className="rounded-xl bg-[#314835] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a3d2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 xl:items-end">
          <p className="text-xs text-[#8a847b]">
            Pour {nights} nuit{nights > 1 ? "s" : ""}
          </p>
          <p className="text-[26px] font-semibold leading-none text-[#2d2c29]">
            {totalPrice} €
          </p>
          {mealPlanPrice > 0 ? (
            <p className="text-xs text-[#8a847b]">
              dont repas : {mealPlanPrice} €
            </p>
          ) : null}
        </div>
      </div>
    </article>
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

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
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
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-[16px] border border-[#d8d0c2] bg-white px-4 py-3 text-[14px] text-[#1e1e1e] outline-none transition placeholder:text-[#9a9489] focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-[16px] border border-[#d8d0c2] bg-white px-4 py-3 text-[14px] text-[#1e1e1e] outline-none transition placeholder:text-[#9a9489] focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[16px] border border-[#d8d0c2] bg-white px-4 py-3 text-[14px] text-[#1e1e1e] outline-none transition focus:border-[#314835] focus:ring-4 focus:ring-[#314835]/10"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
  switch (value) {
    case "unpaid":
      return "Non payé";
    case "paid":
      return "Payé";
  }
}