import { IsIn, IsInt, IsString, Min, MinLength } from 'class-validator';

export class BookingSelectionDto {
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
