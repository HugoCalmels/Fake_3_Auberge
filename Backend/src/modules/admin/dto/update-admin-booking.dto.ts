import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAdminBookingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  guestName?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  adults?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn([
    'pending',
    'confirmed',
    'checked_in',
    'checked_out',
    'no_show',
    'cancelled',
  ])
  status?:
    | 'pending'
    | 'confirmed'
    | 'checked_in'
    | 'checked_out'
    | 'no_show'
    | 'cancelled';

  @IsOptional()
  @IsIn(['paid', 'unpaid'])
  paymentStatus?: 'paid' | 'unpaid';

  @IsOptional()
  @IsString()
  paymentNote?: string;

  @IsOptional()
  @IsIn(['room_only', 'half_board', 'full_board'])
  mealPlanCode?: 'room_only' | 'half_board' | 'full_board';
}
