"use client";

import { SelectedRoomConfig } from "@/src/services/booking/booking.types";

type Props = {
  startDate: string;
  endDate: string;
  nights: number;
  selectedRoom: SelectedRoomConfig | null;
  roomSubtotal: number;
  supplementsTotal: number;
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  onGuestNameChange: (value: string) => void;
  onGuestEmailChange: (value: string) => void;
};

export default function BookingPaymentStep({
  startDate,
  endDate,
  nights,
  selectedRoom,
  roomSubtotal,
  supplementsTotal,
  totalPrice,
  guestName,
  guestEmail,
  onGuestNameChange,
  onGuestEmailChange,
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[#d8d0c2] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
            Coordonnées
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                Nom
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => onGuestNameChange(e.target.value)}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 text-[#1e1e1e] outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#1e1e1e]">
                Email
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => onGuestEmailChange(e.target.value)}
                className="w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2.5 text-[#1e1e1e] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#d8d0c2] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
            Paiement
          </p>

          <div className="mt-4 rounded-xl border border-dashed border-[#d8d0c2] bg-[#fcfaf7] p-6 text-[14px] text-[#6c675f]">
            Placeholder paiement / Stripe plus tard.
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-[#d8d0c2] bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a847b]">
          Résumé
        </p>

        <div className="mt-4 space-y-2 text-[14px] text-[#5f584d]">
          <InfoRow
            label="Dates"
            value={`${formatShortDate(startDate)} → ${formatShortDate(endDate)}`}
          />
          <InfoRow label="Nuits" value={`${nights}`} />
          <InfoRow label="Chambre" value={selectedRoom?.roomName ?? "—"} />
          <InfoRow
            label="Voyageurs"
            value={
              selectedRoom
                ? `${selectedRoom.adults} adulte(s), ${selectedRoom.children} enfant(s)`
                : "—"
            }
          />
          <InfoRow label="Formule" value={selectedRoom?.formulaLabel ?? "—"} />
          <InfoRow label="Sous-total chambre" value={`${roomSubtotal} €`} />
          <InfoRow label="Suppléments" value={`${supplementsTotal} €`} />
        </div>

        <div className="mt-5 rounded-[18px] border border-[#e3dbcf] bg-[#fcfaf7] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
            Total
          </p>
          <p className="mt-2 text-[32px] font-semibold leading-none text-[#2d2c29]">
            {totalPrice} €
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[#8a847b]">{label}</span>
      <span className="text-right text-[#1e1e1e]">{value}</span>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}