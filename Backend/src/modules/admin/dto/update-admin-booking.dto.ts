import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class UpdateAdminBookingDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  persons?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  adultMeals?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  childMeals?: number;

  @IsOptional()
  @IsString()
  mealPlanId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}