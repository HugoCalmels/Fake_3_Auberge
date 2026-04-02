import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BookingStatus,
  RoomStatus,
  RoomTypeCode,
} from 'src/generated/prisma/client';
import { buildDayRange, getNights, mapAdminBooking } from './admin.utils';
import { CreateAdminRoomDto } from './dto/create-admin-room.dto';
import { UpdateAdminRoomStatusDto } from './dto/update-admin-room-status.dto';
import { CreateAdminRoomTypeDto } from './dto/create-admin-room-type.dto';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getRooms() {
    return this.prisma.room.findMany({
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      select: {
        id: true,
        number: true,
        floor: true,
        roomTypeId: true,
        status: true,
      },
    });
  }

  async createRoom(dto: CreateAdminRoomDto) {
    const existingRoom = await this.prisma.room.findUnique({
      where: { number: dto.number.trim() },
    });

    if (existingRoom) {
      throw new BadRequestException('Une chambre avec ce numéro existe déjà.');
    }

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: dto.roomTypeId },
    });

    if (!roomType) {
      throw new NotFoundException('Type de chambre introuvable.');
    }

    return this.prisma.room.create({
      data: {
        number: dto.number.trim(),
        floor: dto.floor,
        roomTypeId: dto.roomTypeId,
        status: dto.status as RoomStatus,
      },
      select: {
        id: true,
        number: true,
        floor: true,
        roomTypeId: true,
        status: true,
      },
    });
  }

  async updateRoomStatus(roomId: string, dto: UpdateAdminRoomStatusDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Chambre introuvable.');
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: dto.status as RoomStatus,
      },
      select: {
        id: true,
        number: true,
        floor: true,
        roomTypeId: true,
        status: true,
      },
    });
  }

  async deleteRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        bookings: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Chambre introuvable.');
    }

    if (room.bookings.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une chambre liée à des réservations.',
      );
    }

    await this.prisma.room.delete({
      where: { id: roomId },
    });

    return { success: true };
  }

  async getRoomTypes() {
    return this.prisma.roomType.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        maxCapacity: true,
        basePrice: true,
      },
    });
  }

  async createRoomType(dto: CreateAdminRoomTypeDto) {
    const normalizedCode = dto.code.trim().toLowerCase() as RoomTypeCode;

    const existingCode = await this.prisma.roomType.findFirst({
      where: {
        OR: [{ code: normalizedCode }, { name: dto.name.trim() }],
      },
    });

    if (existingCode) {
      throw new BadRequestException(
        'Un type de chambre avec ce code ou ce nom existe déjà.',
      );
    }

    return this.prisma.roomType.create({
      data: {
        code: normalizedCode,
        name: dto.name.trim(),
        description: dto.description.trim(),
        maxCapacity: dto.maxCapacity,
        basePrice: dto.basePrice,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        maxCapacity: true,
        basePrice: true,
      },
    });
  }

  async getBookings() {
    const bookings = await this.prisma.booking.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    return bookings.map(mapAdminBooking);
  }

  async getBookingById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable.');
    }

    return mapAdminBooking(booking);
  }

  async createBooking(dto: CreateAdminBookingDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: {
        roomType: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Chambre introuvable.');
    }

    if (room.status === RoomStatus.maintenance) {
      throw new BadRequestException(
        'Impossible de réserver une chambre en maintenance.',
      );
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Dates invalides.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException(
        "La date de départ doit être après la date d'arrivée.",
      );
    }

    if (dto.persons < 1) {
      throw new BadRequestException('Au moins une personne est requise.');
    }

    if (dto.adultMeals + dto.childMeals > dto.persons) {
      throw new BadRequestException(
        'Le nombre de repas ne peut pas dépasser le nombre de personnes.',
      );
    }

    if (dto.persons > room.roomType.maxCapacity) {
      throw new BadRequestException(
        'Le nombre de personnes dépasse la capacité de la chambre.',
      );
    }

    const mealPlan =
      dto.mealPlanId != null
        ? await this.prisma.mealPlan.findUnique({
            where: { id: dto.mealPlanId },
          })
        : null;

    if (dto.mealPlanId && !mealPlan) {
      throw new NotFoundException('Formule introuvable.');
    }

    if (mealPlan) {
      const allowedMealPlan = await this.prisma.roomTypeMealPlan.findUnique({
        where: {
          roomTypeId_mealPlanId: {
            roomTypeId: room.roomTypeId,
            mealPlanId: mealPlan.id,
          },
        },
      });

      if (!allowedMealPlan) {
        throw new BadRequestException(
          "Cette formule n'est pas disponible pour ce type de chambre.",
        );
      }
    }

    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        roomId: dto.roomId,
        status: {
          in: [
            BookingStatus.pending,
            BookingStatus.confirmed,
            BookingStatus.checked_in,
          ],
        },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException(
        'Cette chambre est déjà réservée sur cette période.',
      );
    }

    const nights = getNights(startDate, endDate);
    const roomPrice = room.roomType.basePrice * nights;
    const mealPlanPrice = mealPlan
      ? (mealPlan.adultPrice * dto.adultMeals +
          mealPlan.childPrice * dto.childMeals) *
        nights
      : 0;
    const totalPrice = roomPrice + mealPlanPrice;

    const createdBooking = await this.prisma.booking.create({
      data: {
        roomId: dto.roomId,
        mealPlanId: dto.mealPlanId ?? null,
        startDate,
        endDate,
        persons: dto.persons,
        adultMeals: dto.adultMeals,
        childMeals: dto.childMeals,
        guestName: dto.guestName.trim(),
        guestEmail: dto.guestEmail.trim().toLowerCase(),
        status: BookingStatus.confirmed,
        notes: dto.notes?.trim() || null,
        roomPrice,
        mealPlanPrice,
        totalPrice,
      },
    });

    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: createdBooking.id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    return mapAdminBooking(booking);
  }

  async updateBooking(id: string, dto: UpdateAdminBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable.');
    }

    if (
      booking.status === BookingStatus.cancelled ||
      booking.status === BookingStatus.checked_out
    ) {
      throw new BadRequestException(
        'Impossible de modifier cette réservation.',
      );
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : booking.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : booking.endDate;
    const persons = dto.persons ?? booking.persons;
    const adultMeals = dto.adultMeals ?? booking.adultMeals;
    const childMeals = dto.childMeals ?? booking.childMeals;

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Dates invalides.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Dates invalides.');
    }

    if (persons < 1) {
      throw new BadRequestException('Au moins une personne est requise.');
    }

    if (adultMeals + childMeals > persons) {
      throw new BadRequestException(
        'Le nombre de repas ne peut pas dépasser le nombre de personnes.',
      );
    }

    if (persons > booking.room.roomType.maxCapacity) {
      throw new BadRequestException(
        'Le nombre de personnes dépasse la capacité de la chambre.',
      );
    }

    const nextMealPlanId =
      dto.mealPlanId !== undefined ? dto.mealPlanId : booking.mealPlanId;

    const mealPlan =
      nextMealPlanId != null
        ? await this.prisma.mealPlan.findUnique({
            where: { id: nextMealPlanId },
          })
        : null;

    if (nextMealPlanId && !mealPlan) {
      throw new NotFoundException('Formule introuvable.');
    }

    if (mealPlan) {
      const allowedMealPlan = await this.prisma.roomTypeMealPlan.findUnique({
        where: {
          roomTypeId_mealPlanId: {
            roomTypeId: booking.room.roomType.id,
            mealPlanId: mealPlan.id,
          },
        },
      });

      if (!allowedMealPlan) {
        throw new BadRequestException(
          "Cette formule n'est pas disponible pour ce type de chambre.",
        );
      }
    }

    const overlapping = await this.prisma.booking.findFirst({
      where: {
        id: { not: id },
        roomId: booking.roomId,
        status: {
          in: [
            BookingStatus.pending,
            BookingStatus.confirmed,
            BookingStatus.checked_in,
          ],
        },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Conflit avec une autre réservation.');
    }

    const nights = getNights(startDate, endDate);
    const roomPrice = booking.room.roomType.basePrice * nights;
    const mealPlanPrice = mealPlan
      ? (mealPlan.adultPrice * adultMeals + mealPlan.childPrice * childMeals) *
        nights
      : 0;
    const totalPrice = roomPrice + mealPlanPrice;

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        startDate,
        endDate,
        persons,
        adultMeals,
        childMeals,
        mealPlanId: nextMealPlanId ?? null,
        notes:
          dto.notes !== undefined ? dto.notes.trim() || null : booking.notes,
        roomPrice,
        mealPlanPrice,
        totalPrice,
      },
    });

    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id: updatedBooking.id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    return mapAdminBooking(updated);
  }

  async cancelBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable.');
    }

    const today = new Date();
    const bookingEnd = new Date(
      booking.endDate.getFullYear(),
      booking.endDate.getMonth(),
      booking.endDate.getDate(),
    );
    const todayStripped = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    if (booking.status === BookingStatus.cancelled) {
      throw new BadRequestException('Cette réservation est déjà annulée.');
    }

    if (booking.status === BookingStatus.checked_out) {
      throw new BadRequestException(
        "Impossible d'annuler une réservation terminée.",
      );
    }

    if (bookingEnd < todayStripped) {
      throw new BadRequestException(
        "Impossible d'annuler une réservation passée.",
      );
    }

    const cancelledBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.cancelled,
      },
    });

    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id: cancelledBooking.id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    return mapAdminBooking(updated);
  }

  async assignRoom(id: string, roomId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        mealPlan: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable.');
    }

    if (
      booking.status === BookingStatus.cancelled ||
      booking.status === BookingStatus.checked_out
    ) {
      throw new BadRequestException(
        'Impossible de réassigner cette réservation.',
      );
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Chambre introuvable.');
    }

    if (room.status === RoomStatus.maintenance) {
      throw new BadRequestException(
        "Impossible d'assigner une chambre en maintenance.",
      );
    }

    if (booking.persons > room.roomType.maxCapacity) {
      throw new BadRequestException(
        'Le nombre de personnes dépasse la capacité de la chambre.',
      );
    }

    if (booking.mealPlanId) {
      const allowedMealPlan = await this.prisma.roomTypeMealPlan.findUnique({
        where: {
          roomTypeId_mealPlanId: {
            roomTypeId: room.roomTypeId,
            mealPlanId: booking.mealPlanId,
          },
        },
      });

      if (!allowedMealPlan) {
        throw new BadRequestException(
          "La formule actuelle n'est pas disponible pour cette chambre.",
        );
      }
    }

    const overlapping = await this.prisma.booking.findFirst({
      where: {
        id: { not: id },
        roomId,
        status: {
          in: [
            BookingStatus.pending,
            BookingStatus.confirmed,
            BookingStatus.checked_in,
          ],
        },
        startDate: { lt: booking.endDate },
        endDate: { gt: booking.startDate },
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'La chambre est déjà prise sur cette période.',
      );
    }

    const nights = getNights(booking.startDate, booking.endDate);
    const roomPrice = room.roomType.basePrice * nights;
    const mealPlanPrice = booking.mealPlan
      ? (booking.mealPlan.adultPrice * booking.adultMeals +
          booking.mealPlan.childPrice * booking.childMeals) *
        nights
      : 0;
    const totalPrice = roomPrice + mealPlanPrice;

    const assignedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        roomId,
        roomPrice,
        mealPlanPrice,
        totalPrice,
      },
    });

    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id: assignedBooking.id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        mealPlan: true,
      },
    });

    return mapAdminBooking(updated);
  }

  async getPlanning(from: string, to: string) {
    if (!from || !to) {
      throw new BadRequestException('Les paramètres from et to sont requis.');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Période invalide.');
    }

    if (fromDate > toDate) {
      throw new BadRequestException('La période demandée est invalide.');
    }

    const rooms = await this.prisma.room.findMany({
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      include: {
        roomType: true,
      },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: {
          in: [
            BookingStatus.pending,
            BookingStatus.confirmed,
            BookingStatus.checked_in,
            BookingStatus.checked_out,
          ],
        },
        startDate: { lte: toDate },
        endDate: { gte: fromDate },
      },
      include: {
        room: true,
        mealPlan: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      from,
      to,
      days: buildDayRange(fromDate, toDate),
      rooms: rooms.map((room) => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        roomTypeName: room.roomType.name,
        status: room.status,
      })),
      bookings: bookings.map((booking) => ({
        id: booking.id,
        roomId: booking.roomId,
        roomNumber: booking.room.number,
        guestName: booking.guestName,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        status: booking.status,
        notes: booking.notes,
        mealPlanName: booking.mealPlan?.name ?? null,
        totalPrice: booking.totalPrice,
      })),
    };
  }
}
