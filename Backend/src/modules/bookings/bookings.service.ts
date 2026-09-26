import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BookingSource,
  BookingStatus,
  PaymentStatus,
  RoomStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createPricedBookings, parseStayDates } from './booking-creation.util';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingAvailabilityDto } from './dto/get-booking-availability.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(dto: GetBookingAvailabilityDto) {
    const { startDate, endDate } = dto;

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

    const roomTypes = await this.prisma.roomType.findMany({
      include: {
        rooms: {
          where: {
            status: RoomStatus.available,
            bookings: {
              none: {
                status: {
                  in: [
                    BookingStatus.pending,
                    BookingStatus.confirmed,
                    BookingStatus.checked_in,
                  ],
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
        name: 'asc',
      },
    });

    return {
      success: true,
      startDate,
      endDate,
      roomTypes: roomTypes.map((roomType) => ({
        id: roomType.id,
        code: roomType.code,
        name: roomType.name,
        description: roomType.description,
        maxCapacity: roomType.maxCapacity,
        basePrice: roomType.basePrice,
        imageUrl: roomType.imageUrl,
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
    const result = await this.createPendingWebsiteBooking(dto);

    return {
      success: true,
      message: 'Réservation créée en attente de paiement.',
      bookingIds: result.bookingIds,
      roomIds: result.roomIds,
      selectionCount: result.selectionCount,
      pricing: result.pricing,
    };
  }

  async createPendingWebsiteBooking(dto: CreateBookingDto) {
    const {
      startDate,
      endDate,
      guestName,
      guestEmail,
      guestPhone,
      selections,
    } = dto;

    const { start, end, nights } = parseStayDates(startDate, endDate);

    // Site public uniquement : l'admin peut toujours saisir une réservation passée
    if (startDate.slice(0, 10) < getTodayInHotelTimezone()) {
      throw new BadRequestException(
        "La date d'arrivée ne peut pas être dans le passé.",
      );
    }

    const bookingGroupId = crypto.randomUUID();

    const created = await this.prisma.$transaction((tx) =>
      createPricedBookings(tx, {
        selections,
        start,
        end,
        nights,
        bookingGroupId,
        extraData: {
          status: BookingStatus.pending,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim().toLowerCase(),
          guestPhone: guestPhone?.trim() || null,
          bookingSource: BookingSource.website,
          paymentStatus: PaymentStatus.unpaid,
          paymentNote: `Réservation web en attente de paiement · Groupe ${bookingGroupId}`,
        },
      }),
    );

    return {
      bookingGroupId,
      ...created,
      selectionCount: selections.length,
    };
  }

  async getPublicRoomTypes() {
    return this.prisma.roomType.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        maxCapacity: true,
        basePrice: true,
        imageUrl: true,
      },
    });
  }
}

// "Aujourd'hui" au sens de l'auberge (YYYY-MM-DD), pas du fuseau UTC du serveur
function getTodayInHotelTimezone() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
  }).format(new Date());
}
