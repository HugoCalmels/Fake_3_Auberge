import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createForBookingGroup(input: {
    bookingGroupId: string;
    stripePaymentIntentId?: string;
  }) {
    const bookingGroupId = input.bookingGroupId.trim();

    if (!bookingGroupId) {
      throw new BadRequestException('bookingGroupId manquant.');
    }

    const existingInvoice = await this.prisma.invoice.findUnique({
      where: {
        bookingGroupId,
      },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const alreadyCreated = await tx.invoice.findUnique({
          where: {
            bookingGroupId,
          },
        });

        if (alreadyCreated) {
          return alreadyCreated;
        }

        const bookings = await tx.booking.findMany({
          where: {
            bookingGroupId,
            status: BookingStatus.confirmed,
            paymentStatus: PaymentStatus.paid,
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            totalPrice: true,
          },
        });

        if (bookings.length === 0) {
          throw new BadRequestException(
            'Impossible de créer une facture sans réservation payée/confirmée.',
          );
        }

        const firstBooking = bookings[0];

        const totalPrice = bookings.reduce(
          (sum, booking) => sum + booking.totalPrice,
          0,
        );

        const year = new Date().getFullYear();

        const invoiceCountForYear = await tx.invoice.count({
          where: {
            number: {
              startsWith: `FAC-${year}-`,
            },
          },
        });

        const nextNumber = invoiceCountForYear + 1;

        const number = `FAC-${year}-${String(nextNumber).padStart(6, '0')}`;

        return tx.invoice.create({
          data: {
            number,
            bookingGroupId,
            stripePaymentIntentId: input.stripePaymentIntentId,
            guestName: firstBooking.guestName,
            guestEmail: firstBooking.guestEmail,
            totalPrice,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingInvoiceAfterRace = await this.prisma.invoice.findUnique({
          where: {
            bookingGroupId,
          },
        });

        if (existingInvoiceAfterRace) {
          return existingInvoiceAfterRace;
        }
      }

      throw error;
    }
  }
}