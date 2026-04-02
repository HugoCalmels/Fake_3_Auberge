import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdminBookingDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsInt()
  @Min(1)
  persons!: number;

  @IsInt()
  @Min(0)
  adultMeals!: number;

  @IsInt()
  @Min(0)
  childMeals!: number;

  @IsString()
  @MinLength(1)
  guestName!: string;

  @IsEmail()
  guestEmail!: string;

  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsOptional()
  @IsString()
  mealPlanId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}
