import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BookingStatus, PaymentStatus, SystemLogLevel } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { PaymentsService } from './payments.service';

const mockStripeRetrieve = jest.fn();
const mockStripeCancel = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      retrieve: mockStripeRetrieve,
      cancel: mockStripeCancel,
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;

  const prisma = {
    booking: {
      count: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const bookingsService = {};
  const systemLogsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
        {
          provide: SystemLogsService,
          useValue: systemLogsService,
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  describe('confirmBookingPaymentIntent', () => {
    it('confirme une réservation pending/unpaid quand Stripe est succeeded', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_success',
        status: 'succeeded',
        amount: 7500,
        currency: 'eur',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.confirmBookingPaymentIntent('pi_success');

      expect(mockStripeRetrieve).toHaveBeenCalledWith('pi_success');

      expect(prisma.booking.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['booking_1'],
          },
          status: BookingStatus.pending,
        },
        data: {
          status: BookingStatus.confirmed,
          paymentStatus: PaymentStatus.paid,
          stripePaymentIntentId: 'pi_success',
          paymentNote: 'Paiement Stripe confirmé : pi_success',
        },
      });

      expect(systemLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: SystemLogLevel.info,
          type: 'payment_confirmed',
        }),
      );

      expect(result).toEqual({
        success: true,
        paymentIntentId: 'pi_success',
        bookingIds: ['booking_1'],
      });
    });

    it('throw si Stripe ne confirme pas le paiement', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_failed',
        status: 'requires_payment_method',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      await expect(
        service.confirmBookingPaymentIntent('pi_failed'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.booking.updateMany).not.toHaveBeenCalled();

      expect(systemLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: SystemLogLevel.warn,
          type: 'payment_confirm_failed',
        }),
      );
    });

    it('ne reconfirme pas si toutes les réservations sont déjà paid', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_already_paid',
        status: 'succeeded',
        metadata: {
          bookingIds: 'booking_1,booking_2',
        },
      });

      prisma.booking.count.mockResolvedValue(2);

      const result = await service.confirmBookingPaymentIntent(
        'pi_already_paid',
      );

      expect(prisma.booking.updateMany).not.toHaveBeenCalled();

      expect(systemLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: SystemLogLevel.info,
          type: 'payment_already_confirmed',
        }),
      );

      expect(result).toEqual({
        success: true,
        paymentIntentId: 'pi_already_paid',
        bookingIds: ['booking_1', 'booking_2'],
      });
    });
  });

  describe('cancelBookingPaymentIntent', () => {
    it('annule une réservation pending/unpaid sans la supprimer', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_cancel',
        status: 'requires_payment_method',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      mockStripeCancel.mockResolvedValue({});
      prisma.booking.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.cancelBookingPaymentIntent('pi_cancel');

      expect(mockStripeCancel).toHaveBeenCalledWith('pi_cancel');

      expect(prisma.booking.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['booking_1'],
          },
          status: BookingStatus.pending,
          paymentStatus: PaymentStatus.unpaid,
        },
        data: {
          status: BookingStatus.cancelled,
          paymentNote: 'Paiement annulé/refusé : pi_cancel',
        },
      });

      expect(systemLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: SystemLogLevel.warn,
          type: 'payment_cancelled',
          bookingId: 'booking_1',
        }),
      );

      expect(result).toEqual({
        success: true,
        paymentIntentId: 'pi_cancel',
        updatedCount: 1,
      });
    });

    it('refuse d’annuler si Stripe est déjà succeeded', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_success',
        status: 'succeeded',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      await expect(
        service.cancelBookingPaymentIntent('pi_success'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.booking.updateMany).not.toHaveBeenCalled();

      expect(systemLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: SystemLogLevel.warn,
          type: 'payment_cancel_rejected',
        }),
      );
    });
  });
});