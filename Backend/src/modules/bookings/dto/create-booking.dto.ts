import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingSelectionDto {
  @IsIn(['double', 'twin', 'quadruple', 'familiale', 'cinq_places'])
  roomTypeId: 'double' | 'twin' | 'quadruple' | 'familiale' | 'cinq_places';

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookingSelectionDto)
  selections: CreateBookingSelectionDto[];
}
