import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { GetBookingAvailabilityDto } from "./dto/get-booking-availability.dto";

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(dto: GetBookingAvailabilityDto) {
    const { startDate, endDate } = dto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Dates invalides.");
    }

    if (end <= start) {
      throw new BadRequestException(
        "La date de départ doit être après la date d'arrivée.",
      );
    }

    const roomTypes = await this.prisma.roomType.findMany({
      include: {
        rooms: {
          where: {
            status: "available",
            bookings: {
              none: {
                status: {
                  in: ["pending", "confirmed", "checked_in"],
                },
                startDate: { lt: end },
                endDate: { gt: start },
              },
            },
          },
        },
        mealPlans: {
          include: {
            mealPlan: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      startDate,
      endDate,
      roomTypes: roomTypes
        .filter((roomType) => roomType.rooms.length > 0)
        .map((roomType) => ({
          id: roomType.id,
          code: roomType.code,
          name: roomType.name,
          description: roomType.description,
          maxCapacity: roomType.maxCapacity,
          basePrice: roomType.basePrice,
          availableRooms: roomType.rooms.length,
          mealPlans: roomType.mealPlans.map((link) => ({
            id: link.mealPlan.id,
            code: link.mealPlan.code,
            name: link.mealPlan.name,
            adultPrice: link.mealPlan.adultPrice,
            childPrice: link.mealPlan.childPrice,
          })),
        })),
    };
  }

  async createBooking(dto: CreateBookingDto) {
    const { startDate, endDate, guestName, guestEmail, selections } = dto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Dates invalides.");
    }

    if (end <= start) {
      throw new BadRequestException(
        "La date de départ doit être après la date d'arrivée.",
      );
    }

    if (!selections.length) {
      throw new BadRequestException("Aucune chambre sélectionnée.");
    }

    const nights = this.getNights(start, end);

    const result = await this.prisma.$transaction(async (tx) => {
      const normalizedGuestName = guestName.trim();
      const normalizedGuestEmail = guestEmail.trim().toLowerCase();

      const groupedSelections = new Map<string, typeof selections>();

      for (const selection of selections) {
        const key = selection.roomTypeId;

        if (!groupedSelections.has(key)) {
          groupedSelections.set(key, []);
        }

        groupedSelections.get(key)!.push(selection);
      }

      const allocatedRoomsByType = new Map<
        string,
        {
          roomType: {
            id: string;
            code: string;
            name: string;
            maxCapacity: number;
            basePrice: number;
          };
          rooms: { id: string; number: string }[];
        }
      >();

      for (const [roomTypeCode, grouped] of groupedSelections.entries()) {
        const roomType = await tx.roomType.findFirst({
          where: {
            code: roomTypeCode as any,
          },
        });

        if (!roomType) {
          throw new BadRequestException(
            `Type de chambre introuvable: ${roomTypeCode}`,
          );
        }

        for (const selection of grouped) {
          const persons = selection.adults + selection.children;

          if (persons < 1) {
            throw new BadRequestException(
              "Chaque chambre doit contenir au moins une personne.",
            );
          }

          if (persons > roomType.maxCapacity) {
            throw new BadRequestException(
              `Capacité maximale dépassée pour ${roomType.name}.`,
            );
          }

          const mealPlan = await tx.mealPlan.findFirst({
            where: {
              code: selection.mealPlanCode as any,
            },
          });

          if (!mealPlan) {
            throw new BadRequestException("Formule introuvable.");
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

        const availableRooms = await tx.room.findMany({
          where: {
            roomTypeId: roomType.id,
            status: "available",
            bookings: {
              none: {
                status: {
                  in: ["pending", "confirmed", "checked_in"],
                },
                startDate: { lt: end },
                endDate: { gt: start },
              },
            },
          },
          orderBy: {
            number: "asc",
          },
          take: grouped.length,
          select: {
            id: true,
            number: true,
          },
        });

        if (availableRooms.length < grouped.length) {
          throw new BadRequestException(
            `Pas assez de chambres disponibles pour ${roomType.name}.`,
          );
        }

        allocatedRoomsByType.set(roomTypeCode, {
          roomType: {
            id: roomType.id,
            code: roomType.code as unknown as string,
            name: roomType.name,
            maxCapacity: roomType.maxCapacity,
            basePrice: roomType.basePrice,
          },
          rooms: availableRooms,
        });
      }

      const createdBookings: {
        id: string;
        roomId: string;
        roomPrice: number;
        mealPlanPrice: number;
        totalPrice: number;
      }[] = [];

      for (const selection of selections) {
        const allocation = allocatedRoomsByType.get(selection.roomTypeId);

        if (!allocation) {
          throw new BadRequestException("Allocation de chambre impossible.");
        }

        const room = allocation.rooms.shift();

        if (!room) {
          throw new BadRequestException(
            `Plus de chambre disponible pour ${allocation.roomType.name}.`,
          );
        }

        const mealPlan = await tx.mealPlan.findFirst({
          where: {
            code: selection.mealPlanCode as any,
          },
        });

        if (!mealPlan) {
          throw new BadRequestException("Formule introuvable.");
        }

        const persons = selection.adults + selection.children;
        const adultMeals = selection.adults;
        const childMeals = selection.children;

        const roomPrice = allocation.roomType.basePrice * nights;
        const mealPlanPrice =
          (mealPlan.adultPrice * adultMeals +
            mealPlan.childPrice * childMeals) *
          nights;
        const totalPrice = roomPrice + mealPlanPrice;

        const booking = await tx.booking.create({
          data: {
            roomId: room.id,
            mealPlanId: mealPlan.id,
            startDate: start,
            endDate: end,
            persons,
            adultMeals,
            childMeals,
            guestName: normalizedGuestName,
            guestEmail: normalizedGuestEmail,
            status: "confirmed",
            roomPrice,
            mealPlanPrice,
            totalPrice,
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
        {
          nights,
          roomPrice: 0,
          mealPlanPrice: 0,
          totalPrice: 0,
        },
      );

      return {
        bookingIds: createdBookings.map((booking) => booking.id),
        roomIds: createdBookings.map((booking) => booking.roomId),
        pricing,
      };
    });

    return {
      success: true,
      message: "Réservation créée.",
      bookingIds: result.bookingIds,
      roomIds: result.roomIds,
      selectionCount: selections.length,
      pricing: result.pricing,
    };
  }

  private getNights(start: Date, end: Date) {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}