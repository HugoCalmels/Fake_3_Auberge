import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  BookingStatus,
  PaymentStatus,
  SystemLogLevel,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { CreateBookingCheckoutDto } from './dto/create-booking-checkout.dto';
import { CreateBookingPaymentIntentDto } from './dto/create-booking-payment-intent.dto';
import { MailerService } from '../mailer/mailer.service';
import { InvoicesService } from '../invoices/invoices.service';
import { InvoicePdfService } from '../invoices/invoice-pdf.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly systemLogsService: SystemLogsService,
    private readonly mailerService: MailerService,
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY manquant dans le .env');
    }

    this.stripe = new Stripe(stripeSecretKey);
  }

  async createBookingCheckout(dto: CreateBookingCheckoutDto) {
    const bookingResult =
      await this.bookingsService.createPendingWebsiteBooking(dto);

    if (bookingResult.pricing.totalPrice <= 0) {
      throw new BadRequestException('Le montant de la réservation est invalide.');
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: [dto.paymentMethod === 'paypal' ? 'paypal' : 'card'],
      customer_email: dto.guestEmail.trim().toLowerCase(),
      client_reference_id: bookingResult.bookingGroupId,
      success_url: `${frontendUrl}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/reservation/cancel`,
      metadata: {
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds.join(','),
        paymentMethod: dto.paymentMethod,
      },
      payment_intent_data: {
        metadata: {
          bookingGroupId: bookingResult.bookingGroupId,
          bookingIds: bookingResult.bookingIds.join(','),
          paymentMethod: dto.paymentMethod,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: bookingResult.pricing.totalPrice * 100,
            product_data: {
              name: 'Auberge du Montcalm',
              description: `Réservation · ${bookingResult.selectionCount} chambre(s) · ${bookingResult.pricing.nights} nuit(s)`,
            },
          },
        },
      ],
    });

    await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingResult.bookingIds,
        },
      },
      data: {
        stripeCheckoutSessionId: session.id,
        paymentNote: `Session Stripe créée : ${session.id}`,
      },
    });

    await this.systemLogsService.create({
      level: SystemLogLevel.info,
      type: 'checkout_session_created',
      message: 'Session Stripe Checkout créée.',
      metadata: {
        sessionId: session.id,
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds,
        roomIds: bookingResult.roomIds,
        paymentMethod: dto.paymentMethod,
        totalPrice: bookingResult.pricing.totalPrice,
      },
    });

    return {
      success: true,
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      bookingIds: bookingResult.bookingIds,
      roomIds: bookingResult.roomIds,
      selectionCount: bookingResult.selectionCount,
      pricing: bookingResult.pricing,
    };
  }

  async createBookingPaymentIntent(dto: CreateBookingPaymentIntentDto) {
    if (dto.paymentMethod !== 'card') {
      throw new BadRequestException('PayPal sera branché plus tard.');
    }

    const bookingResult =
      await this.bookingsService.createPendingWebsiteBooking(dto);

    if (bookingResult.pricing.totalPrice <= 0) {
      throw new BadRequestException('Le montant de la réservation est invalide.');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: bookingResult.pricing.totalPrice * 100,
      currency: 'eur',
      payment_method_types: ['card'],
      receipt_email: dto.guestEmail.trim().toLowerCase(),
      metadata: {
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds.join(','),
        paymentMethod: dto.paymentMethod,
      },
      description: `Auberge du Montcalm · ${bookingResult.selectionCount} chambre(s) · ${bookingResult.pricing.nights} nuit(s)`,
    });

    await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingResult.bookingIds,
        },
      },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentNote: `PaymentIntent Stripe créé : ${paymentIntent.id}`,
      },
    });

    await this.systemLogsService.create({
      level: SystemLogLevel.info,
      type: 'payment_intent_created',
      message: 'PaymentIntent Stripe créé.',
      metadata: {
        paymentIntentId: paymentIntent.id,
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds,
        roomIds: bookingResult.roomIds,
        totalPrice: bookingResult.pricing.totalPrice,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });

    if (!paymentIntent.client_secret) {
      await this.systemLogsService.create({
        level: SystemLogLevel.error,
        type: 'payment_intent_missing_client_secret',
        message: 'Client secret Stripe introuvable après création du PaymentIntent.',
        metadata: {
          paymentIntentId: paymentIntent.id,
          bookingIds: bookingResult.bookingIds,
        },
      });

      throw new BadRequestException('Client secret Stripe introuvable.');
    }

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      bookingIds: bookingResult.bookingIds,
      roomIds: bookingResult.roomIds,
      selectionCount: bookingResult.selectionCount,
      pricing: bookingResult.pricing,
    };
  }

  async handleStripeWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET manquant.');
    }

    if (!rawBody) {
      throw new BadRequestException('Raw body Stripe manquant.');
    }

    if (!signature) {
      throw new BadRequestException('Signature Stripe manquante.');
    }

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Stripe webhook signature error', error);
      throw new BadRequestException('Signature Stripe invalide.');
    }

    if (event.type === 'payment_intent.succeeded') {
      await this.confirmPaidBookingsFromPaymentIntent(event.data.object);
    }

    if (event.type === 'payment_intent.payment_failed') {
      await this.markFailedBookingsFromPaymentIntent(event.data.object);
    }

    if (event.type === 'checkout.session.expired') {
      await this.cancelExpiredPendingBookingsFromSession(event.data.object);
    }

    return { received: true };
  }

  async confirmBookingPaymentIntent(paymentIntentId: string) {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    this.logger.log(
      `Confirm PaymentIntent ${paymentIntent.id} - status=${paymentIntent.status}`,
    );

    if (paymentIntent.status !== 'succeeded') {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'payment_confirm_failed',
        message: `Paiement non confirmé par Stripe : ${paymentIntent.status}`,
        metadata: {
          paymentIntentId: paymentIntent.id,
          stripeStatus: paymentIntent.status,
        },
      });

      throw new BadRequestException(
        `Paiement non confirmé par Stripe : ${paymentIntent.status}`,
      );
    }

    const bookingIds = this.getBookingIdsFromMetadata(paymentIntent.metadata);
    const bookingGroupId = this.getBookingGroupIdFromMetadata(
      paymentIntent.metadata,
    );

    if (bookingIds.length === 0) {
      await this.systemLogsService.create({
        level: SystemLogLevel.error,
        type: 'payment_missing_booking_ids',
        message: 'Paiement Stripe réussi sans réservation liée.',
        metadata: {
          paymentIntentId: paymentIntent.id,
        },
      });

      throw new BadRequestException('Aucune réservation liée à ce paiement.');
    }

    const alreadyPaidCount = await this.prisma.booking.count({
      where: {
        id: {
          in: bookingIds,
        },
        paymentStatus: PaymentStatus.paid,
      },
    });

    if (alreadyPaidCount === bookingIds.length) {
      this.logger.log(`PaymentIntent ${paymentIntent.id} déjà confirmé côté DB.`);

      if (bookingGroupId) {
        await this.invoicesService.createForBookingGroup({
          bookingGroupId,
          stripePaymentIntentId: paymentIntent.id,
        });
      }

      await this.systemLogsService.create({
        level: SystemLogLevel.info,
        type: 'payment_already_confirmed',
        message: 'Paiement Stripe déjà confirmé.',
        metadata: {
          paymentIntentId: paymentIntent.id,
          bookingGroupId,
          bookingIds,
        },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        bookingGroupId,
        bookingIds,
      };
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
        status: BookingStatus.pending,
      },
      data: {
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
        stripePaymentIntentId: paymentIntent.id,
        paymentNote: `Paiement Stripe confirmé : ${paymentIntent.id}`,
      },
    });

    this.logger.log(
      `PaymentIntent ${paymentIntent.id} confirmé. Réservations mises à jour : ${result.count}`,
    );

    await this.systemLogsService.create({
      level: SystemLogLevel.info,
      type: 'payment_confirmed',
      message: `Paiement confirmé. ${result.count} réservation(s) validée(s).`,
      metadata: {
        paymentIntentId: paymentIntent.id,
        bookingGroupId,
        bookingIds,
        updatedCount: result.count,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });

    await this.sendBookingConfirmationEmails({
      bookingIds,
      updatedCount: result.count,
      bookingGroupId,
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      bookingGroupId,
      bookingIds,
    };
  }

  async cancelBookingPaymentIntent(paymentIntentId: string) {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    this.logger.warn(
      `Cancel PaymentIntent ${paymentIntent.id} - status=${paymentIntent.status}`,
    );

    const bookingIds = this.getBookingIdsFromMetadata(paymentIntent.metadata);

    if (bookingIds.length === 0) {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'payment_cancel_missing_booking_ids',
        message: 'Annulation paiement sans réservation liée.',
        metadata: {
          paymentIntentId,
          stripeStatus: paymentIntent.status,
        },
      });

      return {
        success: true,
        paymentIntentId,
        updatedCount: 0,
      };
    }

    if (
      paymentIntent.status === 'succeeded' ||
      paymentIntent.status === 'processing'
    ) {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'payment_cancel_rejected',
        message: `Suppression refusée : paiement ${paymentIntent.status}.`,
        metadata: {
          paymentIntentId,
          bookingIds,
          stripeStatus: paymentIntent.status,
        },
      });

      throw new BadRequestException(
        `Impossible de supprimer : paiement ${paymentIntent.status}.`,
      );
    }

    await this.stripe.paymentIntents.cancel(paymentIntentId).catch(() => null);

    const result = await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
      },
      data: {
        status: BookingStatus.cancelled,
        paymentNote: `Paiement annulé/refusé : ${paymentIntent.id}`,
      },
    });

    this.logger.warn(
      `PaymentIntent ${paymentIntent.id} annulé. Réservations pending annulées : ${result.count}`,
    );

    for (const bookingId of bookingIds) {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'payment_cancelled',
        message: 'Paiement annulé/refusé. Réservation annulée.',
        bookingId,
        metadata: {
          paymentIntentId: paymentIntent.id,
          stripeStatus: paymentIntent.status,
          previousStatus: BookingStatus.pending,
          newStatus: BookingStatus.cancelled,
          previousPaymentStatus: PaymentStatus.unpaid,
          updatedCount: result.count,
        },
      });
    }

    return {
      success: true,
      paymentIntentId,
      updatedCount: result.count,
    };
  }

  private async confirmPaidBookingsFromPaymentIntent(paymentIntent: any) {
    const bookingIds = this.getBookingIdsFromMetadata(paymentIntent.metadata);
    const bookingGroupId = this.getBookingGroupIdFromMetadata(
      paymentIntent.metadata,
    );

    if (bookingIds.length === 0) {
      await this.systemLogsService.create({
        level: SystemLogLevel.error,
        type: 'webhook_payment_missing_booking_ids',
        message: 'Webhook payment_intent.succeeded sans réservation liée.',
        metadata: {
          paymentIntentId: paymentIntent.id,
          bookingGroupId,
        },
      });

      return;
    }

    const alreadyPaidCount = await this.prisma.booking.count({
      where: {
        id: {
          in: bookingIds,
        },
        paymentStatus: PaymentStatus.paid,
      },
    });

    if (alreadyPaidCount === bookingIds.length) {
      if (bookingGroupId) {
        await this.invoicesService.createForBookingGroup({
          bookingGroupId,
          stripePaymentIntentId: paymentIntent.id,
        });
      }

      await this.systemLogsService.create({
        level: SystemLogLevel.info,
        type: 'webhook_payment_already_confirmed',
        message: 'Webhook reçu pour un paiement déjà confirmé.',
        metadata: {
          paymentIntentId: paymentIntent.id,
          bookingGroupId,
          bookingIds,
        },
      });

      return;
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
        status: BookingStatus.pending,
      },
      data: {
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
        stripePaymentIntentId: paymentIntent.id,
        paymentNote: `Paiement Stripe confirmé : ${paymentIntent.id}`,
      },
    });

    await this.systemLogsService.create({
      level: SystemLogLevel.info,
      type: 'webhook_payment_confirmed',
      message: `Webhook Stripe payment_intent.succeeded reçu. ${result.count} réservation(s) confirmée(s).`,
      metadata: {
        paymentIntentId: paymentIntent.id,
        bookingGroupId,
        bookingIds,
        updatedCount: result.count,
      },
    });

    await this.sendBookingConfirmationEmails({
      bookingIds,
      updatedCount: result.count,
      bookingGroupId,
      stripePaymentIntentId: paymentIntent.id,
    });
  }

  private async markFailedBookingsFromPaymentIntent(paymentIntent: any) {
    const bookingIds = this.getBookingIdsFromMetadata(paymentIntent.metadata);

    if (bookingIds.length === 0) {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'payment_failed_missing_booking_ids',
        message: 'Paiement Stripe refusé sans réservation liée.',
        metadata: {
          paymentIntentId: paymentIntent.id,
        },
      });

      return;
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
      },
      data: {
        status: BookingStatus.cancelled,
        paymentNote: `Paiement Stripe refusé : ${paymentIntent.id}`,
      },
    });

    for (const bookingId of bookingIds) {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'payment_failed',
        message: 'Paiement Stripe refusé. Réservation annulée.',
        bookingId,
        metadata: {
          paymentIntentId: paymentIntent.id,
          bookingIds,
          updatedCount: result.count,
          previousStatus: BookingStatus.pending,
          newStatus: BookingStatus.cancelled,
          previousPaymentStatus: PaymentStatus.unpaid,
        },
      });
    }
  }

  private async sendBookingConfirmationEmails(input: {
    bookingIds: string[];
    updatedCount: number;
    bookingGroupId: string | null;
    stripePaymentIntentId: string;
  }) {
    if (input.updatedCount <= 0) return;

    const confirmedBookings = await this.prisma.booking.findMany({
      where: {
        id: {
          in: input.bookingIds,
        },
      },
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
      },
    });

    if (confirmedBookings.length === 0) return;

    const firstBooking = confirmedBookings[0];

    const totalPaid = confirmedBookings.reduce(
      (sum, booking) => sum + booking.totalPrice,
      0,
    );

    let invoiceNumber: string | undefined;
    let invoicePdfBase64: string | undefined;

    if (input.bookingGroupId) {
      const invoice = await this.invoicesService.createForBookingGroup({
        bookingGroupId: input.bookingGroupId,
        stripePaymentIntentId: input.stripePaymentIntentId,
      });

      const invoicePdf = await this.invoicePdfService.generateForInvoice(
        invoice.id,
      );

      invoiceNumber = invoice.number;
      invoicePdfBase64 = invoicePdf.toString('base64');
    }

    try {
      await this.mailerService.sendBookingConfirmation({
        guestEmail: firstBooking.guestEmail,
        guestName: firstBooking.guestName,
        startDate: firstBooking.startDate,
        endDate: firstBooking.endDate,
        totalPrice: totalPaid,
        bookingIds: input.bookingIds,
        invoiceNumber,
        invoicePdfBase64,
      });

      await this.mailerService.sendBookingNotificationToAdmin({
        guestEmail: firstBooking.guestEmail,
        guestName: firstBooking.guestName,
        startDate: firstBooking.startDate,
        endDate: firstBooking.endDate,
        totalPrice: totalPaid,
        bookingIds: input.bookingIds,
        invoiceNumber,
        invoicePdfBase64,
      });

      await this.systemLogsService.create({
        level: SystemLogLevel.info,
        type: 'booking_confirmation_emails_sent',
        message: 'Emails de confirmation réservation envoyés.',
        metadata: {
          bookingIds: input.bookingIds,
          guestEmail: firstBooking.guestEmail,
          totalPaid,
          invoiceNumber,
        },
      });
    } catch (error) {
      await this.systemLogsService.create({
        level: SystemLogLevel.error,
        type: 'booking_confirmation_email_failed',
        message: 'Erreur lors de l’envoi des emails de confirmation.',
        metadata: {
          bookingIds: input.bookingIds,
          guestEmail: firstBooking.guestEmail,
          invoiceNumber,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  private async cancelExpiredPendingBookingsFromSession(session: any) {
    const bookingIds = this.getBookingIdsFromSession(session);

    if (bookingIds.length === 0) {
      return;
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
      },
      data: {
        status: BookingStatus.cancelled,
        paymentNote: `Session Stripe expirée : ${session.id}`,
      },
    });

    for (const bookingId of bookingIds) {
      await this.systemLogsService.create({
        level: SystemLogLevel.warn,
        type: 'checkout_session_expired',
        message: 'Session Stripe expirée. Réservation annulée.',
        bookingId,
        metadata: {
          sessionId: session.id,
          bookingIds,
          updatedCount: result.count,
          previousStatus: BookingStatus.pending,
          newStatus: BookingStatus.cancelled,
          previousPaymentStatus: PaymentStatus.unpaid,
        },
      });
    }
  }

  private getBookingIdsFromSession(session: any) {
    return (
      session.metadata?.bookingIds
        ?.split(',')
        .map((id: string) => id.trim())
        .filter(Boolean) ?? []
    );
  }

  private getBookingIdsFromMetadata(metadata: any) {
    return (
      metadata?.bookingIds
        ?.split(',')
        .map((id: string) => id.trim())
        .filter(Boolean) ?? []
    );
  }

  private getBookingGroupIdFromMetadata(metadata: any) {
    return metadata?.bookingGroupId?.trim() || null;
  }
}