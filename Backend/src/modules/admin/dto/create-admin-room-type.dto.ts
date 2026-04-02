import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateAdminRoomTypeDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsInt()
  @Min(1)
  maxCapacity!: number;

  @IsInt()
  @Min(0)
  basePrice!: number;
}
