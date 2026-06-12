import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  BookingStatus,
  PaymentStatus,
  SystemLogType,
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
      await this.logWebsiteBookingFailed({
        reason: 'Montant de réservation invalide.',
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds,
        guestEmail: dto.guestEmail,
      });

      throw new BadRequestException('Le montant de la réservation est invalide.');
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: [
          dto.paymentMethod === 'paypal' ? 'paypal' : 'card',
        ],
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

      this.logger.log(
        `Session Stripe Checkout créée pour bookingGroupId=${bookingResult.bookingGroupId}`,
      );

      return {
        success: true,
        checkoutUrl: session.url,
        checkoutSessionId: session.id,
        bookingIds: bookingResult.bookingIds,
        roomIds: bookingResult.roomIds,
        selectionCount: bookingResult.selectionCount,
        pricing: bookingResult.pricing,
      };
    } catch (error) {
      await this.cancelPendingBookingsAfterWebsiteFailure({
        bookingIds: bookingResult.bookingIds,
        paymentNote:
          'Réservation annulée automatiquement : création session Stripe impossible.',
      });

      await this.logWebsiteBookingFailed({
        reason: 'Création session Stripe impossible.',
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds,
        guestEmail: dto.guestEmail,
        error,
      });

      throw error;
    }
  }

  async createBookingPaymentIntent(dto: CreateBookingPaymentIntentDto) {
    if (dto.paymentMethod !== 'card') {
      throw new BadRequestException('PayPal sera branché plus tard.');
    }

    const bookingResult =
      await this.bookingsService.createPendingWebsiteBooking(dto);

    if (bookingResult.pricing.totalPrice <= 0) {
      await this.logWebsiteBookingFailed({
        reason: 'Montant de réservation invalide.',
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds,
        guestEmail: dto.guestEmail,
      });

      throw new BadRequestException('Le montant de la réservation est invalide.');
    }

    let paymentIntent: any;

    try {
      paymentIntent = await this.stripe.paymentIntents.create({
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
    } catch (error) {
      await this.cancelPendingBookingsAfterWebsiteFailure({
        bookingIds: bookingResult.bookingIds,
        paymentNote:
          'Réservation annulée automatiquement : création PaymentIntent Stripe impossible.',
      });

      await this.logWebsiteBookingFailed({
        reason: 'Création PaymentIntent Stripe impossible.',
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds,
        guestEmail: dto.guestEmail,
        error,
      });

      throw error;
    }

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

    this.logger.log(
      `PaymentIntent Stripe créé pour bookingGroupId=${bookingResult.bookingGroupId}`,
    );

    if (!paymentIntent.client_secret) {
      await this.logWebsiteBookingFailed({
        reason: 'Client secret Stripe introuvable.',
        bookingGroupId: bookingResult.bookingGroupId,
        bookingIds: bookingResult.bookingIds,
        guestEmail: dto.guestEmail,
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

    const bookingIds = this.getBookingIdsFromMetadata(paymentIntent.metadata);
    const bookingGroupId = this.getBookingGroupIdFromMetadata(
      paymentIntent.metadata,
    );

    if (paymentIntent.status !== 'succeeded') {
      await this.logWebsiteBookingFailed({
        reason: `Paiement non confirmé par Stripe : ${paymentIntent.status}`,
        bookingGroupId,
        bookingIds,
        metadata: {
          paymentIntentId: paymentIntent.id,
          stripeStatus: paymentIntent.status,
        },
      });

      throw new BadRequestException(
        `Paiement non confirmé par Stripe : ${paymentIntent.status}`,
      );
    }

    if (bookingIds.length === 0) {
      await this.logWebsiteBookingFailed({
        reason: 'Paiement Stripe réussi sans réservation liée.',
        bookingGroupId,
        bookingIds,
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

      await this.logWebsiteBookingValidatedOnce({
        bookingGroupId,
        bookingIds,
        paymentIntentId: paymentIntent.id,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency,
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

    await this.logWebsiteBookingValidatedOnce({
      bookingGroupId,
      bookingIds,
      paymentIntentId: paymentIntent.id,
      amountCents: paymentIntent.amount,
      currency: paymentIntent.currency,
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
    const bookingGroupId = this.getBookingGroupIdFromMetadata(
      paymentIntent.metadata,
    );

    if (bookingIds.length === 0) {
      this.logger.warn(
        `Annulation paiement sans réservation liée. paymentIntentId=${paymentIntentId}`,
      );

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

    await this.logWebsiteBookingFailed({
      reason: 'Paiement annulé/refusé.',
      bookingGroupId,
      bookingIds,
      metadata: {
        paymentIntentId: paymentIntent.id,
        stripeStatus: paymentIntent.status,
        updatedCount: result.count,
      },
    });

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
      await this.logWebsiteBookingFailed({
        reason: 'Webhook Stripe réussi sans réservation liée.',
        bookingGroupId,
        bookingIds,
        metadata: {
          paymentIntentId: paymentIntent.id,
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

      await this.logWebsiteBookingValidatedOnce({
        bookingGroupId,
        bookingIds,
        paymentIntentId: paymentIntent.id,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency,
      });

      this.logger.log(
        `Webhook payment_intent.succeeded ignoré : paiement déjà confirmé. paymentIntentId=${paymentIntent.id}`,
      );

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

    await this.logWebsiteBookingValidatedOnce({
      bookingGroupId,
      bookingIds,
      paymentIntentId: paymentIntent.id,
      amountCents: paymentIntent.amount,
      currency: paymentIntent.currency,
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
    const bookingGroupId = this.getBookingGroupIdFromMetadata(
      paymentIntent.metadata,
    );

    if (bookingIds.length === 0) {
      this.logger.warn(
        `Paiement Stripe refusé sans réservation liée. paymentIntentId=${paymentIntent.id}`,
      );

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

    await this.logWebsiteBookingFailed({
      reason: 'Paiement Stripe refusé.',
      bookingGroupId,
      bookingIds,
      metadata: {
        paymentIntentId: paymentIntent.id,
        updatedCount: result.count,
      },
    });
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

      this.logger.log(
        `Emails de confirmation envoyés pour bookingGroupId=${input.bookingGroupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de l’envoi des emails de confirmation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
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

    this.logger.warn(
      `Session Stripe expirée. Réservations pending annulées : ${result.count}. sessionId=${session.id}`,
    );
  }

  private async cancelPendingBookingsAfterWebsiteFailure(input: {
    bookingIds: string[];
    paymentNote: string;
  }) {
    await this.prisma.booking.updateMany({
      where: {
        id: {
          in: input.bookingIds,
        },
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
      },
      data: {
        status: BookingStatus.cancelled,
        paymentNote: input.paymentNote,
      },
    });
  }

  private async logWebsiteBookingValidatedOnce(input: {
    bookingGroupId: string | null;
    bookingIds: string[];
    paymentIntentId: string;
    amountCents: number;
    currency: string;
  }) {
    if (input.bookingGroupId) {
      const existingLog = await this.prisma.systemLog.findFirst({
        where: {
          type: SystemLogType.website_booking_validated,
          bookingGroupId: input.bookingGroupId,
        },
        select: {
          id: true,
        },
      });

      if (existingLog) return;
    }

    await this.systemLogsService.create({
      type: SystemLogType.website_booking_validated,
      bookingGroupId: input.bookingGroupId ?? undefined,
      message: `Réservation validée depuis le site. ${input.bookingIds.length} chambre(s), total ${this.formatEurosFromCents(
        input.amountCents,
      )}.`,
      metadata: {
        paymentIntentId: input.paymentIntentId,
        bookingIds: input.bookingIds,
        amount: input.amountCents,
        currency: input.currency,
      },
    });
  }

  private async logWebsiteBookingFailed(input: {
    reason: string;
    bookingGroupId?: string | null;
    bookingIds?: string[];
    guestEmail?: string;
    error?: unknown;
    metadata?: Record<string, unknown>;
  }) {
    await this.systemLogsService.create({
      type: SystemLogType.website_booking_failed,
      bookingGroupId: input.bookingGroupId ?? undefined,
      message: `Réservation depuis le site échouée : ${input.reason}`,
      metadata: {
        bookingIds: input.bookingIds ?? [],
        guestEmail: input.guestEmail?.trim().toLowerCase(),
        error:
          input.error instanceof Error
            ? input.error.message
            : input.error
              ? String(input.error)
              : undefined,
        ...input.metadata,
      },
    });
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

  private formatEurosFromCents(amountCents: number) {
    return `${(amountCents / 100).toFixed(2).replace('.', ',')} €`;
  }
}