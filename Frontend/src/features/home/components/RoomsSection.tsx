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

    const card = carousel.querySelector("article");
    const cardWidth = card?.clientWidth ?? 290;
    const gap = window.innerWidth < 640 ? 16 : 20;

    carousel.scrollBy({
      left: direction === "next" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }

  return (
    <section id="hebergement" className="bg-[#f4efe7]">
      <div className="mx-auto max-w-[1280px] pb-16 pt-20 md:pb-20 md:pt-24 lg:pb-24 lg:pt-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-[820px]">
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#2d2c29] sm:text-5xl">
              Hébergements
            </h2>

            <div className="mt-6 max-w-[780px] space-y-4 text-[16px] leading-7 text-[#5f5a52] sm:mt-8 sm:text-[17px] sm:leading-8">
              <p>
                Chambres doubles, familiales ou partagées : l’auberge propose
                plusieurs configurations adaptées aux séjours en couple, en
                famille ou en groupe.
              </p>

              <p>
                Les 20 chambres disposent de salles d’eau privatives et peuvent
                accueillir jusqu’à 49 voyageurs au total, dans une ambiance
                simple, chaleureuse et pensée pour les séjours en montagne.
              </p>

              <p>
                Les disponibilités, capacités et formules se choisissent ensuite
                au moment de la réservation en ligne.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-12">
          {loading ? (
            <div className="px-4 sm:px-6 lg:px-8">
              <MessageCard>Chargement des hébergements...</MessageCard>
            </div>
          ) : error ? (
            <div className="px-4 sm:px-6 lg:px-8">
              <MessageCard danger>{error}</MessageCard>
            </div>
          ) : visibleRoomTypes.length === 0 ? (
            <div className="px-4 sm:px-6 lg:px-8">
              <MessageCard>
                Aucun hébergement disponible pour le moment.
              </MessageCard>
            </div>
          ) : (
            <>
              <div className="mb-5 flex justify-start px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => scrollCarousel("prev")}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d8d1c6] bg-[#f8f4ed] text-[15px] text-[#314835] transition hover:bg-[#ece4d7] md:h-11 md:w-11"
                    aria-label="Voir les chambres précédentes"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollCarousel("next")}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d8d1c6] bg-[#f8f4ed] text-[15px] text-[#314835] transition hover:bg-[#ece4d7] md:h-11 md:w-11"
                    aria-label="Voir les chambres suivantes"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="px-4 sm:px-6 lg:px-8">
                <div
                  ref={carouselRef}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:gap-5 [&::-webkit-scrollbar]:hidden"
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
            </>
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
    <article className="group flex w-[72vw] max-w-[290px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border border-[#d8d1c6] bg-[#f8f4ed] transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:w-[340px] sm:max-w-none sm:rounded-[24px] lg:w-[370px]">
      <div className="relative aspect-[1.28/1] overflow-hidden bg-[#d9d3c8] sm:aspect-[1.35/1]">
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

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex min-h-[52px] items-start justify-between gap-3 sm:min-h-[72px]">
          <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.03em] text-[#2d2c29] sm:text-[24px]">
            {room.name}
          </h3>

          <span className="shrink-0 rounded-full bg-[#efe7db] px-2.5 py-1 text-[11px] font-semibold text-[#314835] sm:px-3 sm:text-xs">
            {room.maxCapacity} pers.
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-[#5f5a52] sm:mt-4 sm:text-[15px] sm:leading-7">
          {room.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <p className="text-[13px] text-[#6a645d] sm:text-sm">
            Dès{" "}
            <span className="font-semibold text-[#2d2c29]">
              {room.basePrice} €
            </span>{" "}
            / nuit
          </p>

          <button
            type="button"
            onClick={openBooking}
            className="cursor-pointer rounded-full bg-[#314835] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#466349] sm:px-5"
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