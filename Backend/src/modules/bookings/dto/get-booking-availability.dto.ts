import { IsDateString } from 'class-validator';

export class GetBookingAvailabilityDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
