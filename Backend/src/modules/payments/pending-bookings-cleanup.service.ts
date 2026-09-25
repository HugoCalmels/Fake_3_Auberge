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

// Arbitrary app-specific key for Postgres advisory locking (any bigint works,
// it just needs to be consistent across instances/processes).
const CLEANUP_ADVISORY_LOCK_KEY = 727_401_001;

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
    // pg_try_advisory_xact_lock is scoped to the transaction and auto-released
    // on commit/rollback: if another instance/process already holds it, this
    // one skips the sweep instead of racing it on the same rows.
    await this.prisma.$transaction(async (tx) => {
      const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(${CLEANUP_ADVISORY_LOCK_KEY}) as locked
      `;

      if (!locked) {
        this.logger.log(
          'Cleanup pending website bookings ignoré : verrou déjà détenu par une autre instance.',
        );
        return;
      }

      const expiresBefore = new Date(
        Date.now() - PENDING_EXPIRATION_MINUTES * 60 * 1000,
      );

      const expiredBookings = await tx.booking.findMany({
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

      const result = await tx.booking.updateMany({
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
    });
  }
}
