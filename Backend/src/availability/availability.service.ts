import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CheckAvailabilityDto } from "./dto/check-availability.dto";

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(dto: CheckAvailabilityDto) {
    const { startDate, endDate, adults, children, rooms, roomTypeId } = dto;

    const roomType = await this.prisma.roomType.findUnique({
      where: { code: roomTypeId },
    });

    if (!roomType) {
      return {
        isAvailable: false,
        availableRoomsCount: 0,
        matchingRoomIds: [],
        message: "Type de chambre introuvable.",
      };
    }

    const persons = adults + children;

    if (persons > roomType.maxCapacity) {
      return {
        isAvailable: false,
        availableRoomsCount: 0,
        matchingRoomIds: [],
        message: "Le nombre de personnes dépasse la capacité de ce type de chambre.",
      };
    }

    const matchingRooms = await this.prisma.room.findMany({
      where: {
        roomTypeId: roomType.id,
        status: "available",
        bookings: {
          none: {
            status: {
              in: ["pending", "confirmed", "checked_in"],
            },
            startDate: {
              lt: new Date(endDate),
            },
            endDate: {
              gt: new Date(startDate),
            },
          },
        },
      },
      select: {
        id: true,
        number: true,
      },
      orderBy: {
        number: "asc",
      },
    });

    const isAvailable = matchingRooms.length >= rooms;

    return {
      isAvailable,
      availableRoomsCount: matchingRooms.length,
      matchingRoomIds: matchingRooms.map((room) => room.id),
      message: isAvailable
        ? `${matchingRooms.length} chambre(s) disponible(s) pour ces dates.`
        : "Pas assez de chambres disponibles pour ces dates.",
    };
  }
}