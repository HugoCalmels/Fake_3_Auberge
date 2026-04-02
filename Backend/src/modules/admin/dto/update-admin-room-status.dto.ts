import { IsIn } from 'class-validator';

export class UpdateAdminRoomStatusDto {
  @IsIn(['available', 'occupied', 'maintenance'])
  status: 'available' | 'occupied' | 'maintenance';
}
