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

export class CreateBookingSelectionDto {
  @IsString()
  @MinLength(1)
  roomTypeId: string;

  @IsInt()
  @Min(1)
  adults: number;

  @IsInt()
  @Min(0)
  children: number;

  @IsIn(['room_only', 'half_board', 'full_board'])
  mealPlanCode: 'room_only' | 'half_board' | 'full_board';
}

export class CreateBookingDto {
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
  @Type(() => CreateBookingSelectionDto)
  selections: CreateBookingSelectionDto[];
}