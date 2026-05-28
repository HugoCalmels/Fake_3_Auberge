import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdminBookingSelectionDto {
  @IsString()
  @MinLength(1)
  roomTypeId!: string;

  @IsInt()
  @Min(1)
  adults!: number;

  @IsInt()
  @Min(0)
  children!: number;

  @IsIn(['room_only', 'half_board', 'full_board'])
  mealPlanCode!: 'room_only' | 'half_board' | 'full_board';
}

export class CreateAdminBookingDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @MinLength(1)
  guestName!: string;

  @IsEmail()
  guestEmail!: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsIn(['paid', 'unpaid'])
  paymentStatus!: 'paid' | 'unpaid';

  @IsOptional()
  @IsString()
  paymentNote?: string;

  @IsIn(['admin', 'visitor'])
  createdBy!: 'admin' | 'visitor';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAdminBookingSelectionDto)
  selections!: CreateAdminBookingSelectionDto[];
}