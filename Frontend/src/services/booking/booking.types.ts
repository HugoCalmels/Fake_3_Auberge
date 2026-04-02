import type {
  MealPlanAvailabilityDto,
  MealPlanCode,
  RoomTypeCode,
} from "../api/bookings.api";

export type BookingSearch = {
  startDate: string | null;
  endDate: string | null;
  rooms: number;
};

export type RoomMealPlan = MealPlanAvailabilityDto;

export type RoomAvailability = {
  id: string;
  code: RoomTypeCode;
  name: string;
  description: string;
  maxCapacity: number;
  basePrice: number;
  availableRooms: number;
  mealPlans: RoomMealPlan[];
};

export type SelectedRoomConfig = {
  id: string;
  offerId: RoomTypeCode;
  roomName: string;
  persons: number;
  roomPrice: number;
  mealPlans: RoomMealPlan[];
  mealPlanCode: MealPlanCode;
};

export type SelectedRoomLine = {
  lineId: string;
  offerId: RoomTypeCode;
  roomName: string;
  persons: number;
  adults: number;
  children: number;
  roomPrice: number;
  mealPlanCode: MealPlanCode;
  mealPlanName: string;
  mealPlanPrice: number;
  totalPrice: number;
  mealPlans: RoomMealPlan[];
};

export const DEFAULT_BOOKING_SEARCH: BookingSearch = {
  startDate: null,
  endDate: null,
  rooms: 1,
};