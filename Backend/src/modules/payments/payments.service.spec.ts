import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  BookingStatus,
  PaymentStatus,
  SystemLogType,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { MailerService } from '../mailer/mailer.service';
import { InvoicesService } from '../invoices/invoices.service';
import { InvoicePdfService } from '../invoices/invoice-pdf.service';
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
    systemLog: {
      findFirst: jest.fn(),
    },
  };

  const bookingsService = {};
  const systemLogsService = {
    create: jest.fn(),
  };
  const mailerService = {
    sendBookingConfirmation: jest.fn(),
    sendBookingNotificationToAdmin: jest.fn(),
  };
  const invoicesService = {
    createForBookingGroup: jest.fn(),
  };
  const invoicePdfService = {
    generateForInvoice: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    prisma.booking.findMany.mockResolvedValue([]);

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
        {
          provide: MailerService,
          useValue: mailerService,
        },
        {
          provide: InvoicesService,
          useValue: invoicesService,
        },
        {
          provide: InvoicePdfService,
          useValue: invoicePdfService,
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  describe('confirmBookingPaymentIntent', () => {
    it('confirme une réservation pending/unpaid quand Stripe est succeeded', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_success',
        client_secret: 'pi_success_secret',
        status: 'succeeded',
        amount: 7500,
        currency: 'eur',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      prisma.booking.count
        .mockResolvedValueOnce(0) // alreadyPaidCount
        .mockResolvedValueOnce(1); // pendingCount
      prisma.booking.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.confirmBookingPaymentIntent(
        'pi_success',
        'pi_success_secret',
      );

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
          type: SystemLogType.website_booking_validated,
        }),
      );

      expect(result).toEqual({
        success: true,
        paymentIntentId: 'pi_success',
        bookingGroupId: null,
        bookingIds: ['booking_1'],
      });
    });

    it('throw si Stripe ne confirme pas le paiement', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_failed',
        client_secret: 'pi_failed_secret',
        status: 'requires_payment_method',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      await expect(
        service.confirmBookingPaymentIntent('pi_failed', 'pi_failed_secret'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.booking.updateMany).not.toHaveBeenCalled();

      expect(systemLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SystemLogType.website_booking_failed,
        }),
      );
    });

    it('ne reconfirme pas si toutes les réservations sont déjà paid', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_already_paid',
        client_secret: 'pi_already_paid_secret',
        status: 'succeeded',
        metadata: {
          bookingIds: 'booking_1,booking_2',
        },
      });

      prisma.booking.count.mockResolvedValue(2);

      const result = await service.confirmBookingPaymentIntent(
        'pi_already_paid',
        'pi_already_paid_secret',
      );

      expect(prisma.booking.updateMany).not.toHaveBeenCalled();

      expect(systemLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SystemLogType.website_booking_validated,
        }),
      );

      expect(result).toEqual({
        success: true,
        paymentIntentId: 'pi_already_paid',
        bookingGroupId: null,
        bookingIds: ['booking_1', 'booking_2'],
      });
    });
  });

  describe('cancelBookingPaymentIntent', () => {
    it('annule une réservation pending/unpaid sans la supprimer', async () => {
      mockStripeRetrieve.mockResolvedValue({
        id: 'pi_cancel',
        client_secret: 'pi_cancel_secret',
        status: 'requires_payment_method',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      mockStripeCancel.mockResolvedValue({});
      prisma.booking.count.mockResolvedValue(1); // cancellableCount
      prisma.booking.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.cancelBookingPaymentIntent(
        'pi_cancel',
        'pi_cancel_secret',
      );

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
          type: SystemLogType.website_booking_failed,
          metadata: expect.objectContaining({
            bookingIds: ['booking_1'],
          }),
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
        client_secret: 'pi_success_secret',
        status: 'succeeded',
        metadata: {
          bookingIds: 'booking_1',
        },
      });

      await expect(
        service.cancelBookingPaymentIntent('pi_success', 'pi_success_secret'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.booking.updateMany).not.toHaveBeenCalled();
      expect(mockStripeCancel).not.toHaveBeenCalled();
      expect(systemLogsService.create).not.toHaveBeenCalled();
    });
  });
});
