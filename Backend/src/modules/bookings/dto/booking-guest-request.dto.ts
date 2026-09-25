import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingSelectionDto } from './booking-selection.dto';

// Shared shape (dates, guest info, room selections) behind the public
// booking-creation DTO and the two Stripe checkout/payment-intent DTOs.
export class BookingGuestRequestDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @MinLength(1)
  guestName: string;

  @IsEmail()
  guestEmail: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingSelectionDto)
  selections: BookingSelectionDto[];
}
