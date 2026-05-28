import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  BookingSource,
  BookingStatus,
  PaymentStatus,
  SystemLogLevel,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

const PENDING_EXPIRATION_MINUTES = 30;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class PendingBookingsCleanupService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PendingBookingsCleanupService.name);
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogsService: SystemLogsService,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => {
      void this.cancelExpiredPendingStripeBookings();
    }, CLEANUP_INTERVAL_MS);

    void this.cancelExpiredPendingStripeBookings();
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async cancelExpiredPendingStripeBookings() {
    const expiresBefore = new Date(
      Date.now() - PENDING_EXPIRATION_MINUTES * 60 * 1000,
    );

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        bookingSource: BookingSource.website,
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
        stripePaymentIntentId: {
          not: null,
        },
        createdAt: {
          lt: expiresBefore,
        },
      },
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        roomId: true,
        startDate: true,
        endDate: true,
        status: true,
        paymentStatus: true,
        stripePaymentIntentId: true,
        createdAt: true,
      },
    });

    if (expiredBookings.length === 0) {
      return;
    }

    const bookingIds = expiredBookings.map((booking) => booking.id);

    const result = await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
        bookingSource: BookingSource.website,
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
        stripePaymentIntentId: {
          not: null,
        },
      },
      data: {
        status: BookingStatus.cancelled,
        paymentNote: 'Réservation expirée : paiement non finalisé.',
      },
    });

    this.logger.warn(
      `Réservations Stripe pending expirées annulées : ${result.count}`,
    );

    for (const booking of expiredBookings) {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'booking_payment_expired',
        message: `Réservation annulée automatiquement : paiement non finalisé après ${PENDING_EXPIRATION_MINUTES} minutes.`,
        bookingId: booking.id,
        metadata: {
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          roomId: booking.roomId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          previousStatus: booking.status,
          newStatus: BookingStatus.cancelled,
          previousPaymentStatus: booking.paymentStatus,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          createdAt: booking.createdAt,
        },
      });
    }
  }
}