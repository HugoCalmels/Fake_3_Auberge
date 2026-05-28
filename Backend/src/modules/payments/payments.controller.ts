import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CreateBookingCheckoutDto } from './dto/create-booking-checkout.dto';
import { CreateBookingPaymentIntentDto } from './dto/create-booking-payment-intent.dto';
import { PaymentIntentActionDto } from './dto/payment-intent-action.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('booking-checkout')
  createBookingCheckout(@Body() dto: CreateBookingCheckoutDto) {
    return this.paymentsService.createBookingCheckout(dto);
  }

  @Post('booking-payment-intent')
  createBookingPaymentIntent(@Body() dto: CreateBookingPaymentIntentDto) {
    return this.paymentsService.createBookingPaymentIntent(dto);
  }

  @Post('booking-payment-intent/confirm')
  confirmBookingPaymentIntent(@Body() dto: PaymentIntentActionDto) {
    return this.paymentsService.confirmBookingPaymentIntent(dto.paymentIntentId);
  }

  @Post('booking-payment-intent/cancel')
  cancelBookingPaymentIntent(@Body() dto: PaymentIntentActionDto) {
    return this.paymentsService.cancelBookingPaymentIntent(dto.paymentIntentId);
  }

  @Post('stripe/webhook')
  @HttpCode(200)
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody, signature);
  }
}