"use client";

import type { SelectedRoomLine } from "@/features/booking/types";

type Props = {
  startDate: string;
  endDate: string;
  nights: number;
  selectedRooms: SelectedRoomLine[];
  totalPersons: number;
  totalPrice: number;
  guestEmail: string;
  paymentIntentId?: string | null;
};

export default function BookingSuccessStep({
  startDate,
 endDate,
  nights,
  selectedRooms,
  totalPersons,
  totalPrice,
  guestEmail,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="min-h-0 flex-1 px-6 py-12">
        <section className="mx-auto flex h-full w-full max-w-[620px] flex-col items-center">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#314835] text-2xl font-semibold leading-none text-white shadow-[0_10px_24px_rgba(49,72,53,0.18)]">
              ✓
            </div>
<p className="mt-10 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9184]">
  Réservation confirmée
</p>

            <h3 className="mt-4 text-center text-[32px] font-semibold leading-none text-[#1e1e1e]">
              Paiement reçu
            </h3>

            <p className="mt-6 max-w-[520px] text-center text-[15px] leading-7 text-[#6c675f]">
              Votre séjour est bien réservé. Un email de confirmation sera
              envoyé à
              <br />
              <span className="font-semibold text-[#1e1e1e]">
                {guestEmail || "votre adresse email"}
              </span>
         
            </p>
          </div>

          <div className="mt-12 w-full max-w-[560px] rounded-[18px] border border-[#eee7dc] bg-[#fcfaf7] p-6 text-left text-sm">
            <div className="space-y-4">
              <InfoRow
                label="Séjour"
                value={`${formatShortDate(startDate)} → ${formatShortDate(endDate)}`}
              />

              <InfoRow
                label="Durée"
                value={`${nights} nuit${nights > 1 ? "s" : ""}`}
              />

              <InfoRow
                label="Chambres"
                value={`${selectedRooms.length} chambre${
                  selectedRooms.length > 1 ? "s" : ""
                }`}
              />

              <InfoRow
                label="Voyageurs"
                value={`${totalPersons} voyageur${
                  totalPersons > 1 ? "s" : ""
                }`}
              />

              <InfoRow label="Total payé" value={`${totalPrice} €`} strong />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#eee7dc] pb-4 last:border-b-0 last:pb-0">
      <span className="text-[15px] leading-none text-[#8a847b]">{label}</span>

      <span
        className={[
          "text-right text-[15px] leading-none text-[#1e1e1e]",
          strong ? "font-semibold" : "font-medium",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function formatShortDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}