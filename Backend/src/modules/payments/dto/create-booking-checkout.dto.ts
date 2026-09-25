import { IsIn } from 'class-validator';
import { BookingGuestRequestDto } from '../../bookings/dto/booking-guest-request.dto';

export class CreateBookingCheckoutDto extends BookingGuestRequestDto {
  @IsIn(['card', 'paypal'])
  paymentMethod: 'card' | 'paypal';
}
