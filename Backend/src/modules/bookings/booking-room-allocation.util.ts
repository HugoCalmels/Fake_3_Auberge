import { BadRequestException } from '@nestjs/common';
import {
  BookingStatus,
  MealPlanCode,
  Prisma,
  RoomStatus,
} from '../../generated/prisma/client';

export type BookingSelectionInput = {
  roomTypeId: string;
  adults: number;
  children: number;
  mealPlanCode: string;
};

export type AllocatedRoomTypeGroup = {
  roomType: {
    id: string;
    code: string;
    name: string;
    maxCapacity: number;
    basePrice: number;
  };
  rooms: { id: string; number: string }[];
};

// Shared by BookingsService (public website flow) and AdminService (back-office
// flow): validates each selection against its room type/meal plan and locks
// (FOR UPDATE) the rooms it allocates for the requested date range, so two
// concurrent bookings can never grab the same room for overlapping dates.
export async function allocateRoomsForSelections(
  tx: Prisma.TransactionClient,
  selections: BookingSelectionInput[],
  start: Date,
  end: Date,
): Promise<Map<string, AllocatedRoomTypeGroup>> {
  const groupedSelections = new Map<string, BookingSelectionInput[]>();

  for (const selection of selections) {
    const key = selection.roomTypeId;

    if (!groupedSelections.has(key)) {
      groupedSelections.set(key, []);
    }

    groupedSelections.get(key)!.push(selection);
  }

  const allocatedRoomsByType = new Map<string, AllocatedRoomTypeGroup>();

  for (const [roomTypeId, grouped] of groupedSelections.entries()) {
    const roomType = await tx.roomType.findUnique({
      where: {
        id: roomTypeId,
      },
    });

    if (!roomType) {
      throw new BadRequestException(
        `Type de chambre introuvable: ${roomTypeId}`,
      );
    }

    for (const selection of grouped) {
      const persons = selection.adults + selection.children;

      if (persons < 1) {
        throw new BadRequestException(
          'Chaque chambre doit contenir au moins une personne.',
        );
      }

      if (persons > roomType.maxCapacity) {
        throw new BadRequestException(
          `Capacité maximale dépassée pour ${roomType.name}.`,
        );
      }

      const mealPlan = await tx.mealPlan.findFirst({
        where: {
          code: selection.mealPlanCode as MealPlanCode,
        },
      });

      if (!mealPlan) {
        throw new BadRequestException('Formule introuvable.');
      }

      const allowedMealPlan = await tx.roomTypeMealPlan.findUnique({
        where: {
          roomTypeId_mealPlanId: {
            roomTypeId: roomType.id,
            mealPlanId: mealPlan.id,
          },
        },
      });

      if (!allowedMealPlan) {
        throw new BadRequestException(
          `La formule ${mealPlan.name} n'est pas disponible pour ${roomType.name}.`,
        );
      }
    }

    // Locks candidate rooms (FOR UPDATE) so a concurrent transaction
    // running the same allocation cannot see or grab them until this
    // transaction commits or rolls back — this prevents double-booking.
    const availableRooms = await tx.$queryRaw<{ id: string; number: string }[]>`
      SELECT "id", "number"
      FROM "Room"
      WHERE "roomTypeId" = ${roomType.id}
        AND "status" = ${RoomStatus.available}::"RoomStatus"
        AND NOT EXISTS (
          SELECT 1 FROM "Booking"
          WHERE "Booking"."roomId" = "Room"."id"
            AND "Booking"."status" IN (${BookingStatus.pending}::"BookingStatus", ${BookingStatus.confirmed}::"BookingStatus", ${BookingStatus.checked_in}::"BookingStatus")
            AND "Booking"."startDate" < ${end}
            AND "Booking"."endDate" > ${start}
        )
      ORDER BY "number" ASC
      LIMIT ${grouped.length}
      FOR UPDATE OF "Room"
    `;

    if (availableRooms.length < grouped.length) {
      throw new BadRequestException(
        `Pas assez de chambres disponibles pour ${roomType.name}.`,
      );
    }

    allocatedRoomsByType.set(roomTypeId, {
      roomType: {
        id: roomType.id,
        code: roomType.code,
        name: roomType.name,
        maxCapacity: roomType.maxCapacity,
        basePrice: roomType.basePrice,
      },
      rooms: availableRooms,
    });
  }

  return allocatedRoomsByType;
}
