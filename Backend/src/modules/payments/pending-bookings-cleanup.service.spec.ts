import { Test } from '@nestjs/testing';
import {
  BookingSource,
  BookingStatus,
  PaymentStatus,
  SystemLogLevel,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { PendingBookingsCleanupService } from './pending-bookings-cleanup.service';

describe('PendingBookingsCleanupService', () => {
  let service: PendingBookingsCleanupService;

  const prisma = {
    booking: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const systemLogsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PendingBookingsCleanupService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: SystemLogsService,
          useValue: systemLogsService,
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
      guestName: 'Jean Test',
      guestEmail: 'test@example.com',
      roomId: 'room_1',
      startDate: new Date('2026-05-14T00:00:00.000Z'),
      endDate: new Date('2026-05-15T00:00:00.000Z'),
      status: BookingStatus.pending,
      paymentStatus: PaymentStatus.unpaid,
      stripePaymentIntentId: 'pi_old',
      createdAt: new Date('2026-05-13T10:00:00.000Z'),
    };

    prisma.booking.findMany.mockResolvedValue([oldBooking]);
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });

    await service.cancelExpiredPendingStripeBookings();

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        bookingSource: BookingSource.website,
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
        stripePaymentIntentId: {
          not: null,
        },
        createdAt: {
          lt: expect.any(Date),
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

    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['booking_1'],
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

    expect(systemLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        level: SystemLogLevel.warn,
        type: 'booking_payment_expired',
        bookingId: 'booking_1',
      }),
    );
  });

  it('ne fait rien si aucune réservation expirée', async () => {
    prisma.booking.findMany.mockResolvedValue([]);

    await service.cancelExpiredPendingStripeBookings();

    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
    expect(systemLogsService.create).not.toHaveBeenCalled();
  });
});