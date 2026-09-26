import { BadRequestException } from '@nestjs/common';
import { MealPlanCode, Prisma } from '../../generated/prisma/client';
import {
  allocateRoomsForSelections,
  type BookingSelectionInput,
} from './booking-room-allocation.util';

// Partagé par BookingsService (site public) et AdminService (back-office) :
// validation des dates, allocation des chambres, calcul des prix et création
// des lignes Booking. Seuls les champs propres à chaque parcours (statut,
// source, paiement, notes...) sont fournis par l'appelant via `extraData`.

export function parseStayDates(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BadRequestException('Dates invalides.');
  }

  if (end <= start) {
    throw new BadRequestException(
      "La date de départ doit être après la date d'arrivée.",
    );
  }

  const nights = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return { start, end, nights };
}

export function computeLinePricing(input: {
  basePrice: number;
  mealPlan: { adultPrice: number; childPrice: number };
  adults: number;
  children: number;
  nights: number;
}) {
  const roomPrice = input.basePrice * input.nights;
  const mealPlanPrice =
    (input.mealPlan.adultPrice * input.adults +
      input.mealPlan.childPrice * input.children) *
    input.nights;

  return {
    persons: input.adults + input.children,
    adultMeals: input.adults,
    childMeals: input.children,
    roomPrice,
    mealPlanPrice,
    totalPrice: roomPrice + mealPlanPrice,
  };
}

type ComputedBookingFields =
  | 'bookingGroupId'
  | 'roomId'
  | 'mealPlanId'
  | 'startDate'
  | 'endDate'
  | 'persons'
  | 'adultMeals'
  | 'childMeals'
  | 'roomPrice'
  | 'mealPlanPrice'
  | 'totalPrice';

export async function createPricedBookings(
  tx: Prisma.TransactionClient,
  input: {
    selections: BookingSelectionInput[];
    start: Date;
    end: Date;
    nights: number;
    bookingGroupId: string;
    extraData: Omit<Prisma.BookingUncheckedCreateInput, ComputedBookingFields>;
  },
) {
  if (!input.selections.length) {
    throw new BadRequestException('Aucune chambre sélectionnée.');
  }

  const allocatedRoomsByType = await allocateRoomsForSelections(
    tx,
    input.selections,
    input.start,
    input.end,
  );

  const createdBookings: {
    id: string;
    roomId: string;
    roomPrice: number;
    mealPlanPrice: number;
    totalPrice: number;
  }[] = [];

  for (const selection of input.selections) {
    const allocation = allocatedRoomsByType.get(selection.roomTypeId);

    if (!allocation) {
      throw new BadRequestException('Allocation de chambre impossible.');
    }

    const room = allocation.rooms.shift();

    if (!room) {
      throw new BadRequestException(
        `Plus de chambre disponible pour ${allocation.roomType.name}.`,
      );
    }

    const mealPlan = await tx.mealPlan.findFirst({
      where: { code: selection.mealPlanCode as MealPlanCode },
    });

    if (!mealPlan) {
      throw new BadRequestException('Formule introuvable.');
    }

    const booking = await tx.booking.create({
      data: {
        ...input.extraData,
        bookingGroupId: input.bookingGroupId,
        roomId: room.id,
        mealPlanId: mealPlan.id,
        startDate: input.start,
        endDate: input.end,
        ...computeLinePricing({
          basePrice: allocation.roomType.basePrice,
          mealPlan,
          adults: selection.adults,
          children: selection.children,
          nights: input.nights,
        }),
      },
      select: {
        id: true,
        roomId: true,
        roomPrice: true,
        mealPlanPrice: true,
        totalPrice: true,
      },
    });

    createdBookings.push(booking);
  }

  const pricing = createdBookings.reduce(
    (acc, booking) => {
      acc.roomPrice += booking.roomPrice;
      acc.mealPlanPrice += booking.mealPlanPrice;
      acc.totalPrice += booking.totalPrice;
      return acc;
    },
    { nights: input.nights, roomPrice: 0, mealPlanPrice: 0, totalPrice: 0 },
  );

  return {
    bookingIds: createdBookings.map((booking) => booking.id),
    roomIds: createdBookings.map((booking) => booking.roomId),
    pricing,
  };
}
