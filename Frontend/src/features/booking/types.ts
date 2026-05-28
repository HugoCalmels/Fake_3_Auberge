import type {
  MealPlanAvailabilityDto,
  MealPlanCode,
} from "@/features/booking/api/bookings.api";

export type BookingSearch = {
  startDate: string | null;
  endDate: string | null;
  rooms: number;
};

export type RoomMealPlan = MealPlanAvailabilityDto;

export type RoomAvailability = {
  id: string;
  code: string;
  name: string;
  description: string;
  maxCapacity: number;
  basePrice: number;
  imageUrl?: string | null;
  availableRooms: number;
  mealPlans: RoomMealPlan[];
};

export type SelectedRoomConfig = {
  id: string;
  offerId: string;
  roomName: string;
  persons: number;
  roomPrice: number;
  mealPlans: RoomMealPlan[];
  mealPlanCode: MealPlanCode;
};

export type SelectedRoomLine = {
  lineId: string;
  offerId: string;
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

export function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}