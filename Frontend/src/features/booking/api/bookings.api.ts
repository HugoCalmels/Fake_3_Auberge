import { getApiUrl, parseApiError } from "@/lib/api/client";

export type MealPlanCode = "room_only" | "half_board" | "full_board";

export type RoomTypeCode =
  | "double"
  | "twin"
  | "quadruple"
  | "familiale"
  | "cinq_places";

export type MealPlanAvailabilityDto = {
  id: string;
  code: MealPlanCode;
  name: string;
  adultPrice: number;
  childPrice: number;
};

export type RoomTypeAvailabilityDto = {
  id: string;
  code: RoomTypeCode;
  name: string;
  description: string;
  maxCapacity: number;
  basePrice: number;
  availableRooms: number;
  mealPlans: MealPlanAvailabilityDto[];
};

export type GetAvailabilityParams = {
  startDate: string;
  endDate: string;
};

export type GetAvailabilityResponse = {
  success: boolean;
  startDate: string;
  endDate: string;
  roomTypes: RoomTypeAvailabilityDto[];
};

export type CreateBookingSelectionPayload = {
  roomTypeId: RoomTypeCode;
  adults: number;
  children: number;
  mealPlanCode: MealPlanCode;
};

export type CreateBookingPayload = {
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
  selections: CreateBookingSelectionPayload[];
};

export type CreateBookingResponse = {
  success: boolean;
  message: string;
  bookingIds: string[];
  roomIds: string[];
  selectionCount: number;
  pricing: {
    nights: number;
    roomPrice: number;
    mealPlanPrice: number;
    totalPrice: number;
  };
};

export async function getBookingAvailability(
  params: GetAvailabilityParams,
): Promise<GetAvailabilityResponse> {
  const search = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const response = await fetch(getApiUrl(`bookings/availability?${search.toString()}`), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(response, "Impossible de recuperer les disponibilites.");
  }

  return response.json();
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<CreateBookingResponse> {
  const response = await fetch(getApiUrl("bookings"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response, "Erreur lors de la creation de la reservation.");
  }

  return response.json();
}
