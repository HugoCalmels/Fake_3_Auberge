"use client";

import type { SelectedRoomLine } from "@/features/booking/types";
import BookingPaymentBlock, {
  type BookingPaymentMethod,
} from "./BookingPaymentBlock";

type Props = {
  startDate: string;
  endDate: string;
  nights: number;
  selectedRooms: SelectedRoomLine[];
  totalPersons: number;
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  paymentMethod: BookingPaymentMethod;
  paymentSubmitTrigger: number;
  onGuestNameChange: (value: string) => void;
  onGuestEmailChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  onPaymentMethodChange: (value: BookingPaymentMethod) => void;
  onPaymentReadyChange: (value: boolean) => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (message: string) => void;
};

export default function BookingPaymentStep({
  startDate,
  endDate,
  nights,
  selectedRooms,
  totalPersons,
  totalPrice,
  guestName,
  guestEmail,
  guestPhone,
  paymentMethod,
  paymentSubmitTrigger,
  onGuestNameChange,
  onGuestEmailChange,
  onGuestPhoneChange,
  onPaymentMethodChange,
  onPaymentReadyChange,
  onPaymentSuccess,
  onPaymentError,
}: Props) {
  const roomSubtotal = selectedRooms.reduce(
    (sum, room) => sum + room.roomPrice,
    0,
  );

  const mealSubtotal = selectedRooms.reduce(
    (sum, room) => sum + room.mealPlanPrice,
    0,
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_315px]">
          <div className="space-y-4">
            <section className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4">
              <StepTitle number="1" title="Vos informations" />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Nom complet">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(event) => onGuestNameChange(event.target.value)}
                    autoComplete="name"
                    className="field-input"
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(event) => onGuestEmailChange(event.target.value)}
                    autoComplete="email"
                    className="field-input"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Téléphone">
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(event) =>
                        onGuestPhoneChange(event.target.value)
                      }
                      autoComplete="tel"
                      placeholder="Optionnel"
                      className="field-input"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <BookingPaymentBlock
              startDate={startDate}
              endDate={endDate}
              guestName={guestName}
              guestEmail={guestEmail}
              guestPhone={guestPhone}
              selectedRooms={selectedRooms}
              selectedMethod={paymentMethod}
              submitTrigger={paymentSubmitTrigger}
              onSelectedMethodChange={onPaymentMethodChange}
              onPaymentReadyChange={onPaymentReadyChange}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
            />
          </div>

          <aside className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4">
            <StepTitle number="3" title="Résumé" />

            <div className="mt-4 space-y-2 text-[13px] text-[#5f584d]">
              <InfoRow
                label="Dates"
                value={`${formatShortDate(startDate)} → ${formatShortDate(endDate)}`}
              />
              <InfoRow
                label="Nuits"
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
            </div>

            <div className="mt-4 space-y-2 border-t border-[#eee7dc] pt-4">
              {selectedRooms.map((room) => (
                <div
                  key={room.lineId}
                  className="rounded-[14px] bg-white px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1e1e1e]">
                        {room.roomName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#8a847b]">
                        {room.persons} pers · {room.mealPlanName}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-[#1e1e1e]">
                      {room.totalPrice} €
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-[#eee7dc] pt-4 text-[13px]">
              <InfoRow label="Hébergement" value={`${roomSubtotal} €`} />
              <InfoRow label="Repas" value={`${mealSubtotal} €`} />
            </div>

            <div className="mt-4 rounded-[16px] border border-[#d8d0c2] bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a847b]">
                Total à régler
              </p>
              <p className="mt-2 text-[30px] font-semibold leading-none text-[#2d2c29]">
                {totalPrice} €
              </p>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          height: 48px;
          border-radius: 14px;
          border: 1px solid #d8d0c2;
          background: #fff;
          padding: 0 0.9rem;
          color: #1e1e1e;
          outline: none;
          font-size: 14px;
        }

        .field-input:focus {
          border-color: #314835;
          box-shadow: 0 0 0 3px rgba(49, 72, 53, 0.08);
        }

        .field-input::placeholder {
          color: #aaa195;
        }
      `}</style>
    </div>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#314835] text-[11px] font-semibold text-white">
        {number}
      </span>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a847b]">
        {title}
      </p>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[#8a847b]">{label}</span>
      <span className="max-w-[62%] text-right text-[#1e1e1e]">{value}</span>
    </div>
  );
}

function formatShortDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}