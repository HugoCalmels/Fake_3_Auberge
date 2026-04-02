import { IsInt, IsString, Min, MinLength, IsIn } from 'class-validator';

export class CreateAdminRoomDto {
  @IsString()
  @MinLength(1)
  number: string;

  @IsInt()
  @Min(0)
  floor: number;

  @IsString()
  @MinLength(1)
  roomTypeId: string;

  @IsIn(['available', 'occupied', 'maintenance'])
  status: 'available' | 'occupied' | 'maintenance';
}
