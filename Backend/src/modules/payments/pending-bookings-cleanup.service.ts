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
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const PENDING_EXPIRATION_MINUTES = 30;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class PendingBookingsCleanupService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PendingBookingsCleanupService.name);
  private interval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

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
        createdAt: {
          lt: expiresBefore,
        },
      },
      select: {
        id: true,
        bookingGroupId: true,
        guestEmail: true,
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
      },
      data: {
        status: BookingStatus.cancelled,
        paymentNote: 'Réservation expirée : paiement non finalisé.',
      },
    });

    this.logger.warn(
      `Cleanup pending website bookings: ${result.count} réservation(s) expirée(s) annulée(s).`,
    );

    for (const booking of expiredBookings) {
      this.logger.warn(
        `Réservation pending expirée annulée: bookingId=${booking.id}, bookingGroupId=${
          booking.bookingGroupId ?? 'none'
        }, guestEmail=${booking.guestEmail}, stripePaymentIntentId=${
          booking.stripePaymentIntentId ?? 'none'
        }, createdAt=${booking.createdAt.toISOString()}`,
      );
    }
  }
}