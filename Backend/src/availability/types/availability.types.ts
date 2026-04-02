export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export type RoomTypeId =
  | 'simple'
  | 'double'
  | 'twin'
  | 'familiale'
  | 'pmr';

export interface Room {
  id: string;
  number: string;
  floor: number;
  roomTypeId: RoomTypeId;
  capacity: number;
  status: RoomStatus;
}

export interface Booking {
  id: string;
  roomId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  adults: number;
  children: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface AvailabilityResult {
  isAvailable: boolean;
  availableRoomsCount: number;
  matchingRoomIds: string[];
  message: string;
}