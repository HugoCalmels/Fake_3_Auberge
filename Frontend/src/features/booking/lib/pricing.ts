import type { RoomAvailability, RoomMealPlan } from "@/features/booking/types";

export function getNights(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const diff = end.getTime() - start.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return nights > 0 ? nights : 0;
}

export function getPersonCount(adults: number, children: number) {
  return adults + children;
}

export function canFitInRoom(params: {
  room: RoomAvailability;
  adults: number;
  children: number;
}) {
  return getPersonCount(params.adults, params.children) <= params.room.maxCapacity;
}

export function calculateRoomOfferPrice(params: {
  room: RoomAvailability;
  mealPlan: RoomMealPlan;
  adults: number;
  children: number;
  startDate: string;
  endDate: string;
}) {
  const { room, mealPlan, adults, children, startDate, endDate } = params;

  const nights = getNights(startDate, endDate);

  const roomPrice = room.basePrice * nights;
  const mealPlanPrice =
    (mealPlan.adultPrice * adults + mealPlan.childPrice * children) * nights;

  return {
    nights,
    roomPrice,
    mealPlanPrice,
    total: roomPrice + mealPlanPrice,
  };
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("fr-FR")} €`;
}

export function formatDateForInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
