import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BookingSource,
  BookingStatus,
  MealPlanCode,
  PaymentStatus,
  RoomStatus,
  SystemLogType,
} from 'src/generated/prisma/client';
import {
  buildDayRange,
  generateUniqueRoomTypeCode,
  getNights,
  mapAdminBooking,
} from './admin.utils';
import { CreateAdminRoomDto } from './dto/create-admin-room.dto';
import { UpdateAdminRoomStatusDto } from './dto/update-admin-room-status.dto';
import { CreateAdminRoomTypeDto } from './dto/create-admin-room-type.dto';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';
import { UpdateAdminRoomTypeDto } from './dto/update-admin-room-type.dto';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogsService: SystemLogsService,
    private readonly invoicesService: InvoicesService,
  ) {}

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
        imageUrl: true,
      },
    });
  }

  async createRoomType(dto: CreateAdminRoomTypeDto) {
    const cleanName = dto.name.trim();

    const existingName = await this.prisma.roomType.findFirst({
      where: { name: cleanName },
    });

    if (existingName) {
      throw new BadRequestException(
        'Un type de chambre avec ce nom existe déjà.',
      );
    }

    const code = await generateUniqueRoomTypeCode(this.prisma, cleanName);

    return this.prisma.$transaction(async (tx) => {
      const mealPlans = await tx.mealPlan.findMany({
        select: { id: true },
      });

      if (!mealPlans.length) {
        throw new BadRequestException(
          'Aucune formule disponible. Lance le seed des formules avant de créer un type de chambre.',
        );
      }

      const roomType = await tx.roomType.create({
        data: {
          code,
          name: cleanName,
          description: dto.description.trim(),
          maxCapacity: dto.maxCapacity,
          basePrice: dto.basePrice,
          imageUrl: dto.imageUrl?.trim() || null,
        },
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

      await tx.roomTypeMealPlan.createMany({
        data: mealPlans.map((mealPlan) => ({
          roomTypeId: roomType.id,
          mealPlanId: mealPlan.id,
        })),
        skipDuplicates: true,
      });

      return roomType;
    });
  }

  async updateRoomType(id: string, dto: UpdateAdminRoomTypeDto) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
    });

    if (!roomType) {
      throw new NotFoundException('Type de chambre introuvable.');
    }

    const updatedRoomType = await this.prisma.roomType.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description.trim() : undefined,
        maxCapacity: dto.maxCapacity,
        basePrice: dto.basePrice,
        imageUrl:
          dto.imageUrl !== undefined ? dto.imageUrl.trim() || null : undefined,
      },
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

    await this.ensureMealPlansForRoomType(updatedRoomType.id);

    return updatedRoomType;
  }

  async deleteRoomType(id: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
      include: {
        rooms: true,
      },
    });

    if (!roomType) {
      throw new NotFoundException('Type de chambre introuvable.');
    }

    if (roomType.rooms.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un type lié à des chambres.',
      );
    }

    await this.prisma.roomType.delete({
      where: { id },
    });

    return { success: true };
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
    const {
      startDate,
      endDate,
      guestName,
      guestEmail,
      guestPhone,
      notes,
      paymentStatus,
      paymentNote,
      createdBy,
      selections,
    } = dto;

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

    if (!selections.length) {
      throw new BadRequestException('Aucune chambre sélectionnée.');
    }

    const nights = getNights(start, end);
    const bookingGroupId = crypto.randomUUID();

    const result = await this.prisma.$transaction(async (tx) => {
      const normalizedGuestName = guestName.trim();
      const normalizedGuestEmail = guestEmail.trim().toLowerCase();
      const normalizedGuestPhone = guestPhone?.trim() || null;
      const normalizedNotes = notes?.trim() || null;
      const normalizedPaymentNote = paymentNote?.trim() || null;

      const resolvedBookingSource =
        createdBy === 'visitor'
          ? BookingSource.website
          : BookingSource.admin_manual;

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

        const availableRooms = await tx.room.findMany({
          where: {
            roomTypeId: roomType.id,
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
          orderBy: {
            number: 'asc',
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
          throw new BadRequestException('Allocation de chambre impossible.');
        }

        const room = allocation.rooms.shift();

        if (!room) {
          throw new BadRequestException(
            `Plus de chambre disponible pour ${allocation.roomType.name}.`,
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
            bookingGroupId,

            roomId: room.id,
            mealPlanId: mealPlan.id,

            startDate: start,
            endDate: end,

            persons,
            adultMeals,
            childMeals,

            guestName: normalizedGuestName,
            guestEmail: normalizedGuestEmail,
            guestPhone: normalizedGuestPhone,
            notes: normalizedNotes,

            status: BookingStatus.confirmed,
            bookingSource: resolvedBookingSource,
            paymentStatus: paymentStatus as PaymentStatus,
            paymentNote: normalizedPaymentNote,

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
        bookingGroupId,
        bookingIds: createdBookings.map((booking) => booking.id),
        roomIds: createdBookings.map((booking) => booking.roomId),
        pricing,
      };
    });

    if (paymentStatus === PaymentStatus.paid) {
      await this.invoicesService.createForBookingGroup({
        bookingGroupId: result.bookingGroupId,
      });
    }

    await this.systemLogsService.create({
      type: SystemLogType.admin_booking_created,
      bookingGroupId: result.bookingGroupId,
      message: `Réservation créée via le panel admin. ${selections.length} chambre(s), total ${result.pricing.totalPrice} €.`,
      metadata: {
        bookingIds: result.bookingIds,
        roomIds: result.roomIds,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim().toLowerCase(),
        paymentStatus,
        totalPrice: result.pricing.totalPrice,
      },
    });

    return {
      success: true,
      message: 'Réservation admin créée.',
      bookingIds: result.bookingIds,
      roomIds: result.roomIds,
      selectionCount: selections.length,
      pricing: result.pricing,
    };
  }

  async updateBooking(id: string, dto: UpdateAdminBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: { include: { roomType: true } },
        mealPlan: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable.');
    }

    if (booking.status === BookingStatus.cancelled) {
      throw new BadRequestException(
        'Impossible de modifier une réservation annulée.',
      );
    }

    const previousStatus = booking.status;
    const previousPaymentStatus = booking.paymentStatus;
    const previousStartDate = booking.startDate;
    const previousEndDate = booking.endDate;
    const previousAdults = booking.adultMeals;
    const previousChildren = booking.childMeals;
    const previousGuestPhone = booking.guestPhone;
    const previousNotes = booking.notes;
    const previousMealPlanName = booking.mealPlan?.name ?? null;
    const previousTotalPrice = booking.totalPrice;

    const startDate = dto.startDate ? new Date(dto.startDate) : booking.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : booking.endDate;

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Dates invalides.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Dates invalides.');
    }

    const adults = dto.adults !== undefined ? dto.adults : booking.adultMeals;
    const children =
      dto.children !== undefined ? dto.children : booking.childMeals;

    const persons = adults + children;

    if (persons < 1) {
      throw new BadRequestException(
        'La réservation doit contenir au moins une personne.',
      );
    }

    if (persons > booking.room.roomType.maxCapacity) {
      throw new BadRequestException(
        'Le nombre de personnes dépasse la capacité de la chambre.',
      );
    }

    const guestPhone =
      dto.guestPhone !== undefined
        ? dto.guestPhone.trim() || null
        : booking.guestPhone;

    const nextMealPlan = dto.mealPlanCode
      ? await this.prisma.mealPlan.findFirst({
          where: { code: dto.mealPlanCode as MealPlanCode },
        })
      : booking.mealPlan;

    if (dto.mealPlanCode && !nextMealPlan) {
      throw new BadRequestException('Formule introuvable.');
    }

    if (nextMealPlan) {
      const allowedMealPlan = await this.prisma.roomTypeMealPlan.findUnique({
        where: {
          roomTypeId_mealPlanId: {
            roomTypeId: booking.room.roomTypeId,
            mealPlanId: nextMealPlan.id,
          },
        },
      });

      if (!allowedMealPlan) {
        throw new BadRequestException(
          `La formule ${nextMealPlan.name} n'est pas disponible pour cette chambre.`,
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

    const mealPlanPrice = nextMealPlan
      ? (nextMealPlan.adultPrice * adults + nextMealPlan.childPrice * children) *
        nights
      : 0;

    const totalPrice = roomPrice + mealPlanPrice;

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        startDate,
        endDate,

        persons,
        adultMeals: adults,
        childMeals: children,

        status:
          dto.status !== undefined
            ? (dto.status as BookingStatus)
            : booking.status,

        guestPhone,

        notes:
          dto.notes !== undefined ? dto.notes.trim() || null : booking.notes,

        paymentStatus:
          dto.paymentStatus !== undefined
            ? (dto.paymentStatus as PaymentStatus)
            : booking.paymentStatus,

        paymentNote:
          dto.paymentNote !== undefined
            ? dto.paymentNote.trim() || null
            : booking.paymentNote,

        mealPlanId: nextMealPlan?.id ?? null,

        roomPrice,
        mealPlanPrice,
        totalPrice,
      },
    });

    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id: updatedBooking.id },
      include: {
        room: { include: { roomType: true } },
        mealPlan: true,
      },
    });

    const becamePaid =
      previousPaymentStatus !== PaymentStatus.paid &&
      updated.paymentStatus === PaymentStatus.paid;

    if (becamePaid && updated.bookingGroupId) {
      await this.invoicesService.createForBookingGroup({
        bookingGroupId: updated.bookingGroupId,
      });
    }

    await this.logAdminBookingEdit({
      bookingId: updated.id,
      bookingGroupId: updated.bookingGroupId,
      guestName: updated.guestName,
      guestEmail: updated.guestEmail,
      roomNumber: updated.room.number,
      previousStatus,
      nextStatus: updated.status,
      previousPaymentStatus,
      nextPaymentStatus: updated.paymentStatus,
      previousStartDate,
      nextStartDate: updated.startDate,
      previousEndDate,
      nextEndDate: updated.endDate,
      previousAdults,
      nextAdults: updated.adultMeals,
      previousChildren,
      nextChildren: updated.childMeals,
      previousGuestPhone,
      nextGuestPhone: updated.guestPhone,
      previousNotes,
      nextNotes: updated.notes,
      previousMealPlanName,
      nextMealPlanName: updated.mealPlan?.name ?? null,
      previousTotalPrice,
      nextTotalPrice: updated.totalPrice,
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

    await this.systemLogsService.create({
      type: SystemLogType.booking_cancelled,
      bookingId: cancelledBooking.id,
      bookingGroupId: booking.bookingGroupId ?? undefined,
      message: `Réservation annulée via le panel admin pour ${booking.guestName}.`,
      metadata: {
        bookingId: booking.id,
        bookingGroupId: booking.bookingGroupId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        previousStatus: booking.status,
        nextStatus: BookingStatus.cancelled,
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
            BookingStatus.no_show,
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
        paymentStatus: booking.paymentStatus,
        notes: booking.notes,
        mealPlanName: booking.mealPlan?.name ?? null,
        totalPrice: booking.totalPrice,
      })),
    };
  }

  private async ensureMealPlansForRoomType(roomTypeId: string) {
    const mealPlans = await this.prisma.mealPlan.findMany({
      select: { id: true },
    });

    if (!mealPlans.length) {
      throw new BadRequestException(
        'Aucune formule disponible. Lance le seed des formules avant de modifier ce type de chambre.',
      );
    }

    await this.prisma.roomTypeMealPlan.createMany({
      data: mealPlans.map((mealPlan) => ({
        roomTypeId,
        mealPlanId: mealPlan.id,
      })),
      skipDuplicates: true,
    });
  }

  private async logAdminBookingEdit(input: {
    bookingId: string;
    bookingGroupId: string | null;
    guestName: string;
    guestEmail: string;
    roomNumber: string;
    previousStatus: BookingStatus;
    nextStatus: BookingStatus;
    previousPaymentStatus: PaymentStatus;
    nextPaymentStatus: PaymentStatus;
    previousStartDate: Date;
    nextStartDate: Date;
    previousEndDate: Date;
    nextEndDate: Date;
    previousAdults: number;
    nextAdults: number;
    previousChildren: number;
    nextChildren: number;
    previousGuestPhone: string | null;
    nextGuestPhone: string | null;
    previousNotes: string | null;
    nextNotes: string | null;
    previousMealPlanName: string | null;
    nextMealPlanName: string | null;
    previousTotalPrice: number;
    nextTotalPrice: number;
  }) {
    const changes = this.getBookingEditChanges(input);

    await this.systemLogsService.create({
      type: this.getAdminBookingEditLogType(input.previousStatus, input.nextStatus),
      bookingId: input.bookingId,
      bookingGroupId: input.bookingGroupId ?? undefined,
      message: this.getAdminBookingEditMessage(input, changes),
      metadata: {
        bookingId: input.bookingId,
        bookingGroupId: input.bookingGroupId,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        roomNumber: input.roomNumber,

        previousStatus: input.previousStatus,
        nextStatus: input.nextStatus,
        previousPaymentStatus: input.previousPaymentStatus,
        nextPaymentStatus: input.nextPaymentStatus,

        changes,
        statusChanged: input.previousStatus !== input.nextStatus,
        paymentChanged:
          input.previousPaymentStatus !== input.nextPaymentStatus,
        totalPrice: input.nextTotalPrice,
      },
    });
  }

  private getBookingEditChanges(input: {
    previousStatus: BookingStatus;
    nextStatus: BookingStatus;
    previousPaymentStatus: PaymentStatus;
    nextPaymentStatus: PaymentStatus;
    previousStartDate: Date;
    nextStartDate: Date;
    previousEndDate: Date;
    nextEndDate: Date;
    previousAdults: number;
    nextAdults: number;
    previousChildren: number;
    nextChildren: number;
    previousGuestPhone: string | null;
    nextGuestPhone: string | null;
    previousNotes: string | null;
    nextNotes: string | null;
    previousMealPlanName: string | null;
    nextMealPlanName: string | null;
    previousTotalPrice: number;
    nextTotalPrice: number;
  }) {
    const changes: Array<{
      field: string;
      label: string;
      from?: string | number | null;
      to?: string | number | null;
    }> = [];

    if (input.previousStatus !== input.nextStatus) {
      changes.push({
        field: 'status',
        label: 'Statut',
        from: this.getBookingStatusLabel(input.previousStatus),
        to: this.getBookingStatusLabel(input.nextStatus),
      });
    }

    if (input.previousPaymentStatus !== input.nextPaymentStatus) {
      changes.push({
        field: 'paymentStatus',
        label: 'Paiement',
        from: this.getPaymentStatusLabel(input.previousPaymentStatus),
        to: this.getPaymentStatusLabel(input.nextPaymentStatus),
      });
    }

    if (!this.isSameDate(input.previousStartDate, input.nextStartDate)) {
      changes.push({
        field: 'startDate',
        label: "Date d'arrivée",
        from: this.formatDate(input.previousStartDate),
        to: this.formatDate(input.nextStartDate),
      });
    }

    if (!this.isSameDate(input.previousEndDate, input.nextEndDate)) {
      changes.push({
        field: 'endDate',
        label: 'Date de départ',
        from: this.formatDate(input.previousEndDate),
        to: this.formatDate(input.nextEndDate),
      });
    }

    if (
      input.previousAdults !== input.nextAdults ||
      input.previousChildren !== input.nextChildren
    ) {
      changes.push({
        field: 'persons',
        label: 'Voyageurs',
        from: `${input.previousAdults} adulte(s), ${input.previousChildren} enfant(s)`,
        to: `${input.nextAdults} adulte(s), ${input.nextChildren} enfant(s)`,
      });
    }

    if ((input.previousGuestPhone ?? '') !== (input.nextGuestPhone ?? '')) {
      changes.push({
        field: 'guestPhone',
        label: 'Téléphone',
        from: input.previousGuestPhone,
        to: input.nextGuestPhone,
      });
    }

    if ((input.previousNotes ?? '') !== (input.nextNotes ?? '')) {
      changes.push({
        field: 'notes',
        label: 'Notes',
        from: input.previousNotes ? 'Renseignées' : 'Vides',
        to: input.nextNotes ? 'Renseignées' : 'Vides',
      });
    }

    if ((input.previousMealPlanName ?? '') !== (input.nextMealPlanName ?? '')) {
      changes.push({
        field: 'mealPlan',
        label: 'Formule',
        from: input.previousMealPlanName,
        to: input.nextMealPlanName,
      });
    }

    if (input.previousTotalPrice !== input.nextTotalPrice) {
      changes.push({
        field: 'totalPrice',
        label: 'Total',
        from: input.previousTotalPrice,
        to: input.nextTotalPrice,
      });
    }

    return changes;
  }

  private getAdminBookingEditMessage(
    input: {
      guestName: string;
      previousStatus: BookingStatus;
      nextStatus: BookingStatus;
    },
    changes: Array<{ label: string; from?: string | number | null; to?: string | number | null }>,
  ) {
    if (input.previousStatus !== input.nextStatus) {
      if (input.nextStatus === BookingStatus.checked_in) {
        return `Check-in réservation pour ${input.guestName}.`;
      }

      if (input.nextStatus === BookingStatus.checked_out) {
        return `Check-out réservation pour ${input.guestName}.`;
      }

      if (input.nextStatus === BookingStatus.no_show) {
        return `Client marqué pas venu pour ${input.guestName}.`;
      }
    }

    if (!changes.length) {
      return `Réservation sauvegardée via le panel admin pour ${input.guestName}.`;
    }

    const changedLabels = changes.map((change) => change.label).join(', ');

    return `Réservation modifiée via le panel admin pour ${input.guestName}. Champ(s) modifié(s) : ${changedLabels}.`;
  }

  private getAdminBookingEditLogType(
    previousStatus: BookingStatus,
    nextStatus: BookingStatus,
  ) {
    if (previousStatus !== nextStatus) {
      if (nextStatus === BookingStatus.checked_in) {
        return SystemLogType.booking_check_in;
      }

      if (nextStatus === BookingStatus.checked_out) {
        return SystemLogType.booking_check_out;
      }

      if (nextStatus === BookingStatus.no_show) {
        return SystemLogType.booking_no_show;
      }

      if (nextStatus === BookingStatus.cancelled) {
        return SystemLogType.booking_cancelled;
      }
    }

    return SystemLogType.admin_booking_updated;
  }

  private getBookingStatusLabel(status: BookingStatus) {
    if (status === BookingStatus.pending) return 'En attente';
    if (status === BookingStatus.confirmed) return 'Réservée';
    if (status === BookingStatus.checked_in) return 'Arrivé';
    if (status === BookingStatus.checked_out) return 'Parti';
    if (status === BookingStatus.no_show) return 'Pas venu';
    if (status === BookingStatus.cancelled) return 'Annulée';

    return status;
  }

  private getPaymentStatusLabel(status: PaymentStatus) {
    return status === PaymentStatus.paid ? 'Payé' : 'Non payé';
  }

  private isSameDate(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private formatDate(value: Date) {
    return value.toLocaleDateString('fr-FR');
  }
}