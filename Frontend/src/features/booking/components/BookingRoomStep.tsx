"use client";

import { useMemo, useState } from "react";
import { getAdminRoomTypeImageSrc } from "@/features/admin/api/adminRoomTypes.api";
import type {
  RoomAvailability,
  SelectedRoomLine,
} from "@/features/booking/types";
import type { MealPlanCode } from "@/features/booking/api/bookings.api";

type Props = {
  startDate: string;
  endDate: string;
  roomTypeFilter: string;
  roomTypeOptions: readonly { value: string; label: string }[];
  offers: RoomAvailability[];
  selectedRooms: SelectedRoomLine[];
  onChangeRoomTypeFilter: (value: string) => void;
  onAddRoom: (value: SelectedRoomLine) => void;
  onRemoveRoom: (lineId: string) => void;
};

const MAX_SELECTED_VISIBLE = 6;

export default function BookingRoomsStep({
  startDate,
  endDate,
  roomTypeFilter,
  roomTypeOptions,
  offers,
  selectedRooms,
  onChangeRoomTypeFilter,
  onAddRoom,
  onRemoveRoom,
}: Props) {
  const nights = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }, [startDate, endDate]);

  function getSelectedCountForOffer(roomTypeId: string) {
    return selectedRooms.filter((room) => room.offerId === roomTypeId).length;
  }

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      const cheapestA = getCheapestOfferTotalPrice(a, nights);
      const cheapestB = getCheapestOfferTotalPrice(b, nights);

      if (cheapestA !== cheapestB) {
        return cheapestA - cheapestB;
      }

      const remainingA = Math.max(
        0,
        a.availableRooms - getSelectedCountForOffer(a.id),
      );
      const remainingB = Math.max(
        0,
        b.availableRooms - getSelectedCountForOffer(b.id),
      );

      if (remainingA !== remainingB) {
        return remainingB - remainingA;
      }

      return a.name.localeCompare(b.name, "fr-FR");
    });
  }, [offers, selectedRooms, nights]);

  const hiddenSelectedCount = Math.max(
    0,
    selectedRooms.length - MAX_SELECTED_VISIBLE,
  );

  const visibleSelectedRooms =
    hiddenSelectedCount > 0
      ? selectedRooms.slice(0, MAX_SELECTED_VISIBLE - 1)
      : selectedRooms.slice(0, MAX_SELECTED_VISIBLE);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#d8d0c2] bg-white shadow-sm">
      <div className="border-b border-[#d8d0c2] bg-[#fcfaf7] px-4 py-4 sm:py-2">
        <div className="booking-top-grid">
          <div className="booking-top-col">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a847b]">
              Type de chambre
            </label>

            <select
              value={roomTypeFilter}
              onChange={(e) => onChangeRoomTypeFilter(e.target.value)}
              className="room-select"
            >
              {roomTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === "all" ? "Toutes" : option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-top-col">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a847b]">
              Ajoutées
            </label>

            {selectedRooms.length > 0 ? (
              <div className="selected-box">
                <div className="selected-chips-grid">
                  {visibleSelectedRooms.map((room) => (
                    <div key={room.lineId} className="selected-chip">
                      <span className="selected-chip-label">
                        {room.roomName} · {room.totalPrice} €
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemoveRoom(room.lineId)}
                        className="selected-chip-remove"
                        title="Retirer cette chambre"
                        aria-label={`Retirer ${room.roomName}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {hiddenSelectedCount > 0 ? (
                    <div className="selected-chip selected-chip-more">
                      +{hiddenSelectedCount} autre
                      {hiddenSelectedCount > 1 ? "s" : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="empty-selected-state">Aucune chambre ajoutée</div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {sortedOffers.length === 0 ? (
            <div className="rounded-[16px] border border-[#d8d0c2] bg-[#fcfaf7] p-4 text-[14px] text-[#5f584d]">
              Aucune chambre disponible sur ces dates.
            </div>
          ) : (
            sortedOffers.map((offer) => (
              <RoomRow
                key={offer.id}
                offer={offer}
                nights={nights}
                alreadySelectedCount={getSelectedCountForOffer(offer.id)}
                onAddRoom={onAddRoom}
              />
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .booking-top-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          align-items: start;
        }

        .booking-top-col {
          min-width: 0;
          padding: 0;
        }

        .room-select {
          width: 100%;
          max-width: 150px;
          appearance: none;
          border-radius: 999px;
          border: 1px solid #d8d0c2;
          background: #fff;
          color: #1e1e1e;
          padding: 0.65rem 2.2rem 0.65rem 0.85rem;
          font-size: 13px;
          line-height: 1.2;
          outline: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'><path d='M5 7.5L10 12.5L15 7.5' stroke='%23314835' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 16px;
        }

        .room-select:focus {
          border-color: #314835;
          box-shadow: 0 0 0 3px rgba(49, 72, 53, 0.08);
        }

        .selected-box {
          width: 100%;
          overflow: hidden;
        }

        .selected-chips-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          width: 100%;
        }

        .selected-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.45rem;
          min-width: 0;
          width: 100%;
          height: 36px;
          border-radius: 999px;
          border: 1px solid #b9d7bf;
          background: #eef6f0;
          padding: 0 0.72rem 0 0.82rem;
          font-size: 12px;
          line-height: 1;
          color: #22422a;
        }

        .selected-chip-label {
          min-width: 0;
          flex: 1 1 auto;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selected-chip-remove {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border: none;
          background: transparent;
          color: #58715b;
          cursor: pointer;
          padding: 0;
          border-radius: 999px;
        }

        .selected-chip-remove:hover {
          background: rgba(34, 66, 42, 0.08);
          color: #22422a;
        }

        .selected-chip-more {
          justify-content: center;
          border-style: dashed;
          background: #f4f7f4;
          color: #58715b;
        }

        .empty-selected-state {
          display: flex;
          align-items: center;
          min-height: 36px;
          color: #9a9489;
          font-size: 13px;
        }

        @media (min-width: 640px) {
          .booking-top-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 0;
          }

          .booking-top-col {
            padding: 6px 10px 8px;
          }

          .room-select {
            max-width: 250px;
            padding: 0.72rem 2.7rem 0.72rem 0.95rem;
            font-size: 14px;
            background-position: right 0.9rem center;
            background-size: 18px;
          }

          .selected-box {
            max-height: calc(36px * 3 + 8px * 2);
          }

          .selected-chips-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 10px;
          }
        }
      `}</style>
    </div>
  );
}

function getCheapestOfferTotalPrice(offer: RoomAvailability, nights: number) {
  const cheapestMealPlanPrice =
    offer.mealPlans.length > 0
      ? Math.min(
          ...offer.mealPlans.map(
            (plan) => (plan.adultPrice ?? 0) + (plan.childPrice ?? 0),
          ),
        )
      : 0;

  return (offer.basePrice + cheapestMealPlanPrice) * nights;
}

function RoomRow({
  offer,
  nights,
  alreadySelectedCount,
  onAddRoom,
}: {
  offer: RoomAvailability;
  nights: number;
  alreadySelectedCount: number;
  onAddRoom: (value: SelectedRoomLine) => void;
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

  const imageUrl = (offer as RoomAvailability & { imageUrl?: string }).imageUrl;

  return (
    <article className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4 transition">
      <div className="grid gap-4 lg:grid-cols-[140px_1fr_120px]">
        <div className="aspect-[16/10] overflow-hidden rounded-[14px] border border-[#ddd4c6] bg-[#f3eee6] sm:aspect-square">
          {imageUrl ? (
            <img
              src={getAdminRoomTypeImageSrc(imageUrl)}
              alt={offer.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[12px] text-[#8a847b]">
              Image
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-semibold text-[#1e1e1e]">
                {offer.name}
              </h3>
              <p className="mt-1 text-[14px] text-[#314835]">
                Jusqu’à {offer.maxCapacity} personnes
              </p>
            </div>

            <div
              className={[
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
                remainingStock > 0
                  ? "bg-[#e7f3ea] text-[#22422a]"
                  : "bg-[#eee7dc] text-[#8a847b]",
              ].join(" ")}
            >
              Stock : {remainingStock}
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-[#5f584d] sm:line-clamp-3">
            {offer.description}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-[460px] sm:gap-3">
            <div>
              <label className="compact-label">Adultes</label>
              <select
                value={adults}
                disabled={!canAdd}
                onChange={(e) => {
                  const nextAdults = Number(e.target.value);
                  setAdults(nextAdults);

                  if (nextAdults + children > offer.maxCapacity) {
                    setChildren(Math.max(0, offer.maxCapacity - nextAdults));
                  }
                }}
                className="compact-select"
              >
                {Array.from({ length: offer.maxCapacity }, (_, i) => i + 1).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="compact-label">Enfants</label>
              <select
                value={children}
                disabled={!canAdd}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="compact-select"
              >
                {Array.from(
                  { length: offer.maxCapacity - adults + 1 },
                  (_, i) => i,
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="compact-label">Formule</label>
              <select
                value={mealPlanCode}
                disabled={!canAdd}
                onChange={(e) => setMealPlanCode(e.target.value as MealPlanCode)}
                className="compact-select"
              >
                {offer.mealPlans.map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[13px] text-[#6c675f]">
                {persons} pers · {nights} nuit{nights > 1 ? "s" : ""}
              </p>

              <p className="mt-1 text-[12px] text-[#8a847b]">
                Pour {nights} nuit{nights > 1 ? "s" : ""}
              </p>

              <p className="mt-1 text-[26px] font-semibold leading-none text-[#2d2c29]">
                {totalPrice} €
              </p>

              {mealPlanPrice > 0 ? (
                <p className="mt-1 text-[12px] text-[#8a847b]">
                  dont repas : {mealPlanPrice} €
                </p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={!canAdd}
              onClick={() =>
                onAddRoom({
                  lineId: `${offer.id}-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 7)}`,
                  offerId: offer.id,
                  roomName: offer.name,
                  persons,
                  adults,
                  children,
                  roomPrice,
                  mealPlanCode,
                  mealPlanName: selectedMealPlan?.name ?? "Chambre seule",
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

        <div className="hidden flex-col items-start gap-2 lg:flex lg:items-end">
          <p className="text-[12px] text-[#8a847b]">
            Pour {nights} nuit{nights > 1 ? "s" : ""}
          </p>
          <p className="text-[26px] font-semibold leading-none text-[#2d2c29]">
            {totalPrice} €
          </p>
          {mealPlanPrice > 0 ? (
            <p className="text-[12px] text-[#8a847b]">
              dont repas : {mealPlanPrice} €
            </p>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .compact-select {
          width: 100%;
          appearance: none;
          border-radius: 0.85rem;
          border: 1px solid #d8d0c2;
          background: #fff;
          color: #1e1e1e;
          padding: 0.7rem 2rem 0.7rem 0.75rem;
          font-size: 13px;
          line-height: 1.2;
          outline: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'><path d='M5 7.5L10 12.5L15 7.5' stroke='%23314835' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
          background-repeat: no-repeat;
          background-position: right 0.65rem center;
          background-size: 16px;
        }

        .compact-select:disabled {
          cursor: not-allowed;
          background-color: #f3eee6;
          color: #9a9489;
        }

        .compact-select:focus {
          border-color: #314835;
          box-shadow: 0 0 0 3px rgba(49, 72, 53, 0.08);
        }

        .compact-label {
          display: block;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a847b;
        }

        @media (min-width: 640px) {
          .compact-select {
            padding: 0.75rem 2.5rem 0.75rem 0.85rem;
            font-size: 14px;
            background-position: right 0.8rem center;
            background-size: 18px;
          }

          .compact-label {
            font-size: 11px;
            letter-spacing: 0.12em;
          }
        }
      `}</style>
    </article>
  );
}