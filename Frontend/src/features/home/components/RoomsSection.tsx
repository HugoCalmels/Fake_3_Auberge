"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPublicRoomTypes,
  normalizePublicRoomTypes,
  type RoomTypeAvailabilityDto,
} from "@/features/booking/api/bookings.api";
import { getAdminRoomTypeImageSrc } from "@/features/admin/api/adminRoomTypes.api";
import type { AdminRoomTypeDto } from "@/features/admin/types";

type Props = {
  roomTypes?: AdminRoomTypeDto[];
  openBooking: () => void;
  limit?: number;
};

export default function RoomsSection({
  roomTypes: initialRoomTypes = [],
  openBooking,
  limit = 6,
}: Props) {
  const [roomTypes, setRoomTypes] = useState<RoomTypeAvailabilityDto[]>(() =>
    normalizeRoomTypesFromProps(initialRoomTypes),
  );
  const [loading, setLoading] = useState(initialRoomTypes.length === 0);
  const [error, setError] = useState("");
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const visibleRoomTypes = useMemo(() => {
    return roomTypes.slice(0, limit);
  }, [roomTypes, limit]);

  useEffect(() => {
    if (initialRoomTypes.length > 0) {
      setRoomTypes(normalizeRoomTypesFromProps(initialRoomTypes));
      setLoading(false);
      setError("");
      return;
    }

    async function loadRoomTypes() {
      setLoading(true);
      setError("");

      try {
        const data = await getPublicRoomTypes();
        setRoomTypes(normalizePublicRoomTypes(data));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les hébergements.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRoomTypes();
  }, [initialRoomTypes]);

  function scrollCarousel(direction: "prev" | "next") {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === "next" ? 390 : -390,
      behavior: "smooth",
    });
  }

  return (
    <section id="hebergement" className="bg-[#f4efe7]">
      <div className="mx-auto max-w-[1280px] px-4 pt-24 pb-20 sm:px-6 lg:px-8 lg:pt-30 lg:pb-24">
        <div className="max-w-[820px]">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#2d2c29] sm:text-5xl">
            Hébergements
          </h2>

          <div className="mt-8 max-w-[780px] space-y-4 text-[17px] leading-8 text-[#5f5a52]">
            <p>
              Chambres doubles, familiales ou partagées : l’auberge propose
              plusieurs configurations adaptées aux séjours en couple, en
              famille ou en groupe.
            </p>

            <p>
              Les 20 chambres disposent de salles d’eau privatives et peuvent
              accueillir jusqu’à 49 voyageurs au total, dans une ambiance simple,
              chaleureuse et pensée pour les séjours en montagne.
            </p>

            <p>
              Les disponibilités, capacités et formules se choisissent ensuite
              au moment de la réservation en ligne.
            </p>
          </div>
        </div>

        <div className="mt-12">
          {loading ? (
            <MessageCard>Chargement des hébergements...</MessageCard>
          ) : error ? (
            <MessageCard danger>{error}</MessageCard>
          ) : visibleRoomTypes.length === 0 ? (
            <MessageCard>Aucun hébergement disponible pour le moment.</MessageCard>
          ) : (
            <div>
              <div className="mb-6 flex justify-start">
                <div className="hidden items-center gap-3 md:flex">
                  <button
                    type="button"
                    onClick={() => scrollCarousel("prev")}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#d8d1c6] bg-[#f8f4ed] text-[15px] text-[#314835] transition hover:bg-[#ece4d7]"
                    aria-label="Voir les chambres précédentes"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollCarousel("next")}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#d8d1c6] bg-[#f8f4ed] text-[15px] text-[#314835] transition hover:bg-[#ece4d7]"
                    aria-label="Voir les chambres suivantes"
                  >
                    →
                  </button>
                </div>
              </div>

              <div
                ref={carouselRef}
                className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
              >
                {visibleRoomTypes.map((room) => (
                  <RoomPreviewCard
                    key={room.id}
                    room={room}
                    openBooking={openBooking}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function normalizeRoomTypesFromProps(
  roomTypes: AdminRoomTypeDto[],
): RoomTypeAvailabilityDto[] {
  return roomTypes.map((room) => ({
    id: room.id,
    code: room.code,
    name: room.name,
    description: room.description,
    maxCapacity: room.maxCapacity,
    basePrice: room.basePrice,
    imageUrl: room.imageUrl,
    availableRooms: 0,
    mealPlans: [],
  }));
}

function RoomPreviewCard({
  room,
  openBooking,
}: {
  room: RoomTypeAvailabilityDto;
  openBooking: () => void;
}) {
  const imageSrc = room.imageUrl
    ? getAdminRoomTypeImageSrc(room.imageUrl)
    : null;

  return (
    <article className="group w-[82vw] shrink-0 snap-start overflow-hidden rounded-[28px] border border-[#d8d1c6] bg-[#f8f4ed] transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:w-[370px]">
      <div className="relative aspect-[1.35/1] overflow-hidden bg-[#d9d3c8]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={room.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#8a847b]">
            Image à venir
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/22 via-transparent to-transparent" />
      </div>

      <div className="p-6">
        <div className="flex min-h-[72px] items-start justify-between gap-4">
          <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-[#2d2c29]">
            {room.name}
          </h3>

          <span className="shrink-0 rounded-full bg-[#efe7db] px-3 py-1 text-xs font-semibold text-[#314835]">
            {room.maxCapacity} pers.
          </span>
        </div>

        <p className="mt-4 line-clamp-3 text-[15px] leading-7 text-[#5f5a52]">
          {room.description}
        </p>

        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="text-sm text-[#6a645d]">
            Dès{" "}
            <span className="font-semibold text-[#2d2c29]">
              {room.basePrice} €
            </span>{" "}
            / nuit
          </p>

          <button
            type="button"
            onClick={openBooking}
            className="cursor-pointer rounded-full border border-[#d8d1c6] bg-white px-5 py-2.5 text-sm font-semibold text-[#314835] transition hover:bg-[#ece4d7]"
          >
            Réserver
          </button>
        </div>
      </div>
    </article>
  );
}

function MessageCard({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border px-6 py-8 text-[15px] ${
        danger
          ? "border-[#B91C1C]/30 bg-[#B91C1C]/10 text-[#B91C1C]"
          : "border-[#d8d1c6] bg-[#f8f4ed] text-[#5f5a52]"
      }`}
    >
      {children}
    </div>
  );
}