import { IsIn } from 'class-validator';
import { BookingGuestRequestDto } from '../../bookings/dto/booking-guest-request.dto';

export class CreateBookingPaymentIntentDto extends BookingGuestRequestDto {
  @IsIn(['card', 'paypal'])
  paymentMethod: 'card' | 'paypal';
}
