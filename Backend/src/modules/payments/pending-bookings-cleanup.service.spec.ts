import { Test } from '@nestjs/testing';
import {
  BookingSource,
  BookingStatus,
  PaymentStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PendingBookingsCleanupService } from './pending-bookings-cleanup.service';

describe('PendingBookingsCleanupService', () => {
  let service: PendingBookingsCleanupService;

  const tx = {
    $queryRaw: jest.fn(),
    booking: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn((callback: (mockTx: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    tx.$queryRaw.mockResolvedValue([{ locked: true }]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PendingBookingsCleanupService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(PendingBookingsCleanupService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('annule les réservations website pending/unpaid Stripe expirées', async () => {
    const oldBooking = {
      id: 'booking_1',
      bookingGroupId: 'group_1',
      guestEmail: 'test@example.com',
      stripePaymentIntentId: 'pi_old',
      createdAt: new Date('2026-05-13T10:00:00.000Z'),
    };

    tx.booking.findMany.mockResolvedValue([oldBooking]);
    tx.booking.updateMany.mockResolvedValue({ count: 1 });

    await service.cancelExpiredPendingStripeBookings();

    expect(tx.booking.findMany).toHaveBeenCalledWith({
      where: {
        bookingSource: BookingSource.website,
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
        createdAt: {
          lt: expect.any(Date),
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

    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['booking_1'],
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
  });

  it('ne fait rien si aucune réservation expirée', async () => {
    tx.booking.findMany.mockResolvedValue([]);

    await service.cancelExpiredPendingStripeBookings();

    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it("n'exécute rien si le verrou consultatif est déjà détenu par une autre instance", async () => {
    tx.$queryRaw.mockResolvedValue([{ locked: false }]);

    await service.cancelExpiredPendingStripeBookings();

    expect(tx.booking.findMany).not.toHaveBeenCalled();
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });
});
