import { IsDateString, IsIn, IsInt, Min } from "class-validator";

export class CheckAvailabilityDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsInt()
  @Min(1)
  adults!: number;

  @IsInt()
  @Min(0)
  children!: number;

  @IsInt()
  @Min(1)
  rooms!: number;

  @IsIn(["double", "twin", "quadruple", "familiale", "cinq_places"])
  roomTypeId!: "double" | "twin" | "quadruple" | "familiale" | "cinq_places";
}