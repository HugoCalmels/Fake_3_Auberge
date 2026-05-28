import { getApiUrl, parseApiError } from "@/lib/api/client";

export type MealPlanCode = "room_only" | "half_board" | "full_board";
export type BookingPaymentMethod = "card" | "paypal";

export type MealPlanAvailabilityDto = {
  id: string;
  code: MealPlanCode;
  name: string;
  adultPrice: number;
  childPrice: number;
};

export type RoomTypeAvailabilityDto = {
  id: string;
  code: string;
  name: string;
  description: string;
  maxCapacity: number;
  basePrice: number;
  imageUrl?: string | null;
  availableRooms?: number;
  mealPlans?: MealPlanAvailabilityDto[];
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

export type GetPublicRoomTypesResponse =
  | RoomTypeAvailabilityDto[]
  | {
      success: boolean;
      roomTypes: RoomTypeAvailabilityDto[];
    };

export type CreateBookingSelectionPayload = {
  roomTypeId: string;
  adults: number;
  children: number;
  mealPlanCode: MealPlanCode;
};

export type CreateBookingPaymentIntentPayload = {
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  paymentMethod: BookingPaymentMethod;
  selections: CreateBookingSelectionPayload[];
};

export type CreateBookingPaymentIntentResponse = {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
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

export type ConfirmBookingPaymentResponse = {
  success: boolean;
  paymentIntentId: string;
  bookingIds: string[];
};

export type CancelBookingPaymentResponse = {
  success: boolean;
  paymentIntentId: string;
  deletedCount: number;
};

export async function getBookingAvailability(
  params: GetAvailabilityParams,
): Promise<GetAvailabilityResponse> {
  const search = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const response = await fetch(
    getApiUrl(`bookings/availability?${search.toString()}`),
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer les disponibilités.",
    );
  }

  return response.json();
}

export async function getPublicRoomTypes(): Promise<GetPublicRoomTypesResponse> {
  const response = await fetch(getApiUrl("bookings/room-types"), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Impossible de récupérer les chambres.",
    );
  }

  return response.json();
}

export function normalizePublicRoomTypes(
  data: GetPublicRoomTypesResponse,
): RoomTypeAvailabilityDto[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.roomTypes ?? [];
}

export async function createBookingPaymentIntent(
  payload: CreateBookingPaymentIntentPayload,
): Promise<CreateBookingPaymentIntentResponse> {
  const response = await fetch(getApiUrl("payments/booking-payment-intent"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      guestPhone: payload.guestPhone?.trim()
        ? payload.guestPhone.trim()
        : undefined,
    }),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Erreur lors de la préparation du paiement.",
    );
  }

  return response.json();
}

export async function confirmBookingPaymentIntent(
  paymentIntentId: string,
): Promise<ConfirmBookingPaymentResponse> {
  const response = await fetch(getApiUrl("payments/booking-payment-intent/confirm"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentIntentId }),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Paiement reçu, mais confirmation impossible côté serveur.",
    );
  }

  return response.json();
}

export async function cancelBookingPaymentIntent(
  paymentIntentId: string,
): Promise<CancelBookingPaymentResponse> {
  const response = await fetch(getApiUrl("payments/booking-payment-intent/cancel"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentIntentId }),
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      "Paiement échoué, mais nettoyage de la réservation impossible.",
    );
  }

  return response.json();
}